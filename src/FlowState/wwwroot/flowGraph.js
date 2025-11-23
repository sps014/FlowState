import { ViewportController } from "./viewportController.js";
import { SelectionController } from "./selectionController.js";
import { NodeController } from "./nodeController.js";
import { EdgeController } from "./edgeController.js";
class FlowCanvas {
    // DOM Elements
    canvasEl = null;
    gridEl = null;
    flowContentEl = null;
    dotnetRef = null;

    // Configuration
    jsEdgePathFunctionName = null;
    offsetX = 0;
    offsetY = 0;
    zoom = 1;
    minZoom = 0.2;
    maxZoom = 2.0;
    nodeSelectionClass = "selected";
    autoUpdateSocketColors = false;
    panKey = "alt";
    isReadOnly = false;
    canvasMode = 0;
    scrollSpeed = 1;

    // Long Press State (kept here as it spans multiple concepts)
    longPressTimer = null;
    longPressStartX = 0;
    longPressStartY = 0;
    LONG_PRESS_DURATION = 1000;
    LONG_PRESS_MOVE_THRESHOLD = 10;

    // Context Menu Helpers
    contextMenuElement = null;
    contextMenuDotNetRef = null;
    clickOutsideHandler = null;

    constructor() {
        // Initialize Controllers
        this.viewportController = new ViewportController(this);
        this.selectionController = new SelectionController(this);
        this.nodeController = new NodeController(this);
        this.edgeController = new EdgeController(this);

        this.setupGlobalWindowFunctions();
    }

    // =================== Initialization ===================

    setupCanvasEvents = (elements, dotnetReference) => {
        this.canvasEl = elements.canvasElement;
        this.flowContentEl = elements.flowContentElement;
        this.gridEl = elements.gridElement;
        this.dotnetRef = dotnetReference;

        this.selectionController.setSelectionElement(elements.selectionRectElement);
        this.edgeController.setElements(elements.edgesSvgElement, elements.edgeHoverDetectorElement);

        this.viewportController.initGrid();

        this.canvasEl.tabIndex = -1;
        this.canvasEl.style.outline = 'none';

        this.canvasEl.addEventListener("pointerdown", this.pointerdown);
        this.canvasEl.addEventListener("pointermove", this.pointermove);
        this.canvasEl.addEventListener("pointerup", this.pointerup);
        this.canvasEl.addEventListener("pointerleave", this.pointerleave);
        this.canvasEl.addEventListener("wheel", this.viewportController.onWheel);
        this.canvasEl.addEventListener("contextmenu", this.onContextMenu);
        this.canvasEl.addEventListener("keydown", this.onKeyDown);

        this.edgeController.setupEdgeHoverDetection();
    }

    removeCanvasEvents = (el) => {
        el.removeEventListener("pointerdown", this.pointerdown);
        el.removeEventListener("pointermove", this.pointermove);
        el.removeEventListener("pointerup", this.pointerup);
        el.removeEventListener("pointerleave", this.pointerleave);
        el.removeEventListener("wheel", this.viewportController.onWheel);
        el.removeEventListener("contextmenu", this.onContextMenu);
        el.removeEventListener("keydown", this.onKeyDown);
    }

    setComponentProperties = (props) => {
        this.nodeSelectionClass = props.nodeSelectionClass || "selected";
        this.autoUpdateSocketColors = props.autoUpdateSocketColors || false;
        this.jsEdgePathFunctionName = props.jsEdgePathFunctionName || null;
        this.panKey = (props.panKey || "alt").toLowerCase();
        this.isReadOnly = props.isReadOnly || false;
        this.scrollSpeed = props.scrollSpeed || 0.02;
    }

    setReadOnly = (readOnly) => { this.isReadOnly = readOnly; }

    setCanvasMode = (mode) => {
        this.canvasMode = mode;
        if (this.canvasEl) {
            this.canvasEl.style.cursor = mode === 1 ? 'grab' : 'default';
        }
    }

    // =================== Event Router ===================

    pointerdown = (e) => {
        e.stopPropagation();
        this.canvasEl?.focus();

        const resizeHandler = this.getClickedResizeHandler(e);
        if (resizeHandler) {
            this.nodeController.startResize(e, resizeHandler);
            return;
        }

        const socket = this.getClickedSocket(e);
        const node = this.getClickedNode(e);

        if (socket) {
            if (this.isInteractiveElement(e.target) || this.isReadOnly) return;
            this.startLongPress(e, socket);
            this.edgeController.tempSocket = socket;
            this.edgeController.startTempConnection(e, socket);
        } else if (node) {
            this.selectionController.handleNodeSelection(node, e);
            if (!this.isInteractiveElement(e.target) && !this.isReadOnly) {
                this.nodeController.dragNodeStart(e, node);
            }
        } else {
            if (this.canvasMode === 1 || this.isPanKeyPressed(e)) {
                this.viewportController.panStart(e);
            } else {
                if (!this.isReadOnly) {
                    this.selectionController.startRectangleSelection(e);
                }
            }
        }
    }

    pointermove = (e) => {
        e.stopPropagation();
        this.checkLongPressMove(e);

        if (this.nodeController.isResizing) {
            this.nodeController.resizeNode(e);
            return;
        }
        if (this.edgeController.isConnectingNodes) {
            this.edgeController.updateTempConnection(e);
            return;
        }
        if (this.nodeController.isNodeDragging) {
            this.nodeController.dragNodeMove(e);
            return;
        }
        if (this.selectionController.isRectangleSelecting) {
            this.selectionController.updateRectangleSelection(e);
            return;
        }
        if (this.viewportController.isPanning) {
            this.viewportController.panMove(e);
        }
    }

    pointerup = (e) => {
        e.stopPropagation();
        this.cancelLongPress();

        if (this.nodeController.isResizing) {
            this.nodeController.stopResize();
        }
        if (this.edgeController.isConnectingNodes) {
            this.edgeController.stopTempConnection(e);
        } else if (this.nodeController.isNodeDragging) {
            this.nodeController.dragNodeStop(e);
        } else if (this.selectionController.isRectangleSelecting) {
            this.selectionController.stopRectangleSelection(e);
        } else if (this.viewportController.isPanning) {
            this.viewportController.panEnd(e);
        }
    }

    pointerleave = (e) => {
        e.stopPropagation();
        this.cancelLongPress();

        if (this.nodeController.isResizing) {
            this.nodeController.stopResize();
        }
        if (this.edgeController.isConnectingNodes) {
            this.edgeController.stopTempConnection(e);
        } else if (this.nodeController.isNodeDragging) {
            this.nodeController.dragNodeStop(e);
        } else if (this.selectionController.isRectangleSelecting) {
            this.selectionController.stopRectangleSelection(e);
        } else if (this.viewportController.isPanning) {
            this.viewportController.panEnd(e);
        }
    }

    onKeyDown = (e) => {
        if (this.isInteractiveElement(e.target) || this.isReadOnly) return;

        if (e.key === "Delete" || e.key === "Backspace") {
            if (this.edgeController.hoveredEdgeEl) {
                e.preventDefault();
                if (this.selectionController.selectedNodes.size > 0) {
                    this.selectionController.clearSelection();
                }
                this.edgeController.deleteHoveredEdge();
            } else if (this.selectionController.selectedNodes.size > 0) {
                e.preventDefault();
                this.selectionController.deleteSelectedNodes();
            }
        }
    }

    onContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const clickedNode = this.getClickedNode(e);
        if (clickedNode) return;

        const clientX = e.clientX;
        const clientY = e.clientY;
        const containerRect = this.flowContentEl.getBoundingClientRect();
        const x = (clientX - containerRect.left) / this.zoom;
        const y = (clientY - containerRect.top) / this.zoom;

        this.dotnetRef.invokeMethodAsync("NotifyContextMenu", x, y, clientX, clientY);
    }

    // =================== Helpers & Utils ===================

    isPanKeyPressed = (e) => {
        switch (this.panKey) {
            case "shift": return e.shiftKey;
            case "ctrl": return e.ctrlKey;
            case "alt": return e.altKey;
            case "meta": return e.metaKey;
            default: return e.altKey;
        }
    }

    isMultiSelectionKeyPressed = (e) => e.ctrlKey || e.metaKey;

    getSocketPosition = (socketEl) => {
        if (!socketEl) return { x: 0, y: 0 };
        const rect = socketEl.getBoundingClientRect();
        const surfaceRect = this.flowContentEl.getBoundingClientRect();
        const x = (rect.left + rect.width / 2 - surfaceRect.left) / this.zoom;
        const y = (rect.top + rect.height / 2 - surfaceRect.top) / this.zoom;
        return { x, y };
    }

    getClickedNode = (e) => e.target.closest(".flow-node");
    getClickedSocket = (e) => e.target.closest(".socket-anchor");
    getClickedResizeHandler = (e) => {
        if (e.target.closest(".resize-handle")) return this.getClickedNode(e);
        return null;
    }

    isInteractiveElement = (target) => {
        const tagName = target.tagName.toLowerCase();
        const interactiveTags = ['input', 'textarea', 'select', 'button', 'a', 'canvas'];
        if (interactiveTags.includes(tagName)) return true;
        if (target.isContentEditable) return true;
        const role = target.getAttribute('role');
        if (role && ['button', 'textbox', 'slider', 'spinbutton'].includes(role)) return true;
        if (target.getAttribute('draggable') === 'false') return true;
        if (target.closest('.resize-handle')) return true;
        return false;
    }

    clamp = (v, min, max) => Math.min(Math.max(v, min), max);

    splitNumberAndUnit = (input) => {
        const match = input.match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
        if (!match) return { number: 0, unit: "px" };
        return { number: parseFloat(match[1]), unit: match[2] || "" };
    }

    setGroupNodeSize = (el, w, h) => {
        el.style.width = w + 'px';
        el.style.height = h + 'px';
    }

    // =================== Long Press ===================

    startLongPress = (e, socket) => {
        this.cancelLongPress();
        this.longPressStartX = e.clientX;
        this.longPressStartY = e.clientY;

        this.longPressTimer = setTimeout(() => {
            const nodeId = socket.getAttribute("node-id");
            const socketName = socket.getAttribute("name");
            const containerRect = this.flowContentEl.getBoundingClientRect();
            const x = (e.clientX - containerRect.left) / this.zoom;
            const y = (e.clientY - containerRect.top) / this.zoom;
            this.dotnetRef.invokeMethodAsync("NotifySocketLongPress", nodeId, socketName, x, y);
            this.edgeController.resetTempConnection();
            this.longPressTimer = null;
        }, this.LONG_PRESS_DURATION);
    }

    cancelLongPress = () => {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    checkLongPressMove = (e) => {
        if (this.longPressTimer) {
            const dx = e.clientX - this.longPressStartX;
            const dy = e.clientY - this.longPressStartY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > this.LONG_PRESS_MOVE_THRESHOLD) {
                this.cancelLongPress();
            }
        }
    }

    // =================== API Proxies ===================

    // Proxies to controllers to maintain external API compatibility if needed
    setOffset = (x, y) => {
        this.offsetX = x;
        this.offsetY = y;
        this.viewportController.updateTransforms();
    }

    setZoom = (z) => {
        this.zoom = this.clamp(z, this.minZoom, this.maxZoom);
        this.viewportController.updateTransforms(true);
    }

    setCanvasProperties = (props) => {
        this.offsetX = props.offsetX;
        this.offsetY = props.offsetY;
        this.minZoom = props.minZoom || 0.1;
        this.maxZoom = props.maxZoom || 2.0;
        this.zoom = this.clamp(props.zoom, this.minZoom, this.maxZoom);
        this.isReadOnly = props.isReadOnly;
        this.viewportController.updateTransforms(true);
    }

    getCanvasProperties = () => {
        return {
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            zoom: this.zoom,
            minZoom: this.minZoom,
            maxZoom: this.maxZoom,
            isReadOnly: this.isReadOnly
        };
    }

    selectNodes = (nodesEl) => this.selectionController.selectNodes(nodesEl);
    clearSelection = () => this.selectionController.clearSelection();
    getSelectedNodes = () => [...this.selectionController.selectedNodes].map((n) => n.id);
    updateEdge = (nodeEl) => this.edgeController.updateEdges([nodeEl]);
    updatePath = (outputSocketEl, inputSocketEl, edgeEl) => {
        this.edgeController.updatePath(outputSocketEl, inputSocketEl, edgeEl);
    }
    addUpdateEdgeMap = (edgeEl, nodeEl, fromSocketEl, toSocketEl) => this.edgeController.addUpdateEdgeMap(edgeEl, nodeEl, fromSocketEl, toSocketEl);
    deleteEdgeFromMap = (edgeEl, nodeEl) => this.edgeController.deleteEdgeFromMap(edgeEl, nodeEl);
    setTempEdgeElement = (el) => this.edgeController.tempEdgeElement = el;
    moveNode = (nodeEl, x, y) => this.nodeController.moveNode(nodeEl, x, y);

    getTransformPosition = (nodeEl) => {
        return { x: nodeEl.dataX || 0, y: nodeEl.dataY || 0 };
    }

    setupGlobalWindowFunctions = () => {
        window.flowContextMenuSetup = (menuRef, dotNetRef) => {
            this.contextMenuElement = menuRef;
            this.contextMenuDotNetRef = dotNetRef;
            setTimeout(() => {
                this.clickOutsideHandler = (e) => {
                    if (this.contextMenuElement && !this.contextMenuElement.contains(e.target)) {
                        this.contextMenuDotNetRef.invokeMethodAsync('HideAsync');
                    }
                };
                document.addEventListener('click', this.clickOutsideHandler);
            }, 100);
        };

        window.flowContextMenuCleanup = () => {
            if (this.clickOutsideHandler) {
                document.removeEventListener('click', this.clickOutsideHandler);
                this.clickOutsideHandler = null;
            }
            this.contextMenuElement = null;
            this.contextMenuDotNetRef = null;
        };
    }
}

export function createFlowCanvas() {
  return new FlowCanvas();
}