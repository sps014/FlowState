// =================== Global State Variables ===================

// DOM Elements
let canvasEl = null;
let gridEl = null;
let flowContentEl = null;
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

// Edge Connection State
let tempEdgeStartPosition = null;
let tempEdgeStopPosition = null;
let tempSocket = null;
let tempEdgeElement = null;

// Edge Management
let nodeEdgeMap = new Map(); // Map<NodeEl, Edges[]>
let edgeSocketsMap = new Map(); // Map<EdgeEl, {to: SocketEl, from: SocketEl}>

// Configuration
let nodeSelectionClass = "selected";
let autoUpdateSocketColors = false;

// Cache
let cacheGridBackgroundSize = null;
let cacheGridSizeMatrix = null;

// =================== Initialization & Cleanup ===================

/**
 * Sets up canvas event listeners and initializes the canvas
 */
export function setupCanvasEvents(el, gridElement, flowContentElement, dotnetReference) {
  canvasEl = el;
  flowContentEl = flowContentElement;
  gridEl = gridElement;
  dotnetRef = dotnetReference;

  const style = window.getComputedStyle(gridEl);
  cacheGridBackgroundSize = style.backgroundSize;

  el.addEventListener("pointerdown", pointerdown);
  el.addEventListener("pointermove", pointermove);
  el.addEventListener("pointerup", pointerup);
  el.addEventListener("pointerleave", pointerleave);
  el.addEventListener("wheel", onWheel);
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
}

/**
 * Sets component-level properties
 */
export function setComponentProperties(nodeSelectionClassParam, autoUpdateSocketColorsParam, jsEdgePathFunctionNameParam) {
  nodeSelectionClass = nodeSelectionClassParam;
  autoUpdateSocketColors = autoUpdateSocketColorsParam;
}

// =================== Pointer Event Handlers ===================

function pointerdown(e) {
  // Prevent event bubbling to parent elements
  e.stopPropagation();
  
  const socket = getClickedSocket(e);
  const node = getClickedNode(e);

  if (socket) {
    tempSocket = socket;
    startTempConnection(e, socket);
  } else if (node) {
    handleNodeSelection(node, e);
    dragNodeStart(e, node);
  } else {
    if (selectedNodes.size > 0) {
      const deselected = [...selectedNodes].map((n) => n.id);
      clearSelection();
      dotnetRef.invokeMethodAsync("NotifyNodesCleared", deselected);
    }
    panStart(e);
  }
}

function pointermove(e) {
  // Prevent event bubbling to parent elements
  e.stopPropagation();
  
  if (isConnectingNodes) {
    updateTempConnection(e);
    return;
  }
  if (isNodeDragging) {
    dragNodeMove(e);
    return;
  }
  panMove(e);
}

function pointerup(e) {
  // Prevent event bubbling to parent elements
  e.stopPropagation();
  
  if (isConnectingNodes) {
    stopTempConnection(e);
  }
  if (isNodeDragging) {
    dragNodeStop(e);
  } else {
    panEnd(e);
  }
}

function pointerleave(e) {
  // Prevent event bubbling to parent elements
  e.stopPropagation();
  
  panEnd(e);
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

  if (tempEdgeElement) {
    tempEdgeElement.setAttribute("d", "");
  }

  tempSocket = null;
  isConnectingNodes = false;
}

function connectRequest(fromNodeId, toNodeId, fromSocketName, toSocketName) {
  dotnetRef.invokeMethodAsync("EdgeConnectRequest", fromNodeId, toNodeId, fromSocketName, toSocketName);
}

// =================== Node Selection ===================

function handleNodeSelection(node, e) {
  if (e.ctrlKey || e.metaKey) {
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
  updateTransforms();
}

/**
 * Gets current canvas properties
 */
export function getCanvasProperties() {
  return { offsetX, offsetY, zoom, minZoom, maxZoom };
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
