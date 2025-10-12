let canvasEl = null;
let gridEl = null;
let flowContentEl = null;

let offsetX = 0;
let offsetY = 0;
let zoom = 1;
let minZoom = 0.2;
let maxZoom = 2.0;

let dotnetRef = null;

// --- State
let isPanning = false;
let isNodeDragging = false;
let isConnectingNodes = false;

let startX = 0;
let startY = 0;
let lastOffsetX = 0;
let lastOffsetY = 0;

let selectedNodes = new Set();
let dragStartPositions = new Map();
let lastMouseX = 0;
let lastMouseY = 0;

let nodeSelectionClass = "selected";

let cacheGridBackgroundSize = null;
let cacheGridSizeMatrix = null;

export function setupCanvasEvents(
  el,
  gridElement,
  flowContentElement,
  dotnetReference
) {
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

export function removeCanvasEvents(el) {
  el.removeEventListener("pointerdown", pointerdown);
  el.removeEventListener("pointermove", pointermove);
  el.removeEventListener("pointerup", pointerup);
  el.removeEventListener("pointerleave", pointerleave);
}

// =================== Pointer Handling ====================

function pointerdown(e) {
  const socket = getClickedSocket(e);
  const node = getClickedNode(e);

  if (socket) {
    isConnectingNodes = true;
  } else if (node) {
    handleNodeSelection(node, e);
    dragNodeStart(e, node);
    return;
  } else {
    // Clear all selections if clicked on empty space
    if (selectedNodes.size > 0) {
      const deselected = [...selectedNodes].map((n) => n.id);
      clearSelection();
      dotnetRef.invokeMethodAsync("NotifyNodesCleared", deselected);
    }
  }

  panStart(e);
}

function pointermove(e) {
  if (isNodeDragging) {
    dragNodeMove(e);
    return;
  }
  panMove(e);
}

function pointerup(e) {
  if (isNodeDragging) {
    dragNodeStop(e);
    return;
  }
  panEnd(e);
}

function pointerleave(e) {
  panEnd(e);
}

// =================== Node Selection ====================

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
    // Replace current selection
    for (const n of selectedNodes) n.classList.remove(nodeSelectionClass);
    selectedNodes.clear();
    node.classList.add(nodeSelectionClass);
    selectedNodes.add(node);
    dotnetRef.invokeMethodAsync("NotifyNodeSelected", node.id);
  }

  // --- invoke selection changed with all currently selected node IDs
  const selectedIds = [...selectedNodes].map((n) => n.id);
  dotnetRef.invokeMethodAsync("NotifySelectionChanged", selectedIds);
}

export function selectNodes(nodesEl) {
  clearSelection();
  for (let node of nodesEl) {
    node.classList.add(nodeSelectionClass);
    selectedNodes.add(node);
    dotnetRef.invokeMethodAsync("NotifyNodeSelected", node.id);
  }
}

export function clearSelection() {
  for (const n of selectedNodes) {
    n.classList.remove(nodeSelectionClass);
  }
  selectedNodes.clear();
}

// =================== Node Dragging ====================

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
  //e.preventDefault();
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

  // Notify all moved nodes
  for (const n of selectedNodes) {
    const pos = dragStartPositions.get(n);
    if (pos) {
      dotnetRef.invokeMethodAsync("NotifyNodeMoved", n.id, pos.x, pos.y);
    }
  }

  dragStartPositions.clear();
  e.stopPropagation();
}

// =================== Panning & Zoom ====================

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

function onWheel(e) {
  const delta = e.deltaY < 0 ? 0.02 : -0.02;
  const newZoom = clamp(zoom + delta, minZoom, maxZoom);
  if (Math.abs(newZoom - zoom) < 0.001) return;

  const rect = canvasEl.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  offsetX = mouseX - (mouseX - offsetX) * (newZoom / zoom);
  offsetY = mouseY - (mouseY - offsetY) * (newZoom / zoom);

  zoom = newZoom;
  updateTransforms();

  dotnetRef.invokeMethodAsync("NotifyZoomed", zoom);

  e.stopPropagation();
  e.preventDefault();
}

// =================== Helpers ====================

function updateTransforms() {
  flowContentEl.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0px) scale(${zoom})`;
  panBackgroundPosition();
  scaleBackgroundSize();
}

function scaleBackgroundSize() {
  const bgSizes = cacheGridBackgroundSize.split(","); // split by layer

  const scaledSizes = bgSizes.map((size) => {
    // Trim and split "32px 32px" → ["32px", "32px"]
    const parts = size.trim().split(/\s+/);

    // Only scale numeric px values
    const scaled = parts.map((val) => {
      const match = val.match(/^([\d.]+)([a-z%]*)$/i);
      if (match) {
        const [, num, unit] = match;
        const scaledNum = parseFloat(num) * zoom;
        return `${scaledNum}${unit}`;
      }
      // Keep keywords like 'auto', 'cover', 'contain'
      return val;
    });

    return scaled.join(" ");
  });

  // Reapply efficiently
  gridEl.style.backgroundSize = scaledSizes.join(", ");
}

function panBackgroundPosition() {
  const gridBackgroundSize = { width: 32, height: 32 };
  //gridEl.style.backgroundPosition = `${offsetX % (gridBackgroundSize.width * zoom)}px ${offsetY % (gridBackgroundSize.height * zoom)}px`;

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
function splitNumberAndUnit(input) {
  const match = input.match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
  if (!match) return { number: 0, unit: "px" };
  return {
    number: parseFloat(match[1]),
    unit: match[2] || "",
  };
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

// =================== Public API ====================

export function setComponentProperties(nodeSelectionClassParam) {
  nodeSelectionClass = nodeSelectionClassParam;
}

export function setCanvasProperties(props) {
  offsetX = props.offsetX;
  offsetY = props.offsetY;
  minZoom = props.minZoom || 0.1;
  maxZoom = props.maxZoom || 2.0;
  zoom = clamp(props.zoom, minZoom, maxZoom);
  updateTransforms();
}

export function getCanvasProperties() {
  return { offsetX, offsetY, zoom, minZoom, maxZoom };
}

export function setOffset(x, y) {
  offsetX = x;
  offsetY = y;
  updateTransforms();
}

export function setZoom(z) {
  zoom = clamp(z, minZoom, maxZoom);
  updateTransforms();
}

// edge logic

export function getSocketPosition(socketEl) {
  if (!socketEl) return { x: 0, y: 0 };

  const rect = socketEl.getBoundingClientRect();
  const surfaceRect = flowContentEl.getBoundingClientRect();

  const x = (rect.left + rect.width / 2  - surfaceRect.left) / zoom;
  const y = (rect.top + rect.height / 2 -  surfaceRect.top) / zoom;

  return { x, y };
}

export function updatePath(outputSocketEl, inputSocketEl, edgeEl) {
  if (!outputSocketEl || !inputSocketEl || !edgeEl) return;

  const fromPos = getSocketPosition(outputSocketEl); // Output is the start
  const toPos = getSocketPosition(inputSocketEl); // Input is the end

  const path = createCubicPath(fromPos, toPos, outputSocketEl, inputSocketEl);

  edgeEl.setAttribute("d", path);
}
function createCubicPath(from, to, fromSocket = null) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const offset = Math.min(200, dist * 0.5);

  let c1, c2;

  if (fromSocket) {
    const isOutput = fromSocket.type === "output";
    if (isOutput) {
      // Output socket: curve goes right from start, left into end
      c1 = { x: from.x + offset, y: from.y };
      c2 = { x: to.x - offset, y: to.y };
    } else {
      // Input socket: curve goes left from start, right into end
      c1 = { x: from.x - offset, y: from.y };
      c2 = { x: to.x + offset, y: to.y };
    }
  } else {
    c1 = { x: from.x + offset, y: from.y };
    c2 = { x: to.x - offset, y: to.y };
  }

  return `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
}

let nodeEdgeMap = new Map(); // WeakMap<NodeEl,Edges>
let edgeSocketsMap = new Map();

export function addUpdateEdgeMap(edgeEl, nodeEl, fromSocketEl, toSocketEl) {
  if (nodeEdgeMap.has(nodeEl)) {
    nodeEdgeMap.get(nodeEl).push(edgeEl);
  } else {
    nodeEdgeMap.set(nodeEl, [edgeEl]);
  }

  edgeSocketsMap.set(edgeEl, { to: toSocketEl, from: fromSocketEl });
}

export function deleteEdgeFromMap(edgeEl, nodeEl) {
  if (nodeEdgeMap.has(nodeEl)) {
    nodeEdgeMap.get(nodeEl).delete(edgeEl);
  }
  edgeSocketsMap.delete(edgeEl);
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

/* Node Element*/
export function moveNode(nodeEl, x, y) {
  nodeEl.style.transform = `translate3d(${x}px, ${y}px, 0px)`;
  updateEdges([nodeEl]);
}

export function getTransformPosition(nodeEl) {
  const style = window.getComputedStyle(nodeEl);
  const matrix = new DOMMatrixReadOnly(style.transform);

  return { x: matrix.m41, y: matrix.m42 };
}
