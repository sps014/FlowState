import { ViewportController } from "./viewportController.js";
import { SelectionController } from "./selectionController.js";
import { NodeController } from "./nodeController.js";
import { EdgeController } from "./edgeController.js";
import { SpatialGrid } from "./spatialGrid.js";
import { ViewportVirtualization } from "./viewportVirtualization.js";
import { setupGlobalDebugging } from "./spatialGridUtils.js";

class FlowCanvas {
  // DOM Elements
  /** @type {HTMLElement} Canvas element */
  canvasEl = null;
  /** @type {HTMLElement} Grid background element */
  gridEl = null;
  /** @type {HTMLElement} Container for flow content */
  flowContentEl = null;
  /** @type {object} DotNet reference for interop */
  dotnetRef = null;

  // Configuration
  /** @type {string|null} Name of custom JS function for edge paths */
  jsEdgePathFunctionName = null;
  /** @type {number} Current X offset */
  offsetX = 0;
  /** @type {number} Current Y offset */
  offsetY = 0;
  /** @type {number} Current zoom level */
  zoom = 1;
  /** @type {number} Minimum zoom level */
  minZoom = 0.2;
  /** @type {number} Maximum zoom level */
  maxZoom = 2.0;
  /** @type {string} CSS class for selected nodes */
  nodeSelectionClass = "selected";
  /** @type {boolean} Whether to auto-update socket colors */
  autoUpdateSocketColors = false;
  /** @type {string} Key to hold for panning (alt, shift, ctrl, meta) */
  panKey = "alt";
  /** @type {boolean} Read-only mode flag */
  isReadOnly = false;
  /** @type {number} Canvas mode (0: Default, 1: Pan) */
  canvasMode = 0;
  /** @type {number} Scroll speed multiplier */
  scrollSpeed = 1;

  // Long Press State (kept here as it spans multiple concepts)
  /** @type {number|null} Timer ID for long press */
  longPressTimer = null;
  /** @type {number} X position at start of long press */
  longPressStartX = 0;
  /** @type {number} Y position at start of long press */
  longPressStartY = 0;
  /** @type {number} Duration in ms to trigger long press */
  LONG_PRESS_DURATION = 1000;
  /** @type {number} Movement threshold in pixels to cancel long press */
  LONG_PRESS_MOVE_THRESHOLD = 10;

  // Document-level tracking state
  /** @type {boolean} Whether document-level tracking is active */
  isTrackingAtDocumentLevel = false;

  // Context Menu Helpers
  /** @type {HTMLElement} Context menu element */
  contextMenuElement = null;
  /** @type {object} DotNet reference for context menu */
  contextMenuDotNetRef = null;
  /** @type {function} Handler for clicking outside context menu */
  clickOutsideHandler = null;

  /** @type {ViewportController} Viewport controller */
  viewportController = null;
  /** @type {SelectionController} Selection controller */
  selectionController = null;
  /** @type {NodeController} Node controller */
  nodeController = null;
  /** @type {EdgeController} Edge controller */
  edgeController = null;
  /** @type {SpatialGrid} Spatial grid */
  spatialGrid = null;
  /** @type {ViewportVirtualization} Viewport virtualization */
  viewportVirtualization = null;

  /**
   * Initializes the FlowCanvas and its controllers.
   */
  constructor() {
    // Initialize Controllers
    this.viewportController = new ViewportController(this);
    this.selectionController = new SelectionController(this);
    this.nodeController = new NodeController(this);
    this.edgeController = new EdgeController(this);
    this.spatialGrid = new SpatialGrid(this);
    this.viewportVirtualization = new ViewportVirtualization(this);

    this.setupGlobalWindowFunctions();
  }

  // =================== Initialization ===================

  /**
   * Sets up event listeners and initializes references.
   * @param {object} elements - Object containing DOM elements.
   * @param {object} dotnetReference - DotNet reference for interop.
   */
  setupCanvasEvents = (elements, dotnetReference) => {
    this.canvasEl = elements.canvasElement;
    this.flowContentEl = elements.flowContentElement;
    this.gridEl = elements.gridElement;
    this.dotnetRef = dotnetReference;

    this.selectionController.setSelectionElement(elements.selectionRectElement);
    this.edgeController.setElements(
      elements.edgesSvgElement,
      elements.edgeHoverDetectorElement
    );

    this.viewportController.initGrid();

    this.canvasEl.tabIndex = -1;
    this.canvasEl.style.outline = "none";

    this.canvasEl.addEventListener("pointerdown", this.pointerdown);
    this.canvasEl.addEventListener("pointermove", this.pointermove);
    this.canvasEl.addEventListener("pointerup", this.pointerup);
    this.canvasEl.addEventListener("pointerleave", this.pointerleave);
    this.canvasEl.addEventListener("wheel", this.viewportController.onWheel);
    this.canvasEl.addEventListener("contextmenu", this.onContextMenu);
    this.canvasEl.addEventListener("keydown", this.onKeyDown);

    this.edgeController.setupEdgeHoverDetection();

    // Setup spatial grid mutation observer now that flowContentEl is available
    this.spatialGrid.setupMutationObserver();

    // Initialize spatial grid with existing nodes after a short delay
    // to ensure all nodes are rendered
    setTimeout(() => {
      this.spatialGrid.rebuild();
      this.viewportVirtualization.scheduleUpdate();
      // Setup debugging tools in development
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        setupGlobalDebugging(this);
      }
    }, 100);
  };

  /**
   * Removes event listeners from the canvas element.
   * @param {HTMLElement} el - The canvas element.
   */
  removeCanvasEvents = (el) => {
    el.removeEventListener("pointerdown", this.pointerdown);
    el.removeEventListener("pointermove", this.pointermove);
    el.removeEventListener("pointerup", this.pointerup);
    el.removeEventListener("pointerleave", this.pointerleave);
    el.removeEventListener("wheel", this.viewportController.onWheel);
    el.removeEventListener("contextmenu", this.onContextMenu);
    el.removeEventListener("keydown", this.onKeyDown);
    
    // Ensure document-level tracking is cleaned up
    this.detachDocumentTracking();
  };

  /**
   * Sets component properties from C#.
   * @param {object} props - Properties object.
   */
  setComponentProperties = (props) => {
    this.nodeSelectionClass = props.nodeSelectionClass || "selected";
    this.autoUpdateSocketColors = props.autoUpdateSocketColors || false;
    this.jsEdgePathFunctionName = props.jsEdgePathFunctionName || null;
    this.panKey = (props.panKey || "alt").toLowerCase();
    this.isReadOnly = props.isReadOnly || false;
    this.scrollSpeed = props.scrollSpeed || 0.02;
  };

  /**
   * Sets the read-only state of the canvas.
   * @param {boolean} readOnly - Whether the canvas is read-only.
   */
  setReadOnly = (readOnly) => {
    this.isReadOnly = readOnly;
  };

  /**
   * Sets the canvas interaction mode.
   * @param {number} mode - 0: Default, 1: Pan.
   */
  setCanvasMode = (mode) => {
    this.canvasMode = mode;
    if (this.canvasEl) {
      this.canvasEl.style.cursor = mode === 1 ? "grab" : "default";
    }
  };

  // =================== Event Router ===================

  /**
   * Handles pointer down events.
   * @param {PointerEvent} e - The pointer event.
   */
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
  };

  /**
   * Handles pointer move events.
   * @param {PointerEvent} e - The pointer event.
   */
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
  };

  /**
   * Handles pointer up events.
   * @param {PointerEvent} e - The pointer event.
   */
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

    // Cleanup document tracking if active
    this.detachDocumentTracking();
  };

  /**
   * Handles pointer leave events.
   * @param {PointerEvent} e - The pointer event.
   */
  pointerleave = (e) => {
    e.stopPropagation();
    this.cancelLongPress();

    // Check if we're in the middle of an operation that should continue outside
    const hasActiveOperation = 
      this.nodeController.isResizing ||
      this.edgeController.isConnectingNodes ||
      this.nodeController.isNodeDragging ||
      this.selectionController.isRectangleSelecting ||
      this.viewportController.isPanning;

    if (hasActiveOperation) {
      // Start tracking at document level to continue operation outside canvas
      this.attachDocumentTracking();
    }
  };

  /**
   * Handles key down events.
   * @param {KeyboardEvent} e - The keyboard event.
   */
  onKeyDown = (e) => {
    if (this.isInteractiveElement(e.target) || this.isReadOnly) return;

    // Handle undo/redo
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault();
      this.dotnetRef.invokeMethodAsync("HandleUndo");
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
      e.preventDefault();
      this.dotnetRef.invokeMethodAsync("HandleRedo");
      return;
    }

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
  };

  // =================== Document-Level Tracking ===================

  /**
   * Document-level pointer move handler.
   * @param {PointerEvent} e - The pointer event.
   */
  documentPointermove = (e) => {
    e.stopPropagation();

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
  };

  /**
   * Document-level pointer up handler.
   * @param {PointerEvent} e - The pointer event.
   */
  documentPointerup = (e) => {
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

    // Always cleanup after pointer up
    this.detachDocumentTracking();
  };

  /**
   * Document-level keydown handler for canceling operations.
   * @param {KeyboardEvent} e - The keyboard event.
   */
  documentKeydown = (e) => {
    // Handle Escape key to cancel operations
    if (e.key === "Escape") {
      e.preventDefault();
      if (this.nodeController.isResizing) {
        this.nodeController.stopResize();
      } else if (this.edgeController.isConnectingNodes) {
        this.edgeController.resetTempConnection();
      } else if (this.nodeController.isNodeDragging) {
        this.nodeController.dragNodeStop(e);
      } else if (this.selectionController.isRectangleSelecting) {
        this.selectionController.clearSelection();
      } else if (this.viewportController.isPanning) {
        this.viewportController.panEnd(e);
      }
      this.detachDocumentTracking();
    }
  };

  /**
   * Document-level keyup handler to cancel operations if modifier key is released.
   * @param {KeyboardEvent} e - The keyboard event.
   */
  documentKeyup = (e) => {
    // Cancel panning if pan key is released while panning
    if (this.viewportController.isPanning && this.canvasMode !== 1) {
      if (!this.isPanKeyPressed(e)) {
        this.viewportController.panEnd(e);
        this.detachDocumentTracking();
      }
    }
  };

  /**
   * Attaches document-level event listeners for tracking outside the canvas.
   */
  attachDocumentTracking = () => {
    if (this.isTrackingAtDocumentLevel) return;
    
    this.isTrackingAtDocumentLevel = true;
    document.addEventListener("pointermove", this.documentPointermove, true);
    document.addEventListener("pointerup", this.documentPointerup, true);
    document.addEventListener("keydown", this.documentKeydown, true);
    document.addEventListener("keyup", this.documentKeyup, true);
  };

  /**
   * Detaches document-level event listeners.
   */
  detachDocumentTracking = () => {
    if (!this.isTrackingAtDocumentLevel) return;
    
    this.isTrackingAtDocumentLevel = false;
    document.removeEventListener("pointermove", this.documentPointermove, true);
    document.removeEventListener("pointerup", this.documentPointerup, true);
    document.removeEventListener("keydown", this.documentKeydown, true);
    document.removeEventListener("keyup", this.documentKeyup, true);
  };

  /**
   * Handles context menu events.
   * @param {MouseEvent} e - The mouse event.
   */
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

    this.dotnetRef.invokeMethodAsync(
      "NotifyContextMenu",
      x,
      y,
      clientX,
      clientY
    );
  };

  // =================== Helpers & Utils ===================

  /**
   * Checks if the pan key is pressed.
   * @param {KeyboardEvent|MouseEvent} e - The event.
   * @returns {boolean} True if pan key is pressed.
   */
  isPanKeyPressed = (e) => {
    switch (this.panKey) {
      case "shift":
        return e.shiftKey;
      case "ctrl":
        return e.ctrlKey;
      case "alt":
        return e.altKey;
      case "meta":
        return e.metaKey;
      default:
        return e.altKey;
    }
  };

  /**
   * Checks if the multi-selection key is pressed.
   * @param {KeyboardEvent|MouseEvent} e - The event.
   * @returns {boolean} True if multi-selection key is pressed.
   */
  isMultiSelectionKeyPressed = (e) => e.ctrlKey || e.metaKey;

  /**
   * Gets the position of a socket relative to the flow content.
   * @param {HTMLElement} socketEl - The socket element.
   * @returns {{x: number, y: number}} The position.
   */
  getSocketPosition = (socketEl) => {
    if (!socketEl) return { x: 0, y: 0 };
    const rect = socketEl.getBoundingClientRect();
    const surfaceRect = this.flowContentEl.getBoundingClientRect();
    const x = (rect.left + rect.width / 2 - surfaceRect.left) / this.zoom;
    const y = (rect.top + rect.height / 2 - surfaceRect.top) / this.zoom;
    return { x, y };
  };

  /**
   * Gets the clicked node from the event target.
   * @param {Event} e - The event.
   * @returns {HTMLElement|null} The clicked node element.
   */
  getClickedNode = (e) => e.target.closest(".flow-node");

  /**
   * Gets the clicked socket from the event target.
   * @param {Event} e - The event.
   * @returns {HTMLElement|null} The clicked socket element.
   */
  getClickedSocket = (e) => e.target.closest(".socket-anchor");

  /**
   * Gets the clicked resize handler from the event target.
   * @param {Event} e - The event.
   * @returns {HTMLElement|null} The node associated with the resize handler.
   */
  getClickedResizeHandler = (e) => {
    if (e.target.closest(".resize-handle")) return this.getClickedNode(e);
    return null;
  };

  /**
   * Checks if the target element is interactive.
   * @param {HTMLElement} target - The target element.
   * @returns {boolean} True if the element is interactive.
   */
  isInteractiveElement = (target) => {
    const tagName = target.tagName.toLowerCase();
    const interactiveTags = [
      "input",
      "textarea",
      "select",
      "button",
      "a",
      "canvas",
    ];
    if (interactiveTags.includes(tagName)) return true;
    if (target.isContentEditable) return true;
    const role = target.getAttribute("role");
    if (role && ["button", "textbox", "slider", "spinbutton"].includes(role))
      return true;
    if (target.getAttribute("draggable") === "false") return true;
    if (target.closest(".resize-handle")) return true;
    return false;
  };

  /**
   * Clamps a value between a minimum and maximum.
   * @param {number} v - The value to clamp.
   * @param {number} min - The minimum value.
   * @param {number} max - The maximum value.
   * @returns {number} The clamped value.
   */
  clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /**
   * Splits a string into number and unit.
   * @param {string} input - The input string (e.g., "10px").
   * @returns {{number: number, unit: string}} The number and unit.
   */
  splitNumberAndUnit = (input) => {
    const match = input.match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
    if (!match) return { number: 0, unit: "px" };
    return { number: parseFloat(match[1]), unit: match[2] || "" };
  };

  /**
   * Sets the size of a group node.
   * @param {HTMLElement} el - The group node element.
   * @param {number} w - The width.
   * @param {number} h - The height.
   */
  setGroupNodeSize = (el, w, h) => {
    el.style.width = w + "px";
    el.style.height = h + "px";
  };

  // =================== Long Press ===================

  /**
   * Starts the long press timer.
   * @param {PointerEvent} e - The pointer event.
   * @param {HTMLElement} socket - The socket element.
   */
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
      this.dotnetRef.invokeMethodAsync(
        "NotifySocketLongPress",
        nodeId,
        socketName,
        x,
        y
      );
      this.edgeController.resetTempConnection();
      this.longPressTimer = null;
    }, this.LONG_PRESS_DURATION);
  };

  /**
   * Cancels the long press timer.
   */
  cancelLongPress = () => {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  };

  /**
   * Checks if the pointer has moved enough to cancel the long press.
   * @param {PointerEvent} e - The pointer event.
   */
  checkLongPressMove = (e) => {
    if (this.longPressTimer) {
      const dx = e.clientX - this.longPressStartX;
      const dy = e.clientY - this.longPressStartY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > this.LONG_PRESS_MOVE_THRESHOLD) {
        this.cancelLongPress();
      }
    }
  };

  // =================== API Proxies ===================

  // Proxies to controllers to maintain external API compatibility if needed
  // Proxies to controllers to maintain external API compatibility if needed
  /**
   * Sets the canvas offset.
   * @param {number} x - The x offset.
   * @param {number} y - The y offset.
   */
  setOffset = (x, y) => {
    this.offsetX = x;
    this.offsetY = y;
    this.viewportController.updateTransforms();
  };

  /**
   * Sets the zoom level.
   * @param {number} z - The zoom level.
   */
  setZoom = (z) => {
    this.zoom = this.clamp(z, this.minZoom, this.maxZoom);
    this.viewportController.updateTransforms(true);
  };

  /**
   * Sets canvas properties.
   * @param {object} props - The properties.
   */
  setCanvasProperties = (props) => {
    this.offsetX = props.offsetX;
    this.offsetY = props.offsetY;
    this.minZoom = props.minZoom || 0.1;
    this.maxZoom = props.maxZoom || 2.0;
    this.zoom = this.clamp(props.zoom, this.minZoom, this.maxZoom);
    this.isReadOnly = props.isReadOnly;
    this.viewportController.updateTransforms(true);
  };

  /**
   * Gets canvas properties.
   * @returns {object} The properties.
   */
  getCanvasProperties = () => {
    return {
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      zoom: this.zoom,
      minZoom: this.minZoom,
      maxZoom: this.maxZoom,
      isReadOnly: this.isReadOnly,
    };
  };

  /** @param {NodeList} nodesEl */
  selectNodes = (nodesEl) => this.selectionController.selectNodes(nodesEl);
  /** Clears selection */
  clearSelection = () => this.selectionController.clearSelection();
  /** @returns {string[]} Selected node IDs */
  getSelectedNodes = () =>
    [...this.selectionController.selectedNodes].map((n) => n.id);
  /** @param {HTMLElement} nodeEl */
  updateEdge = (nodeEl) => this.edgeController.updateEdges([nodeEl]);
  /** 
   * @param {HTMLElement} outputSocketEl 
   * @param {HTMLElement} inputSocketEl 
   * @param {HTMLElement} edgeEl 
   */
  updatePath = (outputSocketEl, inputSocketEl, edgeEl) => {
    this.edgeController.updatePath(outputSocketEl, inputSocketEl, edgeEl);
  };
  /**
   * @param {HTMLElement} edgeEl
   * @param {HTMLElement} nodeEl
   * @param {HTMLElement} fromSocketEl
   * @param {HTMLElement} toSocketEl
   */
  addUpdateEdgeMap = (edgeEl, nodeEl, fromSocketEl, toSocketEl) =>
    this.edgeController.addUpdateEdgeMap(
      edgeEl,
      nodeEl,
      fromSocketEl,
      toSocketEl
    );
  /**
   * @param {HTMLElement} edgeEl
   * @param {HTMLElement} nodeEl
   */
  deleteEdgeFromMap = (edgeEl, nodeEl) =>
    this.edgeController.deleteEdgeFromMap(edgeEl, nodeEl);
  /** @param {HTMLElement} el */
  setTempEdgeElement = (el) => (this.edgeController.tempEdgeElement = el);
  /**
   * @param {HTMLElement} nodeEl
   * @param {number} x
   * @param {number} y
   */
  moveNode = (nodeEl, x, y) => this.nodeController.moveNode(nodeEl, x, y);

  /**
   * @param {HTMLElement} nodeEl
   * @returns {{x: number, y: number}}
   */
  getTransformPosition = (nodeEl) => {
    return { x: nodeEl.dataX || 0, y: nodeEl.dataY || 0 };
  };

  // =================== Spatial Grid Management ===================

  /**
   * Rebuild spatial grid from scratch
   */
  rebuildSpatialGrid = () => {
    this.spatialGrid.rebuild();
  };

  /**
   * Sets up global window functions for context menu.
   */
  setupGlobalWindowFunctions = () => {
    window.flowContextMenuSetup = (menuRef, dotNetRef) => {
      this.contextMenuElement = menuRef;
      this.contextMenuDotNetRef = dotNetRef;
      setTimeout(() => {
        this.clickOutsideHandler = (e) => {
          if (
            this.contextMenuElement &&
            !this.contextMenuElement.contains(e.target)
          ) {
            this.contextMenuDotNetRef.invokeMethodAsync("HideAsync");
          }
        };
        document.addEventListener("click", this.clickOutsideHandler);
      }, 100);
    };

    window.flowContextMenuCleanup = () => {
      if (this.clickOutsideHandler) {
        document.removeEventListener("click", this.clickOutsideHandler);
        this.clickOutsideHandler = null;
      }
      this.contextMenuElement = null;
      this.contextMenuDotNetRef = null;
    };
  };
}

/**
 * Creates a new FlowCanvas instance.
 * @returns {FlowCanvas} The new instance.
 */
export function createFlowCanvas() {
  return new FlowCanvas();
}
