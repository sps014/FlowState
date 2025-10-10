export function getBoundingClientRect(el) {
  return el
    ? el.getBoundingClientRect()
    : { left: 0, top: 0, width: 0, height: 0 };
}

let canvasEl = null;
let gridEl = null;
let flowContentEl = null;

let offsetX=0;
let offsetY=0;

let isPanning = false;
let startX = 0;
let startY = 0;
let lastOffsetX = 0;
let lastOffsetY = 0;
let zoom = 1;

let gridBackgroundSize = { width: 32, height: 32 };
let dotnetRef = null;



export function setGridBackgroundSize(width, height) {
  gridBackgroundSize = { width, height };
}

export function setupCanvasEvents(el, gridElement, flowContentElement,dotnetReference) {
  canvasEl = el;
  gridEl = gridElement;
  flowContentEl = flowContentElement;
  dotnetRef = dotnetReference;

  el.addEventListener("pointerdown", pointerdown);
  el.addEventListener("pointermove", pointermove);
  el.addEventListener("pointerup", pointerup);
  el.addEventListener("pointerleave", pointerleave);
}

export function removeCanvasEvents(el) {
  el.removeEventListener("pointerdown", pointerdown);
  el.removeEventListener("pointermove", pointermove);
  el.removeEventListener("pointerup", pointerup);
  el.removeEventListener("pointerleave", pointerleave);
}

function pointerdown(e) {
  panStart(e);
}

function pointermove(e) {
  panMove(e);
}

function pointerup(e) {
  panEnd(e);
}

function pointerleave(e) {
    panEnd(e);
}

function panStart(e) {
  isPanning = true;
  startX = e.clientX;
  startY = e.clientY;
  lastOffsetX = offsetX;
  lastOffsetY = offsetY;
}

function panMove(e) {
  if (!isPanning) return;

  offsetX = lastOffsetX + (e.clientX - startX);
  offsetY = lastOffsetY + (e.clientY - startY);

  flowContentEl.style.transform = `translate3d(${offsetX}px, ${offsetY}px,0px) scale(${zoom})`;
  gridEl.style.backgroundPosition = `${offsetX % (gridBackgroundSize.width * zoom)}px ${offsetY % (gridBackgroundSize.height * zoom)}px`;
  gridEl.style.backgroundSize = `${gridBackgroundSize.width * zoom}px ${gridBackgroundSize.height * zoom}px`;
}

function panEnd(e) {
  isPanning = false;
  dotnetRef.invokeMethodAsync('NotifyPanned', offsetX, offsetY);
}
