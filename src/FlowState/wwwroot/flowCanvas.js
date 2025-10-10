let canvasEl = null;
let gridEl = null;
let flowContentEl = null;

let offsetX = 0;
let offsetY = 0;

let isPanning = false;
let isNodeDragging = false;

let selectedNode = null;

let startX = 0;
let startY = 0;
let lastOffsetX = 0;
let lastOffsetY = 0;

let zoom = 1;
let minZoom = 0.2;
let maxZoom = 2.0;

let gridBackgroundSize = { width: 32, height: 32 };
let dotnetRef = null;

let lastMouseX = 0;
let lastMouseY = 0;

export function setGridBackgroundSize(width, height) {
  gridBackgroundSize = { width, height };
}

export function setupCanvasEvents(
  el,
  gridElement,
  flowContentElement,
  dotnetReference
) {
  canvasEl = el;
  gridEl = gridElement;
  flowContentEl = flowContentElement;
  dotnetRef = dotnetReference;

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

function pointerdown(e) {
  if (dragNodeStart(e)) return;
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
  if (dragNodeStop(e)) return;
  panEnd(e);
}

function pointerleave(e) {
  panEnd(e);
}

function dragNodeStart(e) {
  const currentNode = getClickedNode(e);
  if (currentNode !== null) {
    selectedNode = currentNode;
    isNodeDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    e.stopPropagation();
    e.preventDefault();
    return true;
  }

  return false;
}

function dragNodeStop(e) {
  if (selectedNode === null || isNodeDragging === false) return false;

  isNodeDragging = false;

  dotnetRef.invokeMethodAsync(
    "NotifyNodeMoved",
    selectedNode.id,
    lastMouseX,
    lastMouseY
  );

selectedNode = null;


  lastMouseX = 0;
  lastMouseY = 0;

  e.stopPropagation();
  e.preventDefault();

  return true;
}

function dragNodeMove(e) {
  if (!isNodeDragging) return;
  if (selectedNode === null) return;

  const deltaX = e.clientX - lastMouseX;
  const deltaY = e.clientY - lastMouseY;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  const style = window.getComputedStyle(selectedNode);
  const matrix = new DOMMatrixReadOnly(style.transform);
  const nodeX = matrix.m41 + deltaX / zoom;
  const nodeY = matrix.m42 + deltaY / zoom;

  selectedNode.style.transform = `translate3d(${nodeX}px, ${nodeY}px, 0px)`;

  e.stopPropagation();
  e.preventDefault();
}

function onWheel(e) {
  const delta = e.deltaY < 0 ? 0.02 : -0.02;
  const newZoom = clamp(zoom + delta, minZoom, maxZoom);

  if (Math.abs(newZoom - zoom) < 0.001) return; // already at limit
  const rect = canvasEl.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Adjust offsets so zoom is centered at cursor
  offsetX = mouseX - (mouseX - offsetX) * (newZoom / zoom);
  offsetY = mouseY - (mouseY - offsetY) * (newZoom / zoom);

  zoom = newZoom;

  updateTransforms();

  e.stopPropagation();
  e.preventDefault();

  dotnetRef.invokeMethodAsync("NotifyZoomed", zoom);
}

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

function updateTransforms() {
  flowContentEl.style.transform = `translate3d(${offsetX}px, ${offsetY}px,0px) scale(${zoom})`;
  gridEl.style.backgroundPosition = `${
    offsetX % (gridBackgroundSize.width * zoom)
  }px ${offsetY % (gridBackgroundSize.height * zoom)}px`;
  gridEl.style.backgroundSize = `${gridBackgroundSize.width * zoom}px ${
    gridBackgroundSize.height * zoom
  }px`;
}

function panEnd(e) {
  isPanning = false;
  dotnetRef.invokeMethodAsync("NotifyPanned", offsetX, offsetY);
  e.stopPropagation();
  e.preventDefault();
}

function getClickedNode(e) {
  return e.target.closest(".flow-node");
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
  return {
    offsetX: offsetX,
    offsetY: offsetY,
    zoom: zoom,
    minZoom: minZoom,
    maxZoom: maxZoom,
  };
}

export function setOffset(x, y) {
  offsetX = x;
  offsetY = y;
  updateTransforms();
}

export function setZoom(zoomLevel) {
  zoom = clamp(zoomLevel, minZoom, maxZoom);
  updateTransforms();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
