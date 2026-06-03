// Track Viewer - D3.js GeoJSON rendering with brush selection
// Supports GeoJSON, TopoJSON, and SVG formats

// Import styles
import './styles.css';

// Import D3.js locally (not from CDN)
import * as d3 from 'd3';

// Import Forge bridge for events
import { events } from '@forge/bridge';

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

function updateCanvasSize(newWidth, newHeight) {
  if (!canvas || !svgOverlay || !newWidth || !newHeight) {
    return;
  }

  width = newWidth;
  height = newHeight;
  canvas.width = width;
  canvas.height = height;
  svgOverlay.attr('width', width).attr('height', height);
}

// Handle resize
function handleResize() {
  const container = canvas?.parentElement;
  if (!container) {
    return;
  }

  updateCanvasSize(container.clientWidth, container.clientHeight);

  if (brush) {
    brush.extent([[0, 0], [width, height]]);
    if (brushGroupRef) {
      brushGroupRef.call(brush);
    }
  }

  if (geoData) {
    updateProjection();
    draw();
  }
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
  const container = canvas?.parentElement;

  if (typeof ResizeObserver === 'function' && container) {
    resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (!newWidth || !newHeight) {
          return;
        }

        const sizeChanged = newWidth !== width || newHeight !== height;
        updateCanvasSize(newWidth, newHeight);

        if (sizeChanged) {
          if (brush && brushGroupRef) {
            brush.extent([[0, 0], [width, height]]);
            brushGroupRef.call(brush);
          }

          if (geoData) {
            updateProjection();
            draw();
          }
        }
      });
    });

    resizeObserver.observe(container);
  } else {
    window.addEventListener('resize', handleResize);
  }
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
    console.log('GeoJSON loaded:', {
      type: data.type,
      featureCount: data.type === 'FeatureCollection' ? data.features?.length : 1,
      bounds: d3.geoBounds(data)
    });

    // Reset view so new data fits immediately
    resetViewToDefault();

    // Set up projection and path generator
    updateProjection();

    // Draw the track
    draw();
    updateStatus('Track loaded. Use Pan / Zoom or Brush Select from the toolbar above the map.');
  } catch (error) {
    console.error('Error loading GeoJSON:', error);
    updateStatus(`Error loading track: ${error.message}`);
  }
}

// Update D3 projection based on data bounds
function updateProjection() {
  if (!geoData) return;

  // Calculate bounds from GeoJSON
  const bounds = d3.geoBounds(geoData);
  console.log('GeoJSON bounds:', bounds);
  console.log('Canvas size:', width, 'x', height);

  // Create projection
  projection = d3.geoMercator()
    .fitExtent([[20, 20], [width - 20, height - 20]], geoData)
    .precision(0.1);

  // Create path generator
  path = d3.geoPath().projection(projection).context(context);

  console.log('Projection center:', projection.center());
  console.log('Projection scale:', projection.scale());
}

// Draw the track on canvas
function draw() {
  if (!geoData || !context || !path) {
    console.warn('Cannot draw: missing data', { geoData: !!geoData, context: !!context, path: !!path });
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

  // Draw GeoJSON features (centerline + optional corner points)
  const drawFeature = (feature) => {
    const role = feature.properties?.role;
    const geomType = feature.geometry?.type;

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

    context.beginPath();
    path(feature);
    if (role === 'centerline' || geomType === 'LineString') {
      context.lineWidth = 3;
      context.strokeStyle = '#1a1a1a';
    }
    context.fill();
    context.stroke();
    context.lineWidth = 3;
    context.strokeStyle = '#1a1a1a';
    context.fillStyle = 'rgba(0, 82, 204, 0.1)';
  };

  if (geoData.type === 'FeatureCollection') {
    geoData.features.forEach(drawFeature);
  } else if (geoData.type === 'Feature') {
    drawFeature(geoData);
  }

  // Restore context
  context.restore();
}

// Set up zoom and brush interactions
function setupInteractions() {
  // Set up zoom behavior
  zoom = d3.zoom()
    .scaleExtent([0.5, 20])
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
    updateStatus('Brush Select — drag on the map to select an area.');
  } else {
    updateStatus('Pan / Zoom — drag to pan, scroll to zoom.');
  }
}

function resetBrush() {
  brushSelection = null;
  if (brush && brushGroupRef) {
    brushGroupRef.call(brush.move, null);
  }
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

    // Store subscriptions for cleanup if needed
    window._forgeSubscriptions = {
      geoJson: geoJsonSubscription,
      svg: svgSubscription,
      reset: resetSubscription,
      mode: modeSubscription,
    };
  } catch (error) {
    console.error('Failed to initialize Forge bridge:', error);
  }
}

// Handle brush selection - emit event to Forge bridge
function handleBrushSelection(selection) {
  if (!selection || !geoData || !projection) {
    return;
  }

  const [[x0, y0], [x1, y1]] = selection;
  const minX = Math.min(x0, x1);
  const minY = Math.min(y0, y1);
  const maxX = Math.max(x0, x1);
  const maxY = Math.max(y0, y1);

  // Calculate screen coordinates
  const screenCoords = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };

  // Convert screen coordinates to geographic coordinates
  // Account for zoom transform
  const geoCoords = {
    topLeft: projection.invert([(minX - currentTransform.x) / currentTransform.k, (minY - currentTransform.y) / currentTransform.k]),
    bottomRight: projection.invert([(maxX - currentTransform.x) / currentTransform.k, (maxY - currentTransform.y) / currentTransform.k]),
  };

  // Calculate viewport (accounting for zoom)
  const viewport = {
    x: (minX - currentTransform.x) / currentTransform.k,
    y: (minY - currentTransform.y) / currentTransform.k,
    width: (maxX - minX) / currentTransform.k,
    height: (maxY - minY) / currentTransform.k,
    scale: currentTransform.k,
  };

  // Get track properties from GeoJSON
  const trackProperties = geoData.type === 'FeatureCollection' && geoData.features.length > 0
    ? geoData.features[0].properties
    : (geoData.properties || {});

  // Generate thumbnail from canvas
  generateThumbnail(viewport).then((thumbnailData) => {
    // Emit event to UI Kit via Forge bridge
    events.emit('TRACK_SECTION_SELECTED', {
      viewport: viewport,
      screenCoords: screenCoords,
      geoCoords: geoCoords,
      trackProperties: trackProperties,
      thumbnailData: thumbnailData,
    });
  }).catch((error) => {
    console.error('Failed to generate thumbnail:', error);
    // Still emit event without thumbnail
    events.emit('TRACK_SECTION_SELECTED', {
      viewport: viewport,
      screenCoords: screenCoords,
      geoCoords: geoCoords,
      trackProperties: trackProperties,
      thumbnailData: '',
    });
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
