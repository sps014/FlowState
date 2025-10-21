// =================== Global State Variables ===================

// DOM Elements
let canvasEl = null;
let gridEl = null;
let flowContentEl = null;
let edgeHoverDetectorEl = null;
let edgesSvgEl = null;
let dotnetRef = null;
let jsEdgePathFunctionName = null;

// Canvas State
let offsetX = 0;
let offsetY = 0;
let zoom = 1;
let minZoom = 0.2;
let maxZoom = 2.0;

// Interaction State
let isPanning = false;
let isNodeDragging = false;
let isConnectingNodes = false;
let isRectangleSelecting = false;
let isGroupNodeDragging = false;
let groupedNodes = new Set();

// Panning State
let startX = 0;
let startY = 0;
let lastOffsetX = 0;
let lastOffsetY = 0;

// Node Dragging State
let selectedNodes = new Set();
let dragStartPositions = new Map();
let lastMouseX = 0;
let lastMouseY = 0;


// Edge Hover State
let hoveredEdgeEl = null;

// Rectangle Selection State
let rectangleSelectionStartX = 0;
let rectangleSelectionStartY = 0;
let rectangleSelectionElement = null;

// Edge Connection State
let tempEdgeStartPosition = null;
let tempEdgeStopPosition = null;
let tempSocket = null;
let tempEdgeElement = null;

// Long Press State
let longPressTimer = null;
let longPressStartX = 0;
let longPressStartY = 0;
const LONG_PRESS_DURATION = 1000; // milliseconds
const LONG_PRESS_MOVE_THRESHOLD = 10; // pixels

// Edge Management
let nodeEdgeMap = new Map(); // Map<NodeEl, Edges[]>
let edgeSocketsMap = new Map(); // Map<EdgeEl, {to: SocketEl, from: SocketEl}>

// Configuration
let nodeSelectionClass = "selected";
let autoUpdateSocketColors = false;
let panKey = "alt"; // "shift", "ctrl", "alt", or "meta"
let isReadOnly = false;

// Cache
let cacheGridBackgroundSize = null;
let cacheGridSizeMatrix = null;

// =================== Initialization & Cleanup ===================

/**
 * Sets up canvas event listeners and initializes the canvas
 */
export function setupCanvasEvents(elements, dotnetReference) {
  canvasEl = elements.canvasElement;
  flowContentEl = elements.flowContentElement;
  gridEl = elements.gridElement;
  rectangleSelectionElement = elements.selectionRectElement;
  edgeHoverDetectorEl = elements.edgeHoverDetectorElement;
  edgesSvgEl = elements.edgesSvgElement;
  dotnetRef = dotnetReference;

  const style = window.getComputedStyle(gridEl);
  cacheGridBackgroundSize = style.backgroundSize;

  // Make canvas focusable for keyboard events
  canvasEl.tabIndex = -1;
  canvasEl.style.outline = 'none';

  canvasEl.addEventListener("pointerdown", pointerdown);
  canvasEl.addEventListener("pointermove", pointermove);
  canvasEl.addEventListener("pointerup", pointerup);
  canvasEl.addEventListener("pointerleave", pointerleave);
  canvasEl.addEventListener("wheel", onWheel);
  canvasEl.addEventListener("contextmenu", onContextMenu);
  canvasEl.addEventListener("keydown", onKeyDown);
  
  // Setup edge hover detection on SVG container
  setupEdgeHoverDetection();
}

/**
 * Removes canvas event listeners
 */
export function removeCanvasEvents(el) {
  el.removeEventListener("pointerdown", pointerdown);
  el.removeEventListener("pointermove", pointermove);
  el.removeEventListener("pointerup", pointerup);
  el.removeEventListener("pointerleave", pointerleave);
  el.removeEventListener("wheel", onWheel);
  el.removeEventListener("contextmenu", onContextMenu);
  el.removeEventListener("keydown", onKeyDown);
}

/**
 * Sets component-level properties
 */
export function setComponentProperties(props) {
  nodeSelectionClass = props.nodeSelectionClass || "selected";
  autoUpdateSocketColors = props.autoUpdateSocketColors || false;
  jsEdgePathFunctionName = props.jsEdgePathFunctionName || null;
  panKey = (props.panKey || "alt").toLowerCase();
  isReadOnly = props.isReadOnly || false;
}

/**
 * Sets read-only mode
 */
export function setReadOnly(readOnly) {
  isReadOnly = readOnly;
}

// =================== Pointer Event Handlers ===================

/**
 * Checks if the pan modifier key is pressed
 */
function isPanKeyPressed(e) {
  switch (panKey) {
    case "shift":
      return e.shiftKey;
    case "ctrl":
      return e.ctrlKey;
    case "alt":
      return e.altKey;
    case "meta":
      return e.metaKey;
    default:
      return e.altKey; // default to alt
  }
}

/**
 * Checks if the multi-selection modifier key is pressed (Ctrl/Cmd for additive selection)
 */
function isMultiSelectionKeyPressed(e) {
  return e.ctrlKey || e.metaKey; // Ctrl on Windows/Linux, Cmd on Mac
}

function pointerdown(e) {
  // Prevent event bubbling to parent elements

  e.stopPropagation();
  
  // Focus canvas to enable keyboard events (delete, arrows, etc.)
  canvasEl?.focus();


  const socket = getClickedSocket(e);
  const node = getClickedNode(e);

  if (socket) {
    // Don't start connection from interactive elements or in read-only mode
    if (isInteractiveElement(e.target) || isReadOnly) {
      return;
    }
    startLongPress(e, socket);
    tempSocket = socket;
    startTempConnection(e, socket);
  } else if (node) {
    // Always allow selection
    handleNodeSelection(node, e);
    
    // Only start dragging if not clicking on interactive elements and not in read-only mode
    if (!isInteractiveElement(e.target) && !isReadOnly) {
      dragNodeStart(e, node);
    }
  } else {
    // Clicking on canvas background
    if (isPanKeyPressed(e)) {
      // Pan key pressed → pan canvas
      panStart(e);
    } else {
      // No pan key → rectangle selection (only if not read-only)
      if (!isReadOnly) {
        startRectangleSelection(e);
      }
    }
  }
}

function pointermove(e) {
  // Prevent event bubbling to parent elements
  e.stopPropagation();
  
  checkLongPressMove(e);
  
  if (isConnectingNodes) {
    updateTempConnection(e);
    return;
  }
  if (isNodeDragging) {
    dragNodeMove(e);
    return;
  }
  if (isRectangleSelecting) {
    updateRectangleSelection(e);
    return;
  }
  if (isPanning) {
    panMove(e);
  }
}

function pointerup(e) {
  // Prevent event bubbling to parent elements
  e.stopPropagation();
  
  cancelLongPress();
  
  if (isConnectingNodes) {
    stopTempConnection(e);
  } else if (isNodeDragging) {
    dragNodeStop(e);
  } else if (isRectangleSelecting) {
    stopRectangleSelection(e);
  } else if (isPanning) {
    panEnd(e);
  }
}

function pointerleave(e) {
  // Prevent event bubbling to parent elements
  e.stopPropagation();
  
  cancelLongPress();
  
  if (isConnectingNodes) {
    stopTempConnection(e);
  } else if (isNodeDragging) {
    dragNodeStop(e);
  } else if (isRectangleSelecting) {
    stopRectangleSelection(e);
  } else if (isPanning) {
    panEnd(e);
  }
}

function onKeyDown(e) {
  // Don't handle keyboard shortcuts if typing in an input field or in read-only mode
  if (isInteractiveElement(e.target) || isReadOnly) {
    return;
  }

  // Delete key or Backspace on Mac
  if (e.key === "Delete" || e.key === "Backspace") {
    if (hoveredEdgeEl) {
      // If edge is hovered, deselect nodes and delete only the edge
      e.preventDefault(); // Prevent browser back navigation on Backspace
      if (selectedNodes.size > 0) {
        clearSelection();
      }
      deleteHoveredEdge();
    } else if (selectedNodes.size > 0) {
      // If no edge hovered but nodes selected, delete nodes
      e.preventDefault(); // Prevent browser back navigation on Backspace
      deleteSelectedNodes();
    }
  }
}

function deleteHoveredEdge() {
  if (!hoveredEdgeEl || isReadOnly) return;
  
  const edgeId = hoveredEdgeEl.id || hoveredEdgeEl.getAttribute('id');
  if (edgeId) {
    dotnetRef.invokeMethodAsync("DeleteEdge", edgeId);
    hoveredEdgeEl = null;
    if (edgeHoverDetectorEl) {
      edgeHoverDetectorEl.removeAttribute('d');
    }
  }
}

function onContextMenu(e) {
  // Prevent the browser context menu from appearing
  e.preventDefault();
  e.stopPropagation();
  
  // Don't open context menu if right-clicking on a node
  const clickedNode = getClickedNode(e);
  if (clickedNode) {
    return;
  }
  
  // Get client coordinates
  const clientX = e.clientX;
  const clientY = e.clientY;
  
  // Convert to canvas coordinates (accounting for zoom)
  // Note: containerRect already accounts for pan offset via transform
  const containerRect = flowContentEl.getBoundingClientRect();
  const x = (clientX - containerRect.left) / zoom;
  const y = (clientY - containerRect.top) / zoom;
  
  // Notify C# about the context menu event
  dotnetRef.invokeMethodAsync("NotifyContextMenu", x, y, clientX, clientY);
}

function deleteSelectedNodes() {
  if (isReadOnly || selectedNodes.size === 0) return;
  
  const nodeIds = [...selectedNodes].map(node => node.id);
  
  clearSelection();
    
  // Notify .NET to delete the nodes
  dotnetRef.invokeMethodAsync("DeleteNodes", nodeIds);
}

// =================== Edge Connection (Temp Edge) ===================

function startTempConnection(e, socket) {
  isConnectingNodes = true;
  tempEdgeStartPosition = null;
  tempEdgeStopPosition = null;

  if (socket.getAttribute("type") == "input") {
    tempEdgeStopPosition = getSocketPosition(socket);
  } else {
    tempEdgeStartPosition = getSocketPosition(socket);
  }

  if (autoUpdateSocketColors) {
    const color = socket.getAttribute("innercolor");
    tempEdgeElement.setAttribute("stroke", color);
  }
}

function updateTempConnection(e) {
  if (tempEdgeStartPosition == null && tempEdgeStopPosition == null) return;

  const containerRect = flowContentEl.getBoundingClientRect();

  let currentCursorPos = {
    x: (e.clientX - containerRect.left) / zoom,
    y: (e.clientY - containerRect.top) / zoom,
  };

  let path;

  if (tempEdgeStartPosition) {
    path = generateSvgPath(tempEdgeStartPosition, currentCursorPos);
  } else {
    path = generateSvgPath(currentCursorPos, tempEdgeStopPosition);
  }

  tempEdgeElement.setAttribute("d", path);
}

function resetTempConnection() {
  if (tempEdgeElement) {
    tempEdgeElement.setAttribute("d", "");
  }
  tempSocket = null;
  tempEdgeStartPosition = null;
  tempEdgeStopPosition = null;
  isConnectingNodes = false;
}

function stopTempConnection(e) {
  if (tempSocket) {
    let targetSocket = e.target.closest(".socket-anchor");
    let tempSocketType = tempSocket.getAttribute("type");

    if (
      targetSocket &&
      tempSocket !== targetSocket &&
      tempSocket.getAttribute("type") != targetSocket.getAttribute("type")
    ) {
      let fromNodeId;
      let toNodeId;
      let fromSocketName;
      let toSocketName;

      if (tempSocketType === "input") {
        toNodeId = tempSocket.getAttribute("node-id");
        fromNodeId = targetSocket.getAttribute("node-id");
        toSocketName = tempSocket.getAttribute("name");
        fromSocketName = targetSocket.getAttribute("name");
      } else {
        toNodeId = targetSocket.getAttribute("node-id");
        fromNodeId = tempSocket.getAttribute("node-id");
        toSocketName = targetSocket.getAttribute("name");
        fromSocketName = tempSocket.getAttribute("name");
      }

      connectRequest(fromNodeId, toNodeId, fromSocketName, toSocketName);
    }
  }

  resetTempConnection();
}

function connectRequest(fromNodeId, toNodeId, fromSocketName, toSocketName) {
  dotnetRef.invokeMethodAsync("EdgeConnectRequest", fromNodeId, toNodeId, fromSocketName, toSocketName);
}

// =================== Long Press Detection ===================

function startLongPress(e, socket) {
  cancelLongPress();
  longPressStartX = e.clientX;
  longPressStartY = e.clientY;
  
  longPressTimer = setTimeout(() => {
    const nodeId = socket.getAttribute("node-id");
    const socketName = socket.getAttribute("name");
    const containerRect = flowContentEl.getBoundingClientRect();
    const x = (e.clientX - containerRect.left) / zoom;
    const y = (e.clientY - containerRect.top) / zoom;
    dotnetRef.invokeMethodAsync("NotifySocketLongPress", nodeId, socketName, x, y);
    
    // Stop edge drawing after long press
    resetTempConnection();
    longPressTimer = null;
  }, LONG_PRESS_DURATION);
}

function cancelLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function checkLongPressMove(e) {
  if (longPressTimer) {
    const dx = e.clientX - longPressStartX;
    const dy = e.clientY - longPressStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > LONG_PRESS_MOVE_THRESHOLD) {
      cancelLongPress();
    }
  }
}

// =================== Node Selection ===================

function handleNodeSelection(node, e) {
  if (isMultiSelectionKeyPressed(e)) {
    // Multi-selection mode: toggle the clicked node
    if (selectedNodes.has(node)) {
      node.classList.remove(nodeSelectionClass);
      selectedNodes.delete(node);
      dotnetRef.invokeMethodAsync("NotifyNodeDeselected", node.id);
    } else {
      node.classList.add(nodeSelectionClass);
      selectedNodes.add(node);
      dotnetRef.invokeMethodAsync("NotifyNodeSelected", node.id);
    }
  } else {
    // If clicking on an already selected node, keep the selection (for dragging)
    if (selectedNodes.has(node)) {
      // Don't change selection - user wants to drag the group
      return;
    }
    
    // Clear selection and select only this node
    for (const n of selectedNodes) {
      n.classList.remove(nodeSelectionClass);
    }
    selectedNodes.clear();
    node.classList.add(nodeSelectionClass);
    selectedNodes.add(node);
    dotnetRef.invokeMethodAsync("NotifyNodeSelected", node.id);
  }

  const selectedIds = [...selectedNodes].map((n) => n.id);
  dotnetRef.invokeMethodAsync("NotifySelectionChanged", selectedIds);
}

/**
 * Selects nodes programmatically
 */
export function selectNodes(nodesEl) {
  clearSelection();
  for (let node of nodesEl) {
    node.classList.add(nodeSelectionClass);
    selectedNodes.add(node);
    dotnetRef.invokeMethodAsync("NotifyNodeSelected", node.id);
  }
}

/**
 * Clears all node selections
 */
export function clearSelection() {
  for (const n of selectedNodes) {
    n.classList.remove(nodeSelectionClass);
  }
  selectedNodes.clear();
}

/**
 * Gets the IDs of currently selected nodes
 */
export function getSelectedNodes() {
  let ids = [...selectedNodes].map((n) => n.id);
  return ids;
}

// =================== Node Dragging ===================

function dragNodeStart(e, node) {
  if (selectedNodes.size === 0) {
    selectedNodes.add(node);
    node.classList.add(nodeSelectionClass);
    dotnetRef.invokeMethodAsync("NotifyNodeSelected", [node.id]);
  }

  const nodes = flowContentEl.querySelectorAll('.flow-node');

  for(const n of selectedNodes) {
    if(n.getAttribute('kind') === 'Group') {
      isGroupNodeDragging = true;
      const childNodes = getNodesContainedInGroup(n,nodes);
      childNodes.forEach(node => { groupedNodes.add(node); selectedNodes.add(node); });
    }

  }


  isNodeDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  dragStartPositions.clear();
  for (const n of selectedNodes) {
    const style = window.getComputedStyle(n);
    const matrix = new DOMMatrixReadOnly(style.transform);
    dragStartPositions.set(n, { x: matrix.m41, y: matrix.m42 });
  }

  e.stopPropagation();
}


function getNodesContainedInGroup(groupNode,nodes) {
    const groupNodeRect = groupNode.getBoundingClientRect();
    const result = new Set();

    for (const n of nodes) {
      if (n === groupNode) continue;      
      const nodeRect = n.getBoundingClientRect();
      
      // Check if rectangles intersect (any overlap)
      const isIntersecting = !(
        nodeRect.right < groupNodeRect.left ||   // node is completely to the left
        nodeRect.left > groupNodeRect.right ||   // node is completely to the right
        nodeRect.bottom < groupNodeRect.top ||   // node is completely above
        nodeRect.top > groupNodeRect.bottom      // node is completely below
      );
      
      if (isIntersecting) {
        result.add(n);
      }
    }

    return result;
}


function dragNodeMove(e) {
  if (!isNodeDragging || selectedNodes.size === 0) return;

  const deltaX = (e.clientX - lastMouseX) / zoom;
  const deltaY = (e.clientY - lastMouseY) / zoom;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  for (const n of selectedNodes) {
    const startPos = dragStartPositions.get(n);
    const newX = startPos.x + deltaX;
    const newY = startPos.y + deltaY;
    n.style.transform = `translate3d(${newX}px, ${newY}px, 0px)`;
    dragStartPositions.set(n, { x: newX, y: newY });
  }

  updateEdges(selectedNodes);

  e.stopPropagation();
}

function dragNodeStop(e) {
  if (!isNodeDragging) return;

  isNodeDragging = false;

  if(isGroupNodeDragging)
  {
    for (const n of groupedNodes) {
      selectedNodes.delete(n);
    }

    groupedNodes.clear();
    isGroupNodeDragging = false;

  }

  for (const n of selectedNodes) {
    const pos = dragStartPositions.get(n);
    if (pos) {
      dotnetRef.invokeMethodAsync("NotifyNodeMoved", n.id, pos.x, pos.y);
    }
  }

  dragStartPositions.clear();
  e.stopPropagation();
}

// =================== Canvas Panning ===================

function panStart(e) {
  isPanning = true;
  startX = e.clientX;
  startY = e.clientY;
  lastOffsetX = offsetX;
  lastOffsetY = offsetY;

  e.stopPropagation();
  e.preventDefault();
}

function panMove(e) {
  if (!isPanning) return;

  offsetX = lastOffsetX + (e.clientX - startX);
  offsetY = lastOffsetY + (e.clientY - startY);

  updateTransforms();

  e.stopPropagation();
  e.preventDefault();
}

function panEnd(e) {
  if (!isPanning) return;

  isPanning = false;
  dotnetRef.invokeMethodAsync("NotifyPanned", offsetX, offsetY);

  e.stopPropagation();
  e.preventDefault();
}

// =================== Canvas Zoom ===================

function onWheel(e) {
  // Always prevent default to stop page scroll
  e.preventDefault();
  e.stopPropagation();
  
  const delta = e.deltaY < 0 ? 0.02 : -0.02;
  const newZoom = clamp(zoom + delta, minZoom, maxZoom);
  
  // If zoom didn't change (at min/max), still prevent scroll but don't update
  if (Math.abs(newZoom - zoom) < 0.001) return;

  const rect = canvasEl.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  offsetX = mouseX - (mouseX - offsetX) * (newZoom / zoom);
  offsetY = mouseY - (mouseY - offsetY) * (newZoom / zoom);

  zoom = newZoom;
  updateTransforms();

  dotnetRef.invokeMethodAsync("NotifyZoomed", zoom);
}

// =================== Transform & Background Updates ===================

function updateTransforms() {
  flowContentEl.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0px) scale(${zoom})`;
  panBackgroundPosition();
  scaleBackgroundSize();
}

function scaleBackgroundSize() {
  const bgSizes = cacheGridBackgroundSize.split(",");

  const scaledSizes = bgSizes.map((size) => {
    const parts = size.trim().split(/\s+/);

    const scaled = parts.map((val) => {
      const match = val.match(/^([\d.]+)([a-z%]*)$/i);
      if (match) {
        const [, num, unit] = match;
        const scaledNum = parseFloat(num) * zoom;
        return `${scaledNum}${unit}`;
      }
      return val;
    });

    return scaled.join(" ");
  });

  gridEl.style.backgroundSize = scaledSizes.join(", ");
}

function panBackgroundPosition() {
  let gridSizeMatrix = getBackgroundSizesMatrix();
  let positions = [];

  for (let row of gridSizeMatrix) {
    const computed = `${offsetX % (row[0].number * zoom)}${row[0].unit} ${
      offsetY % (row[1].number * zoom)
    }${row[1].unit}`;
    positions.push(computed);
  }

  const backgroundPos = positions.join(",");
  gridEl.style.backgroundPosition = backgroundPos;
}

function getBackgroundSizesMatrix() {
  if (cacheGridSizeMatrix != null) return cacheGridSizeMatrix;

  const bgSizes = cacheGridBackgroundSize.split(",");

  cacheGridSizeMatrix = bgSizes.map((size) => {
    const parts = size.trim().split(/\s+/);
    let res = [];
    for (let p of parts) {
      let d = splitNumberAndUnit(p);
      res.push(d);
    }
    return res;
  });

  return cacheGridSizeMatrix;
}

// =================== Edge Management ===================

/**
 * Updates the path of an edge between two sockets
 */
export function updatePath(outputSocketEl, inputSocketEl, edgeEl) {
  if (!outputSocketEl || !inputSocketEl || !edgeEl) return;

  const fromPos = getSocketPosition(outputSocketEl);
  const toPos = getSocketPosition(inputSocketEl);

  const path = generateSvgPath(toPos,fromPos);

  edgeEl.setAttribute("d", path);
}

/**
 * Adds or updates an edge in the node-edge map
 */
export function addUpdateEdgeMap(edgeEl, nodeEl, fromSocketEl, toSocketEl) {
  if (nodeEdgeMap.has(nodeEl)) {
    nodeEdgeMap.get(nodeEl).push(edgeEl);
  } else {
    nodeEdgeMap.set(nodeEl, [edgeEl]);
  }

  edgeSocketsMap.set(edgeEl, { to: toSocketEl, from: fromSocketEl });
}

/**
 * Removes an edge from the node-edge map
 */
export function deleteEdgeFromMap(edgeEl, nodeEl) {
  if (nodeEdgeMap.has(nodeEl)) {
    nodeEdgeMap.get(nodeEl).delete(edgeEl);
  }
  edgeSocketsMap.delete(edgeEl);
}

/**
 * Sets the temporary edge element for connection dragging
 */
export function setTempEdgeElement(el) {
  tempEdgeElement = el;
}

// =================== Edge Hover Detection ===================

function setupEdgeHoverDetection() {
  if (!edgesSvgEl) return;
  
  // Listen only on the SVG container
  edgesSvgEl.addEventListener('mouseover', handleEdgeMouseEnter);
  edgesSvgEl.addEventListener('mouseout', handleEdgeMouseLeave);
}

function handleEdgeMouseEnter(e) {
  if (!edgeHoverDetectorEl || isPanning || isNodeDragging || isConnectingNodes || isRectangleSelecting) return;
  
  const target = e.target;
  if (target && target.classList && target.classList.contains('edge') && target.id !== 'tempEdge') {
    const pathData = target.getAttribute('d');
    const stroke = target.getAttribute('stroke') || window.getComputedStyle(target).stroke;
    if (pathData) {
      edgeHoverDetectorEl.setAttribute('d', pathData);
      edgeHoverDetectorEl.setAttribute('stroke', stroke);
      hoveredEdgeEl = target;
    }
  }
}

function handleEdgeMouseLeave(e) {
  if (!edgeHoverDetectorEl) return;
  
  const target = e.target;
  if (target && target.classList && target.classList.contains('edge') && target === hoveredEdgeEl) {
    edgeHoverDetectorEl.removeAttribute('d');
    hoveredEdgeEl = null;
  }
}

function updateEdges(nodesEl) {
  if (nodesEl == null || nodesEl == undefined) return;

  let edgesEl = getEdgesElementsToBeUpdated(nodesEl);

  for (let edgeEl of edgesEl) {
    if (!edgeSocketsMap.has(edgeEl)) continue;
    const data = edgeSocketsMap.get(edgeEl);
    updatePath(data.to, data.from, edgeEl);
  }
}

function getEdgesElementsToBeUpdated(nodesEl) {
  let edgesElements = new Set();
  for (let node of nodesEl) {
    if (nodeEdgeMap.has(node)) {
      for (let edge of nodeEdgeMap.get(node)) {
        edgesElements.add(edge);
      }
    }
  }
  return edgesElements;
}

function generateSvgPath(to, from) {
  if (jsEdgePathFunctionName) {
    return window[jsEdgePathFunctionName](to, from);
  }
  return createCubicPath(to, from);
}

function createCubicPath(to, from) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const offset = Math.min(200, dist * 0.5);

  let c1, c2;

  c1 = { x: from.x - offset, y: from.y };
  c2 = { x: to.x + offset, y: to.y };

  return `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
}

// =================== Node Management ===================

/**
 * Moves a node to the specified position
 */
export function moveNode(nodeEl, x, y) {
  nodeEl.style.transform = `translate3d(${x}px, ${y}px, 0px)`;
  updateEdges([nodeEl]);
}

/**
 * Gets the transform position of a node
 */
export function getTransformPosition(nodeEl) {
  const style = window.getComputedStyle(nodeEl);
  const matrix = new DOMMatrixReadOnly(style.transform);

  return { x: matrix.m41, y: matrix.m42 };
}

// =================== Canvas Property Management ===================

/**
 * Sets canvas properties including zoom and offsets
 */
export function setCanvasProperties(props) {
  offsetX = props.offsetX;
  offsetY = props.offsetY;
  minZoom = props.minZoom || 0.1;
  maxZoom = props.maxZoom || 2.0;
  zoom = clamp(props.zoom, minZoom, maxZoom);
  isReadOnly = props.isReadOnly;

  updateTransforms();
}

/**
 * Gets current canvas properties
 */
export function getCanvasProperties() {
  return { offsetX, offsetY, zoom, minZoom, maxZoom ,isReadOnly};
}

/**
 * Sets the canvas offset
 */
export function setOffset(x, y) {
  offsetX = x;
  offsetY = y;
  updateTransforms();
}

/**
 * Sets the canvas zoom level
 */
export function setZoom(z) {
  zoom = clamp(z, minZoom, maxZoom);
  updateTransforms();
}

// =================== Rectangle Selection ===================

function updateSelectionRectangle(startX, startY, endX, endY) {
  if (!rectangleSelectionElement) return;
  
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  
  rectangleSelectionElement.style.left = `${left}px`;
  rectangleSelectionElement.style.top = `${top}px`;
  rectangleSelectionElement.style.width = `${width}px`;
  rectangleSelectionElement.style.height = `${height}px`;
  rectangleSelectionElement.style.display = 'block';
}

function removeSelectionRectangle() {
  if (rectangleSelectionElement) {
    rectangleSelectionElement.style.display = 'none';
  }
}

function getNodesIntersectingRectangle(rectLeft, rectTop, rectRight, rectBottom) {
  const nodes = flowContentEl.querySelectorAll('.flow-node');
  const intersectingNodes = [];
  
  for (const node of nodes) {
    const nodeRect = node.getBoundingClientRect();
    const canvasRect = canvasEl.getBoundingClientRect();
    
    // Convert node bounds to canvas coordinates
    const nodeLeft = nodeRect.left - canvasRect.left;
    const nodeTop = nodeRect.top - canvasRect.top;
    const nodeRight = nodeRect.right - canvasRect.left;
    const nodeBottom = nodeRect.bottom - canvasRect.top;
    
    // Check if rectangles intersect
    const intersects = !(
      nodeRight < rectLeft ||
      nodeLeft > rectRight ||
      nodeBottom < rectTop ||
      nodeTop > rectBottom
    );
    
    if (intersects) {
      intersectingNodes.push(node);
    }
  }
  
  return intersectingNodes;
}

function startRectangleSelection(e) {
  isRectangleSelecting = true;
  const canvasRect = canvasEl.getBoundingClientRect();
  rectangleSelectionStartX = e.clientX - canvasRect.left;
  rectangleSelectionStartY = e.clientY - canvasRect.top;
  
  // Initialize rectangle at start position with zero size
  updateSelectionRectangle(
    rectangleSelectionStartX,
    rectangleSelectionStartY,
    rectangleSelectionStartX,
    rectangleSelectionStartY
  );
}

function updateRectangleSelection(e) {
  if (!isRectangleSelecting) return;
  
  const canvasRect = canvasEl.getBoundingClientRect();
  const currentX = e.clientX - canvasRect.left;
  const currentY = e.clientY - canvasRect.top;
  
  updateSelectionRectangle(
    rectangleSelectionStartX,
    rectangleSelectionStartY,
    currentX,
    currentY
  );
}

function stopRectangleSelection(e) {
  if (!isRectangleSelecting) return;
  
  isRectangleSelecting = false;
  const canvasRect = canvasEl.getBoundingClientRect();
  const endX = e.clientX - canvasRect.left;
  const endY = e.clientY - canvasRect.top;
  
  const rectLeft = Math.min(rectangleSelectionStartX, endX);
  const rectTop = Math.min(rectangleSelectionStartY, endY);
  const rectRight = Math.max(rectangleSelectionStartX, endX);
  const rectBottom = Math.max(rectangleSelectionStartY, endY);
  
  const intersectingNodes = getNodesIntersectingRectangle(
    rectLeft,
    rectTop,
    rectRight,
    rectBottom
  );
  
  // Handle selection based on modifier keys
  if (!isMultiSelectionKeyPressed(e)) {
    // Clear existing selection if no modifier key
    clearSelection();
  }
  
  // Add intersecting nodes to selection
  for (const node of intersectingNodes) {
    if (!selectedNodes.has(node)) {
      node.classList.add(nodeSelectionClass);
      selectedNodes.add(node);
      dotnetRef.invokeMethodAsync("NotifyNodeSelected", node.id);
    }
  }
  
  const selectedIds = [...selectedNodes].map((n) => n.id);
  dotnetRef.invokeMethodAsync("NotifySelectionChanged", selectedIds);
  
  removeSelectionRectangle();
}

// =================== Utility Functions ===================

function getSocketPosition(socketEl) {
  if (!socketEl) return { x: 0, y: 0 };

  const rect = socketEl.getBoundingClientRect();
  const surfaceRect = flowContentEl.getBoundingClientRect();

  const x = (rect.left + rect.width / 2 - surfaceRect.left) / zoom;
  const y = (rect.top + rect.height / 2 - surfaceRect.top) / zoom;

  return { x, y };
}

function getClickedNode(e) {
  return e.target.closest(".flow-node");
}

function getClickedSocket(e) {
  return e.target.closest(".socket-anchor");
}

function isInteractiveElement(target) {
  const tagName = target.tagName.toLowerCase();
  const interactiveTags = ['input', 'textarea', 'select', 'button', 'a'];
  
  // Check if it's an interactive element
  if (interactiveTags.includes(tagName)) {
    return true;
  }
  
  // Check if element has contenteditable
  if (target.isContentEditable) {
    return true;
  }
  
  // Check for elements with role that indicates interactivity
  const role = target.getAttribute('role');
  if (role && ['button', 'textbox', 'slider', 'spinbutton'].includes(role)) {
    return true;
  }
  
  return false;
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function splitNumberAndUnit(input) {
  const match = input.match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
  if (!match) return { number: 0, unit: "px" };
  return {
    number: parseFloat(match[1]),
    unit: match[2] || "",
  };
}

// =================== Context Menu Click-Outside Handling ===================

let contextMenuElement = null;
let contextMenuDotNetRef = null;
let clickOutsideHandler = null;

window.flowContextMenuSetup = function(menuRef, dotNetRef) {
  contextMenuElement = menuRef;
  contextMenuDotNetRef = dotNetRef;
  
  // Add click listener with a small delay to avoid closing immediately
  setTimeout(() => {
    clickOutsideHandler = function(e) {
      if (contextMenuElement && !contextMenuElement.contains(e.target)) {
        contextMenuDotNetRef.invokeMethodAsync('HideAsync');
      }
    };
    document.addEventListener('click', clickOutsideHandler);
  }, 100);
};

window.flowContextMenuCleanup = function() {
  if (clickOutsideHandler) {
    document.removeEventListener('click', clickOutsideHandler);
    clickOutsideHandler = null;
  }
  contextMenuElement = null;
  contextMenuDotNetRef = null;
};
