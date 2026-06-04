#!/usr/bin/env python3
"""
Layer 2 ETL: transpose FastF1 / MultiViewer detail (X, Y) onto f1-circuits WGS84 centerline.

Usage:
  pip install -r requirements-dev.txt
  python tools/transpose-circuit-detail.py --discover
  python tools/transpose-circuit-detail.py gb-1948 ae-2009
  python tools/transpose-circuit-detail.py --all-mapped

Writes enriched FeatureCollection to resources/tracks/{circuitId}.geojson
Sync to Forge bundle: cp resources/tracks/*.geojson src/data/tracks/*.json

Licensing: FastF1 MIT; CircuitInfo from MultiViewer per FastF1 docs.
See LICENSE/fastf1-multiviewer.md and src/data/tracks/README.md.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np

REPO_ROOT = Path(__file__).resolve().parents[1]
TRACKS_DIR = REPO_ROOT / "resources" / "tracks"
MAP_PATH = REPO_ROOT / "src" / "data" / "fastf1-circuit-map.json"
EARTH_RADIUS_M = 6_371_000
# Cap detail vertices to keep KVS bundle reasonable
MAX_DETAIL_VERTICES = 800


def haversine_m(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    rlat1, rlat2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlon / 2) ** 2
    )
    return 2 * EARTH_RADIUS_M * math.asin(min(1.0, math.sqrt(a)))


def cumulative_lengths_m(coords: list[list[float]]) -> np.ndarray:
    """coords: [[lon, lat], ...] -> cumulative distance from start in metres."""
    if len(coords) < 2:
        return np.zeros(len(coords))
    seg = [
        haversine_m(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1])
        for i in range(len(coords) - 1)
    ]
    return np.concatenate([[0.0], np.cumsum(seg)])


def cumulative_lengths_xy(xy: np.ndarray) -> np.ndarray:
    if len(xy) < 2:
        return np.zeros(len(xy))
    d = np.sqrt(np.sum(np.diff(xy, axis=0) ** 2, axis=1))
    return np.concatenate([[0.0], np.cumsum(d)])


def interpolate_at_fraction(
    coords: list[list[float]], cum: np.ndarray, fraction: float
) -> list[float]:
    total = cum[-1]
    if total <= 0:
        return [coords[0][0], coords[0][1]]
    target = fraction * total
    idx = int(np.searchsorted(cum, target, side="right")) - 1
    idx = max(0, min(idx, len(coords) - 2))
    seg_len = cum[idx + 1] - cum[idx]
    t = 0.0 if seg_len <= 0 else (target - cum[idx]) / seg_len
    lon = coords[idx][0] + t * (coords[idx + 1][0] - coords[idx][0])
    lat = coords[idx][1] + t * (coords[idx + 1][1] - coords[idx][1])
    return [lon, lat]


def rotate_xy(xy: np.ndarray, angle_deg: float) -> np.ndarray:
    rot = math.radians(angle_deg)
    c, s = math.cos(rot), math.sin(rot)
    j = np.array([[c, s], [-s, c]])
    return xy @ j


def fraction_on_polyline(xy: np.ndarray, point: np.ndarray) -> float:
    cum = cumulative_lengths_xy(xy)
    total = cum[-1]
    if total <= 0:
        return 0.0
    best_i = 0
    best_d2 = float("inf")
    for i in range(len(xy) - 1):
        a, b = xy[i], xy[i + 1]
        ab = b - a
        denom = float(np.dot(ab, ab))
        t = 0.0 if denom <= 0 else float(np.clip(np.dot(point - a, ab) / denom, 0.0, 1.0))
        proj = a + t * ab
        d2 = float(np.sum((point - proj) ** 2))
        if d2 < best_d2:
            best_d2 = d2
            along = cum[i] + t * (cum[i + 1] - cum[i])
            best_i = along
    return best_i / total


def load_base_geojson(circuit_id: str) -> tuple[dict, list[list[float]]]:
    path = TRACKS_DIR / f"{circuit_id}.geojson"
    if not path.exists():
        raise FileNotFoundError(path)
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    centerline = None
    for feat in data.get("features", []):
        if feat.get("geometry", {}).get("type") == "LineString":
            centerline = feat
            break
    if centerline is None:
        raise ValueError(f"No LineString in {path}")
    coords = centerline["geometry"]["coordinates"]
    return data, coords


def marker_features(
    df,
    detail_xy: np.ndarray,
    geo_coords: list[list[float]],
    geo_cum: np.ndarray,
    circuit_id: str,
    role: str,
    source: str,
) -> list[dict]:
    features = []
    for _, row in df.iterrows():
        pt = np.array([float(row["X"]), float(row["Y"])])
        frac = fraction_on_polyline(detail_xy, pt)
        lonlat = interpolate_at_fraction(geo_coords, geo_cum, frac)
        letter = str(row.get("Letter") or "").strip()
        number = int(row["Number"])
        name = f"Turn {number}{letter}" if role == "corner" else f"{role} {number}{letter}"
        props = {
            "role": role,
            "number": number,
            "circuitId": circuit_id,
            "name": name,
            "source": source,
            "detailFraction": round(frac, 6),
        }
        if letter:
            props["letter"] = letter
        if role == "corner" and not math.isnan(row.get("Angle", float("nan"))):
            props["angle"] = float(row["Angle"])
        dist = row.get("Distance")
        if dist is not None and not (isinstance(dist, float) and math.isnan(dist)):
            props["distanceAlongM"] = round(float(dist), 2)
        geo_dist = frac * geo_cum[-1]
        props["distanceAlongMGeo"] = round(geo_dist, 2)
        features.append(
            {
                "type": "Feature",
                "properties": props,
                "geometry": {"type": "Point", "coordinates": lonlat},
            }
        )
    return features


def enrich_circuit(circuit_id: str, mapping: dict) -> dict:
    import fastf1

    fastf1.set_log_level("WARNING")

    cfg = mapping[circuit_id]
    year = int(cfg["referenceYear"])
    event = cfg["event"]
    session_type = cfg.get("session", "R")

    base_fc, geo_coords = load_base_geojson(circuit_id)
    geo_cum = cumulative_lengths_m(geo_coords)

    session = fastf1.get_session(year, event, session_type)
    session.load()
    circuit_info = session.get_circuit_info()
    if circuit_info is None:
        raise RuntimeError(f"No CircuitInfo for {circuit_id} ({year} {event})")

    lap = session.laps.pick_fastest()
    circuit_info.add_marker_distance(lap)
    pos = lap.get_pos_data()
    rotation = float(circuit_info.rotation)
    xy = pos.loc[:, ["X", "Y"]].to_numpy()
    xy = rotate_xy(xy, rotation)

    # Drop duplicate consecutive points
    keep = [0]
    for i in range(1, len(xy)):
        if np.sum((xy[i] - xy[keep[-1]]) ** 2) > 1e-6:
            keep.append(i)
    detail_xy = xy[keep]

    step = max(1, len(detail_xy) // MAX_DETAIL_VERTICES)
    detail_sample = detail_xy[::step]
    detail_line_geo = [
        interpolate_at_fraction(
            geo_coords, geo_cum, fraction_on_polyline(detail_xy, p)
        )
        for p in detail_sample
    ]

    centerline_feat = None
    other_features = []
    for feat in base_fc.get("features", []):
        if feat.get("geometry", {}).get("type") == "LineString" and centerline_feat is None:
            props = {**(feat.get("properties") or {}), "role": "centerline", "circuitId": circuit_id}
            centerline_feat = {**feat, "properties": props}
        else:
            other_features.append(feat)

    if centerline_feat is None:
        raise ValueError("centerline feature missing")

    meta = {
        "referenceYear": year,
        "referenceEvent": event,
        "referenceSession": session_type,
        "circuitKey": session.session_info.get("CircuitKey"),
        "rotation": rotation,
        "geoLengthM": round(float(geo_cum[-1]), 2),
        "accuracyTier": "operational",
        "layer2Source": "fastf1-multiviewer",
    }

    features = [
        centerline_feat,
        {
            "type": "Feature",
            "properties": {
                "role": "centerline_detail",
                "circuitId": circuit_id,
                "source": "fastf1-telemetry-transposed",
                **meta,
            },
            "geometry": {"type": "LineString", "coordinates": detail_line_geo},
        },
    ]
    features.extend(
        marker_features(
            circuit_info.corners,
            detail_xy,
            geo_coords,
            geo_cum,
            circuit_id,
            "corner",
            "fastf1-circuit-info",
        )
    )
    features.extend(
        marker_features(
            circuit_info.marshal_sectors,
            detail_xy,
            geo_coords,
            geo_cum,
            circuit_id,
            "marshal_sector",
            "fastf1-circuit-info",
        )
    )
    features.extend(
        marker_features(
            circuit_info.marshal_lights,
            detail_xy,
            geo_coords,
            geo_cum,
            circuit_id,
            "marshal_light",
            "fastf1-circuit-info",
        )
    )
    features.extend(other_features)

    out = {
        "type": "FeatureCollection",
        "name": circuit_id,
        "properties": meta,
        "features": features,
    }
    if base_fc.get("bbox"):
        out["bbox"] = base_fc["bbox"]
    return out


def discover_keys(mapping: dict) -> None:
    import fastf1

    fastf1.set_log_level("WARNING")
    for circuit_id, cfg in mapping.items():
        year = int(cfg["referenceYear"])
        event = cfg["event"]
        session_type = cfg.get("session", "R")
        session = fastf1.get_session(year, event, session_type)
        session.load()
        info = session.session_info
        print(
            f"{circuit_id}: CircuitKey={info.get('CircuitKey')} "
            f"Location={info.get('Location')} Name={info.get('CircuitName')}"
        )


def main() -> int:
    parser = argparse.ArgumentParser(description="Transpose FastF1 detail onto WGS84 tracks")
    parser.add_argument("circuit_ids", nargs="*", help="e.g. gb-1948 ae-2009")
    parser.add_argument("--all-mapped", action="store_true", help="Process every entry in map JSON")
    parser.add_argument("--discover", action="store_true", help="Print CircuitKey per mapped circuit")
    args = parser.parse_args()

    with MAP_PATH.open(encoding="utf-8") as f:
        mapping = json.load(f)

    if args.discover:
        discover_keys(mapping)
        return 0

    ids = list(mapping.keys()) if args.all_mapped else args.circuit_ids
    if not ids:
        parser.print_help()
        return 1

    for circuit_id in ids:
        if circuit_id not in mapping:
            print(f"Unknown circuitId: {circuit_id}", file=sys.stderr)
            return 1
        print(f"Enriching {circuit_id}...")
        enriched = enrich_circuit(circuit_id, mapping)
        out_path = TRACKS_DIR / f"{circuit_id}.geojson"
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(enriched, f, separators=(",", ":"))
        corner_count = sum(
            1 for ft in enriched["features"] if ft.get("properties", {}).get("role") == "corner"
        )
        size_kb = out_path.stat().st_size / 1024
        print(f"  -> {out_path} ({corner_count} corners, {size_kb:.1f} KB)")

    print("\nSync to Forge bundle:")
    print("  cp resources/tracks/gb-1948.geojson src/data/tracks/gb-1948.json")
    print("  cp resources/tracks/ae-2009.geojson src/data/tracks/ae-2009.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
