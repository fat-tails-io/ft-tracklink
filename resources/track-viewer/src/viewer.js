// Track Viewer - D3.js GeoJSON rendering with brush selection
// Supports GeoJSON, TopoJSON, and SVG formats

// Import styles
import './styles.css';

// Import D3.js locally (not from CDN)
import * as d3 from 'd3';

// Import Forge bridge for events
import { events } from '@forge/bridge';

import {
  buildTrackGeometryIndex,
  extractCenterline,
  GEO_PRECISION,
  roundLonLat,
  sampleSegmentPoints,
  segmentScreenBounds,
  selectSegmentFromBrush,
  selectSegmentFromDistanceRange,
} from './track-geometry';

let width, height;
let canvas, context;
let svgOverlay;
let zoomSurface;
let geoData = null; // GeoJSON/TopoJSON data
let projection, path;
let zoom, brush;
let brushSelection = null;
let isBrushMode = false; // Default mode is pan/zoom
let currentTransform = d3.zoomIdentity;
let resizeObserver = null;
let brushGroupRef = null;
let trackGeometryIndex = null;
let activeTrackSegment = null;
let circuitId = null;

// Initialize the visualization
async function init() {
  // Set up canvas
  canvas = document.getElementById('canvas');
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }
  context = canvas.getContext('2d');

  // Set up SVG overlay for brush
  svgOverlay = d3.select('#brush-overlay');

  // Set canvas size
  const container = canvas.parentElement;
  if (container) {
    zoomSurface = d3.select(container);
    updateCanvasSize(container.clientWidth, container.clientHeight);
  }

  // Set up interactions
  setupInteractions();
  setInteractionMode('pan');
  setupResizeHandling();
  updateStatus('Ready - Waiting for track data');

  // Signal that Frame is ready to receive events
  // This allows UI Kit to know when it's safe to send GeoJSON data
  setTimeout(() => {
    try {
      events.emit('FRAME_READY', { ready: true });
      console.log('Frame ready signal sent');
    } catch (error) {
      console.error('Failed to send ready signal:', error);
    }
  }, 100);

  // Handle cleanup when unloading
  window.addEventListener('beforeunload', () => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    } else {
      window.removeEventListener('resize', handleResize);
    }
  });
}

function getLayoutContainer() {
  return (
    document.querySelector('.track-viewer-container') ||
    canvas?.parentElement?.parentElement ||
    canvas?.parentElement
  );
}

/** Read iframe layout size (Forge Frame often settles height after first paint). */
function measureLayoutSize() {
  const container = getLayoutContainer();
  if (!container) {
    return null;
  }

  const rect = container.getBoundingClientRect();
  const w = Math.round(container.clientWidth || rect.width);
  const h = Math.round(container.clientHeight || rect.height);
  if (!w || !h) {
    return null;
  }
  return { width: w, height: h };
}

function updateCanvasSize(newWidth, newHeight) {
  if (!canvas || !svgOverlay || !newWidth || !newHeight) {
    return false;
  }

  const sizeChanged = newWidth !== width || newHeight !== height;
  width = newWidth;
  height = newHeight;
  canvas.width = width;
  canvas.height = height;
  svgOverlay.attr('width', width).attr('height', height);
  return sizeChanged;
}

function syncBrushExtent() {
  if (brush && brushGroupRef && width && height) {
    brush.extent([[0, 0], [width, height]]);
    brushGroupRef.call(brush);
  }
}

/** Sync canvas bitmap + projection to the current iframe size. */
function syncLayoutFromContainer() {
  const size = measureLayoutSize();
  if (!size) {
    return false;
  }

  const sizeChanged = updateCanvasSize(size.width, size.height);
  syncBrushExtent();

  if (geoData && (sizeChanged || !projection)) {
    updateProjection();
    draw();
    return true;
  }

  return sizeChanged;
}

function scheduleLayoutSync() {
  const run = () => syncLayoutFromContainer();
  requestAnimationFrame(() => {
    run();
    requestAnimationFrame(run);
  });
  setTimeout(run, 0);
  setTimeout(run, 100);
  setTimeout(run, 300);
}

// Handle resize
function handleResize() {
  syncLayoutFromContainer();
}

function resetViewToDefault() {
  if (!canvas) {
    return;
  }

  currentTransform = d3.zoomIdentity;
  zoomSurface?.call(zoom.transform, d3.zoomIdentity);

  resetBrush();
}

function setupResizeHandling() {
  const containers = [
    document.querySelector('.track-viewer-container'),
    canvas?.parentElement,
  ].filter(Boolean);

  if (typeof ResizeObserver === 'function' && containers.length) {
    resizeObserver = new ResizeObserver(() => {
      syncLayoutFromContainer();
    });

    containers.forEach((el) => resizeObserver.observe(el));
  } else {
    window.addEventListener('resize', handleResize);
  }

  scheduleLayoutSync();
}

// Load GeoJSON content
function loadGeoJson(geoJsonContent) {
  try {
    const data = typeof geoJsonContent === 'string'
      ? JSON.parse(geoJsonContent)
      : geoJsonContent;

    if (!data.type || (data.type !== 'FeatureCollection' && data.type !== 'Feature' && data.type !== 'Topology')) {
      throw new Error('Invalid GeoJSON or TopoJSON format');
    }

    // Store geo data
    geoData = data;
    activeTrackSegment = null;

    const centerline = extractCenterline(data);
    circuitId = centerline?.circuitId;
    trackGeometryIndex = centerline
      ? buildTrackGeometryIndex(centerline.coordinates)
      : null;

    console.log('GeoJSON loaded:', {
      type: data.type,
      featureCount: data.type === 'FeatureCollection' ? data.features?.length : 1,
      bounds: d3.geoBounds(data),
      circuitId,
      trackLengthM: trackGeometryIndex?.totalLengthM,
      densifiedVertices: trackGeometryIndex?.coordinates?.length,
    });

    // Reset view so new data fits immediately
    resetViewToDefault();

    scheduleLayoutSync();

    // Set up projection and path generator (re-run after iframe layout settles)
    updateProjection();
    draw();
    updateStatus('Track loaded. Use Pan / Zoom or Brush Select from the toolbar above the map.');
  } catch (error) {
    console.error('Error loading GeoJSON:', error);
    updateStatus(`Error loading track: ${error.message}`);
  }
}

function projectionFitSource() {
  if (!geoData) {
    return null;
  }
  const centerline = extractCenterline(geoData);
  if (!centerline) {
    return geoData;
  }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { role: 'centerline' },
        geometry: { type: 'LineString', coordinates: centerline.coordinates },
      },
    ],
  };
}

// Update D3 projection based on data bounds
function updateProjection() {
  if (!geoData || !width || !height) {
    return;
  }

  const fitSource = projectionFitSource();
  const bounds = d3.geoBounds(fitSource);
  console.log('GeoJSON bounds:', bounds);
  console.log('Canvas size:', width, 'x', height);

  // Create projection
  projection = d3.geoMercator()
    .fitExtent([[20, 20], [width - 20, height - 20]], fitSource)
    .precision(0.1);

  // Create path generator
  path = d3.geoPath().projection(projection).context(context);

  console.log('Projection center:', projection.center());
  console.log('Projection scale:', projection.scale());
}

// Draw the track on canvas
function draw() {
  if (!geoData || !context) {
    console.warn('Cannot draw: missing data', { geoData: !!geoData, context: !!context, path: !!path });
    return;
  }

  if (!width || !height) {
    scheduleLayoutSync();
    return;
  }

  if (!projection || !path) {
    updateProjection();
  }

  if (!projection || !path) {
    return;
  }

  console.log('Drawing track...');

  // Clear canvas
  context.clearRect(0, 0, width, height);

  // Save context for transformations
  context.save();

  // Apply zoom transform
  if (currentTransform && currentTransform.k !== 1) {
    context.translate(currentTransform.x, currentTransform.y);
    context.scale(currentTransform.k, currentTransform.k);
  }

  // Set drawing style - make track more visible
  context.strokeStyle = '#1a1a1a'; // Dark color for better visibility
  context.lineWidth = 3; // Thicker line
  context.fillStyle = 'rgba(0, 82, 204, 0.1)'; // Light blue fill for visibility

  const drawCenterlinePath = (feature) => {
    context.beginPath();
    path(feature);
    context.lineWidth = 3;
    context.strokeStyle = '#1a1a1a';
    context.stroke();
  };

  const drawHighlightedSegment = () => {
    if (!activeTrackSegment || !trackGeometryIndex || !projection) {
      return;
    }

    const { indexStart, indexEnd, coordinates } = activeTrackSegment;
    const segmentCoords = coordinates.slice(indexStart, indexEnd + 1);
    const segmentFeature = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: segmentCoords },
    };

    context.beginPath();
    path(segmentFeature);
    context.lineWidth = 5;
    context.strokeStyle = '#0052cc';
    context.stroke();
  };

  // Draw GeoJSON features (centerline + optional corner points)
  const drawFeature = (feature) => {
    const role = feature.properties?.role;
    const geomType = feature.geometry?.type;

    if (role === 'centerline_detail' || role === 'marshal_light' || role === 'marshal_sector') {
      return;
    }

    if (geomType === 'Point' && role === 'corner') {
      const projected = projection(feature.geometry.coordinates);
      if (!projected) return;
      const scale = currentTransform?.k ?? 1;
      const radius = Math.max(3, 4 * scale);
      context.beginPath();
      context.arc(projected[0], projected[1], radius, 0, 2 * Math.PI);
      context.fillStyle = 'rgba(222, 53, 11, 0.85)';
      context.fill();
      context.strokeStyle = '#ffffff';
      context.lineWidth = 1;
      context.stroke();
      context.fillStyle = 'rgba(0, 82, 204, 0.1)';
      return;
    }

    if (role === 'centerline' || (geomType === 'LineString' && !role)) {
      drawCenterlinePath(feature);
      return;
    }

    if (geomType === 'LineString') {
      drawCenterlinePath(feature);
    }
  };

  if (geoData.type === 'FeatureCollection') {
    geoData.features.forEach(drawFeature);
  } else if (geoData.type === 'Feature') {
    drawFeature(geoData);
  }

  drawHighlightedSegment();

  // Restore context
  context.restore();
}

// Set up zoom and brush interactions
function setupInteractions() {
  // Set up zoom behavior
  zoom = d3.zoom()
    .scaleExtent([0.5, 80])
    .filter((event) => {
      // Disable zoom interactions while Shift (brush mode) is active
      return !isBrushMode;
    })
    .on('zoom', (event) => {
      currentTransform = event.transform;
      draw();
    });

  // Apply zoom to the container so events are always captured
  zoomSurface?.call(zoom);

  // Set initial transform
  zoomSurface?.call(zoom.transform, d3.zoomIdentity);
  currentTransform = d3.zoomIdentity;

  // Create brush group in SVG overlay (hidden by default)
  brushGroupRef = svgOverlay
    .append('g')
    .attr('class', 'brush-group')
    .style('display', 'none');

  // Set up brush behavior
  let ignoreBrushEvents = false;

  brush = d3.brush()
    .extent([[0, 0], [width, height]])
    .on('start', (event) => {
      if (ignoreBrushEvents || !isBrushMode) return;
      updateStatus('Brush started');
    })
    .on('brush', (event) => {
      if (ignoreBrushEvents || !isBrushMode) return;
      if (event.selection) {
        brushSelection = event.selection;
        updateActiveSegmentFromBrush(event.selection);
        draw();
        updateStatus('Brush active');
      }
    })
    .on('end', (event) => {
      if (ignoreBrushEvents) {
        ignoreBrushEvents = false;
        return;
      }
      if (!isBrushMode) {
        brushSelection = null;
        draw();
        return;
      }
      if (event.selection) {
        brushSelection = event.selection;
        handleBrushSelection(event.selection);
        updateStatus('Brush selection complete');
      } else {
        brushSelection = null;
        draw();
        updateStatus('Brush cleared');
      }
    });

  // Apply brush to the SVG group
  brushGroupRef.call(brush);

  // Style the brush selection
  brushGroupRef.selectAll('.selection')
    .attr('fill', 'rgba(0, 82, 204, 0.1)')
    .attr('stroke', '#0052cc')
    .attr('stroke-width', '2px')
    .attr('stroke-dasharray', '4,4');

  brushGroupRef.selectAll('.handle')
    .attr('fill', '#0052cc')
    .attr('stroke', '#fff')
    .attr('stroke-width', '2px')
    .attr('rx', '3px')
    .attr('ry', '3px');

  // Clear any initial brush selection
  ignoreBrushEvents = true;
  brushGroupRef.call(brush.move, null);
  brushSelection = null;
  setTimeout(() => {
    ignoreBrushEvents = false;
  }, 100);
}

function setInteractionMode(mode) {
  const enableBrush = mode === 'brush';

  if (enableBrush === isBrushMode) {
    return;
  }

  isBrushMode = enableBrush;
  svgOverlay?.classed('brush-active', enableBrush);
  if (brushGroupRef) {
    brushGroupRef.style('display', enableBrush ? null : 'none');
  }

  resetBrush();

  if (enableBrush) {
    updateStatus('Brush Select — drag a box over the track (near the line is OK).');
  } else {
    updateStatus('Pan / Zoom — drag to pan, scroll to zoom.');
  }
}

function resetBrush() {
  brushSelection = null;
  activeTrackSegment = null;
  if (brush && brushGroupRef) {
    brushGroupRef.call(brush.move, null);
  }
}

function brushRectFromSelection(selection) {
  const [[x0, y0], [x1, y1]] = selection;
  return {
    minX: Math.min(x0, x1),
    minY: Math.min(y0, y1),
    maxX: Math.max(x0, x1),
    maxY: Math.max(y0, y1),
  };
}

function updateActiveSegmentFromBrush(selection) {
  if (!selection || !trackGeometryIndex || !projection) {
    activeTrackSegment = null;
    return;
  }

  activeTrackSegment = selectSegmentFromBrush(
    trackGeometryIndex,
    projection,
    brushRectFromSelection(selection),
    currentTransform,
  );
}

// Generate thumbnail from canvas viewport
function generateThumbnail(viewport) {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary canvas for the thumbnail
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 400;
      thumbCanvas.height = (400 * viewport.height) / viewport.width;

      const thumbCtx = thumbCanvas.getContext('2d');
      if (!thumbCtx) {
        reject(new Error('Failed to get thumbnail canvas context'));
        return;
      }

      // Calculate source coordinates accounting for transforms
      const srcX = viewport.x;
      const srcY = viewport.y;
      const srcWidth = viewport.width;
      const srcHeight = viewport.height;

      // Draw the selected area from the main canvas
      thumbCtx.drawImage(
        canvas,
        srcX,
        srcY,
        srcWidth,
        srcHeight,
        0,
        0,
        thumbCanvas.width,
        thumbCanvas.height
      );

      // Convert to base64
      const base64 = thumbCanvas.toDataURL('image/png');
      resolve(base64);
    } catch (error) {
      reject(error);
    }
  });
}

function applyHighlightFromPayload(eventData) {
  if (!eventData?.trackRelative || !trackGeometryIndex) {
    activeTrackSegment = null;
    if (geoData) {
      draw();
    }
    return;
  }

  const { startDistanceM, endDistanceM } = eventData.trackRelative;
  const segment = selectSegmentFromDistanceRange(
    trackGeometryIndex,
    startDistanceM,
    endDistanceM,
  );

  activeTrackSegment = segment;
  if (geoData) {
    draw();
  }

  if (segment) {
    updateStatus(
      `Showing saved segment ${startDistanceM.toFixed(0)}–${endDistanceM.toFixed(0)} m along track.`,
    );
  }
}

// Emit status to UI Kit (status line lives outside the Frame)
function updateStatus(message) {
  try {
    events.emit('VIEWER_STATUS', { message });
  } catch (error) {
    console.error('Failed to emit viewer status:', error);
  }
}

// Listen for Forge bridge events
async function initForgeBridge() {
  try {
    // Listen for GeoJSON load event
    const geoJsonSubscription = await events.on('GEOJSON_LOAD', (eventData) => {
      console.log('GEOJSON_LOAD event received:', eventData);
      if (eventData && eventData.geoJsonContent) {
        console.log('Loading GeoJSON from event...');
        loadGeoJson(eventData.geoJsonContent);
      } else {
        console.warn('GEOJSON_LOAD event missing geoJsonContent:', eventData);
      }
    });

    // Listen for SVG load event (for backward compatibility)
    const svgSubscription = await events.on('SVG_LOAD', (eventData) => {
      console.warn('SVG_LOAD event received but GeoJSON is expected. Use GEOJSON_LOAD instead.');
    });

    // Listen for TRACK_RESET event
    const resetSubscription = await events.on('TRACK_RESET', () => {
      resetViewToDefault();
      setInteractionMode('pan');
      activeTrackSegment = null;
      if (geoData) {
        updateProjection();
        draw();
      }
      updateStatus('View reset.');
    });

    const modeSubscription = await events.on('VIEWER_SET_MODE', (eventData) => {
      const mode = eventData?.mode === 'brush' ? 'brush' : 'pan';
      setInteractionMode(mode);
    });

    const highlightSubscription = await events.on('HIGHLIGHT_SEGMENT', (eventData) => {
      applyHighlightFromPayload(eventData);
    });

    // Store subscriptions for cleanup if needed
    window._forgeSubscriptions = {
      geoJson: geoJsonSubscription,
      svg: svgSubscription,
      reset: resetSubscription,
      mode: modeSubscription,
      highlight: highlightSubscription,
    };
  } catch (error) {
    console.error('Failed to initialize Forge bridge:', error);
  }
}

function buildTrackPropertiesPayload(segment) {
  const centerline = extractCenterline(geoData);
  const base = centerline?.properties || {};
  if (!segment) {
    return base;
  }
  return {
    ...base,
    circuitId: circuitId || base.circuitId,
  };
}

function emitTrackSectionSelected(payload) {
  events.emit('TRACK_SECTION_SELECTED', payload);
}

// Handle brush selection - emit event to Forge bridge
function handleBrushSelection(selection) {
  if (!selection || !geoData || !projection) {
    return;
  }

  const brushRect = brushRectFromSelection(selection);
  const minX = brushRect.minX;
  const minY = brushRect.minY;
  const maxX = brushRect.maxX;
  const maxY = brushRect.maxY;

  const screenCoords = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };

  updateActiveSegmentFromBrush(selection);
  const segment = activeTrackSegment;

  if (!segment) {
    updateStatus('No track in selection — drag a box over or beside the circuit line.');
    draw();
    return;
  }

  const start = roundLonLat(segment.start);
  const end = roundLonLat(segment.end);

  const geoCoords = {
    topLeft: start,
    bottomRight: end,
    start,
    end,
  };

  const geo = {
    start,
    end,
    precision: GEO_PRECISION,
  };

  const trackRelative = {
    startDistanceM: Math.round(segment.startDistanceM * 10) / 10,
    endDistanceM: Math.round(segment.endDistanceM * 10) / 10,
    totalCircuitLengthM: Math.round(segment.totalCircuitLengthM * 10) / 10,
    segmentLengthM: Math.round(segment.segmentLengthM * 10) / 10,
  };

  const sampledPoints = sampleSegmentPoints(segment);

  const viewport =
    segmentScreenBounds(segment, projection, currentTransform) || {
      x: (minX - currentTransform.x) / currentTransform.k,
      y: (minY - currentTransform.y) / currentTransform.k,
      width: (maxX - minX) / currentTransform.k,
      height: (maxY - minY) / currentTransform.k,
      scale: currentTransform.k,
    };

  const trackProperties = buildTrackPropertiesPayload(segment);

  const basePayload = {
    circuitId: circuitId || trackProperties.circuitId,
    viewport,
    screenCoords,
    geoCoords,
    geo,
    trackRelative,
    sampledPoints,
    trackProperties,
  };

  const statusMsg = `Selected ${trackRelative.segmentLengthM.toFixed(0)} m along track (${trackRelative.startDistanceM.toFixed(0)}–${trackRelative.endDistanceM.toFixed(0)} m).`;
  updateStatus(statusMsg);

  generateThumbnail(viewport)
    .then((thumbnailData) => {
      emitTrackSectionSelected({ ...basePayload, thumbnailData });
    })
    .catch((error) => {
      console.error('Failed to generate thumbnail:', error);
      emitTrackSectionSelected({ ...basePayload, thumbnailData: '' });
    });
}

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    initForgeBridge();
  });
} else {
  init();
  initForgeBridge();
}
