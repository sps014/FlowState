class FlowCanvas {
    // =================== Global State Variables (Class Fields) ===================

    // DOM Elements
    canvasEl = null;
    gridEl = null;
    flowContentEl = null;
    edgeHoverDetectorEl = null;
    edgesSvgEl = null;
    dotnetRef = null;
    jsEdgePathFunctionName = null;

    // Canvas State
    offsetX = 0;
    offsetY = 0;
    zoom = 1;
    minZoom = 0.2;
    maxZoom = 2.0;

    // Interaction State
    isPanning = false;
    isNodeDragging = false;
    isConnectingNodes = false;
    isRectangleSelecting = false;
    isGroupNodeDragging = false;
    isResizing = false;

    resizeNodeEl = null;

    groupedNodes = new Set();

    // Panning State
    startX = 0;
    startY = 0;
    lastOffsetX = 0;
    lastOffsetY = 0;

    // Node Dragging State
    selectedNodes = new Set();
    dragStartPositions = new Map();
    lastMouseX = 0;
    lastMouseY = 0;

    // Edge Hover State
    hoveredEdgeEl = null;

    // Rectangle Selection State
    rectangleSelectionStartX = 0;
    rectangleSelectionStartY = 0;
    rectangleSelectionElement = null;

    // Edge Connection State
    tempEdgeStartPosition = null;
    tempEdgeStopPosition = null;
    tempSocket = null;
    tempEdgeElement = null;

    // Long Press State
    longPressTimer = null;
    longPressStartX = 0;
    longPressStartY = 0;

    LONG_PRESS_DURATION = 1000; // milliseconds
    LONG_PRESS_MOVE_THRESHOLD = 10; // pixels

    // Edge Management
    nodeEdgeMap = new Map(); // Map<NodeEl, Edges[]>
    edgeSocketsMap = new Map(); // Map<EdgeEl, {to: SocketEl, from: SocketEl}>

    // Configuration
    nodeSelectionClass = "selected";
    autoUpdateSocketColors = false;
    panKey = "alt"; // "shift", "ctrl", "alt", or "meta"
    isReadOnly = false;
    canvasMode = 0; // 0 = Select, 1 = Pan
    scrollSpeed = 1; // Scroll speed for zooming

    // Cache
    cacheGridBackgroundSize = null;
    cacheGridSizeMatrix = null;

    // Context Menu Global Helpers
    contextMenuElement = null;
    contextMenuDotNetRef = null;
    clickOutsideHandler = null;

    constructor() {
        // Initialize global window helpers for context menu
        this.setupGlobalWindowFunctions();
    }

    // =================== Initialization & Cleanup ===================

    /**
     * Sets up canvas event listeners and initializes the canvas
     */
    setupCanvasEvents = (elements, dotnetReference) => {
        this.canvasEl = elements.canvasElement;
        this.flowContentEl = elements.flowContentElement;
        this.gridEl = elements.gridElement;
        this.rectangleSelectionElement = elements.selectionRectElement;
        this.edgeHoverDetectorEl = elements.edgeHoverDetectorElement;
        this.edgesSvgEl = elements.edgesSvgElement;
        this.dotnetRef = dotnetReference;

        const style = window.getComputedStyle(this.gridEl);
        this.cacheGridBackgroundSize = style.backgroundSize;

        // Make canvas focusable for keyboard events
        this.canvasEl.tabIndex = -1;
        this.canvasEl.style.outline = 'none';

        this.canvasEl.addEventListener("pointerdown", this.pointerdown);
        this.canvasEl.addEventListener("pointermove", this.pointermove);
        this.canvasEl.addEventListener("pointerup", this.pointerup);
        this.canvasEl.addEventListener("pointerleave", this.pointerleave);
        this.canvasEl.addEventListener("wheel", this.onWheel);
        this.canvasEl.addEventListener("contextmenu", this.onContextMenu);
        this.canvasEl.addEventListener("keydown", this.onKeyDown);

        // Setup edge hover detection on SVG container
        this.setupEdgeHoverDetection();
    }

    /**
     * Removes canvas event listeners
     */
    removeCanvasEvents = (el) => {
        el.removeEventListener("pointerdown", this.pointerdown);
        el.removeEventListener("pointermove", this.pointermove);
        el.removeEventListener("pointerup", this.pointerup);
        el.removeEventListener("pointerleave", this.pointerleave);
        el.removeEventListener("wheel", this.onWheel);
        el.removeEventListener("contextmenu", this.onContextMenu);
        el.removeEventListener("keydown", this.onKeyDown);
    }

    /**
     * Sets component-level properties
     */
    setComponentProperties = (props) => {
        this.nodeSelectionClass = props.nodeSelectionClass || "selected";
        this.autoUpdateSocketColors = props.autoUpdateSocketColors || false;
        this.jsEdgePathFunctionName = props.jsEdgePathFunctionName || null;
        this.panKey = (props.panKey || "alt").toLowerCase();
        this.isReadOnly = props.isReadOnly || false;
        this.scrollSpeed = props.scrollSpeed || 0.02;
    }

    /**
     * Sets read-only mode
     */
    setReadOnly = (readOnly) => {
        this.isReadOnly = readOnly;
    }

    /**
     * Sets the canvas interaction mode
     * @param {number} mode - 0 for Select mode, 1 for Pan mode
     */
    setCanvasMode = (mode) => {
        this.canvasMode = mode;

        // Update cursor based on mode
        if (this.canvasEl) {
            if (mode === 1) {
                this.canvasEl.style.cursor = 'grab';
            } else {
                this.canvasEl.style.cursor = 'default';
            }
        }
    }

    // =================== Pointer Event Handlers ===================

    /**
     * Checks if the pan modifier key is pressed
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
                return e.altKey; // default to alt
        }
    }

    /**
     * Checks if the multi-selection modifier key is pressed (Ctrl/Cmd for additive selection)
     */
    isMultiSelectionKeyPressed = (e) => {
        return e.ctrlKey || e.metaKey; // Ctrl on Windows/Linux, Cmd on Mac
    }

    pointerdown = (e) => {
        // Prevent event bubbling to parent elements
        e.stopPropagation();

        // Focus canvas to enable keyboard events (delete, arrows, etc.)
        this.canvasEl?.focus();

        const resizeHandler = this.getClickedResizeHandler(e);

        if (resizeHandler) {
            this.resizeNodeEl = resizeHandler;
            this.isResizing = true;
            this.canvasEl.style.cursor = 'se-resize';
            return;
        }

        const socket = this.getClickedSocket(e);
        const node = this.getClickedNode(e);

        if (socket) {
            // Don't start connection from interactive elements or in read-only mode
            if (this.isInteractiveElement(e.target) || this.isReadOnly) {
                return;
            }
            this.startLongPress(e, socket);
            this.tempSocket = socket;
            this.startTempConnection(e, socket);
        } else if (node) {
            this.handleNodeSelection(node, e);

            // Only start dragging if not clicking on interactive elements and not in read-only mode
            if (!this.isInteractiveElement(e.target) && !this.isReadOnly) {
                this.dragNodeStart(e, node);
            }
        } else {
            // Clicking on canvas background (no node)
            if (this.canvasMode === 1 || this.isPanKeyPressed(e)) {
                // Pan mode active or pan key pressed → pan canvas
                this.panStart(e);
            } else {
                // Select mode: rectangle selection (only if not read-only)
                if (!this.isReadOnly) {
                    this.startRectangleSelection(e);
                }
            }
        }
    }

    pointermove = (e) => {
        // Prevent event bubbling to parent elements
        e.stopPropagation();

        this.checkLongPressMove(e);

        if (this.isResizing) {
            this.resizeNode(e);
            return;
        }

        if (this.isConnectingNodes) {
            this.updateTempConnection(e);
            return;
        }
        if (this.isNodeDragging) {
            this.dragNodeMove(e);
            return;
        }
        if (this.isRectangleSelecting) {
            this.updateRectangleSelection(e);
            return;
        }
        if (this.isPanning) {
            this.panMove(e);
        }
    }

    pointerup = (e) => {
        // Prevent event bubbling to parent elements
        e.stopPropagation();

        this.cancelLongPress();

        if (this.isResizing) {
            this.stopResize();
        }
        if (this.isConnectingNodes) {
            this.stopTempConnection(e);
        } else if (this.isNodeDragging) {
            this.dragNodeStop(e);
        } else if (this.isRectangleSelecting) {
            this.stopRectangleSelection(e);
        } else if (this.isPanning) {
            this.panEnd(e);
        }
    }

    pointerleave = (e) => {
        // Prevent event bubbling to parent elements
        e.stopPropagation();

        this.cancelLongPress();

        if (this.isResizing) {
            this.stopResize();
        }
        if (this.isConnectingNodes) {
            this.stopTempConnection(e);
        } else if (this.isNodeDragging) {
            this.dragNodeStop(e);
        } else if (this.isRectangleSelecting) {
            this.stopRectangleSelection(e);
        } else if (this.isPanning) {
            this.panEnd(e);
        }
    }

    onKeyDown = (e) => {
        // Don't handle keyboard shortcuts if typing in an input field or in read-only mode
        if (this.isInteractiveElement(e.target) || this.isReadOnly) {
            return;
        }

        // Delete key or Backspace on Mac
        if (e.key === "Delete" || e.key === "Backspace") {
            if (this.hoveredEdgeEl) {
                // If edge is hovered, deselect nodes and delete only the edge
                e.preventDefault(); // Prevent browser back navigation on Backspace
                if (this.selectedNodes.size > 0) {
                    this.clearSelection();
                }
                this.deleteHoveredEdge();
            } else if (this.selectedNodes.size > 0) {
                // If no edge hovered but nodes selected, delete nodes
                e.preventDefault(); // Prevent browser back navigation on Backspace
                this.deleteSelectedNodes();
            }
        }
    }

    deleteHoveredEdge = () => {
        if (!this.hoveredEdgeEl || this.isReadOnly) return;

        const edgeId = this.hoveredEdgeEl.id || this.hoveredEdgeEl.getAttribute('id');
        if (edgeId) {
            this.dotnetRef.invokeMethodAsync("DeleteEdge", edgeId);
            this.hoveredEdgeEl = null;
            if (this.edgeHoverDetectorEl) {
                this.edgeHoverDetectorEl.removeAttribute('d');
            }
        }
    }

    onContextMenu = (e) => {
        // Prevent the browser context menu from appearing
        e.preventDefault();
        e.stopPropagation();

        // Don't open context menu if right-clicking on a node
        const clickedNode = this.getClickedNode(e);
        if (clickedNode) {
            return;
        }

        // Get client coordinates
        const clientX = e.clientX;
        const clientY = e.clientY;

        // Convert to canvas coordinates (accounting for zoom)
        // Note: containerRect already accounts for pan offset via transform
        const containerRect = this.flowContentEl.getBoundingClientRect();
        const x = (clientX - containerRect.left) / this.zoom;
        const y = (clientY - containerRect.top) / this.zoom;

        // Notify C# about the context menu event
        this.dotnetRef.invokeMethodAsync("NotifyContextMenu", x, y, clientX, clientY);
    }

    resizeNode = (e) => {
        const rect = this.resizeNodeEl.getBoundingClientRect();
        this.setGroupNodeSize(this.resizeNodeEl, e.pageX - rect.left, e.pageY - rect.top);
    }

    stopResize = (e) => {
        const width = this.splitNumberAndUnit(this.resizeNodeEl.style.width).number;
        const height = this.splitNumberAndUnit(this.resizeNodeEl.style.height).number;

        this.dotnetRef.invokeMethodAsync("NotifyNodeResized", this.resizeNodeEl.id, width, height);
        this.isResizing = false;
        this.resizeNodeEl = null;
        this.canvasEl.style.cursor = 'grab';
    }

    deleteSelectedNodes = () => {
        if (this.isReadOnly || this.selectedNodes.size === 0) return;

        const nodeIds = [...this.selectedNodes].map(node => node.id);

        this.clearSelection();

        // Notify .NET to delete the nodes
        this.dotnetRef.invokeMethodAsync("DeleteNodes", nodeIds);
    }

    // =================== Edge Connection (Temp Edge) ===================

    startTempConnection = (e, socket) => {
        this.isConnectingNodes = true;
        this.tempEdgeStartPosition = null;
        this.tempEdgeStopPosition = null;

        if (socket.getAttribute("type") == "input") {
            this.tempEdgeStopPosition = this.getSocketPosition(socket);
        } else {
            this.tempEdgeStartPosition = this.getSocketPosition(socket);
        }

        if (this.autoUpdateSocketColors) {
            const color = socket.getAttribute("innercolor");
            this.tempEdgeElement.setAttribute("stroke", color);
        }
    }

    updateTempConnection = (e) => {
        if (this.tempEdgeStartPosition == null && this.tempEdgeStopPosition == null) return;

        const containerRect = this.flowContentEl.getBoundingClientRect();

        let currentCursorPos = {
            x: (e.clientX - containerRect.left) / this.zoom,
            y: (e.clientY - containerRect.top) / this.zoom,
        };

        let path;

        if (this.tempEdgeStartPosition) {
            path = this.generateSvgPath(this.tempEdgeStartPosition, currentCursorPos);
        } else {
            path = this.generateSvgPath(currentCursorPos, this.tempEdgeStopPosition);
        }

        this.tempEdgeElement.setAttribute("d", path);
    }

    resetTempConnection = () => {
        if (this.tempEdgeElement) {
            this.tempEdgeElement.setAttribute("d", "");
        }
        this.tempSocket = null;
        this.tempEdgeStartPosition = null;
        this.tempEdgeStopPosition = null;
        this.isConnectingNodes = false;
    }

    stopTempConnection = (e) => {
        if (this.tempSocket) {
            let targetSocket = e.target.closest(".socket-anchor");
            let tempSocketType = this.tempSocket.getAttribute("type");

            if (
                targetSocket &&
                this.tempSocket !== targetSocket &&
                this.tempSocket.getAttribute("type") != targetSocket.getAttribute("type")
            ) {
                let fromNodeId;
                let toNodeId;
                let fromSocketName;
                let toSocketName;

                if (tempSocketType === "input") {
                    toNodeId = this.tempSocket.getAttribute("node-id");
                    fromNodeId = targetSocket.getAttribute("node-id");
                    toSocketName = this.tempSocket.getAttribute("name");
                    fromSocketName = targetSocket.getAttribute("name");
                } else {
                    toNodeId = targetSocket.getAttribute("node-id");
                    fromNodeId = this.tempSocket.getAttribute("node-id");
                    toSocketName = targetSocket.getAttribute("name");
                    fromSocketName = this.tempSocket.getAttribute("name");
                }

                this.connectRequest(fromNodeId, toNodeId, fromSocketName, toSocketName);
            }
        }

        this.resetTempConnection();
    }

    connectRequest = (fromNodeId, toNodeId, fromSocketName, toSocketName) => {
        this.dotnetRef.invokeMethodAsync("EdgeConnectRequest", fromNodeId, toNodeId, fromSocketName, toSocketName);
    }

    // =================== Long Press Detection ===================

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

            // Stop edge drawing after long press
            this.resetTempConnection();
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

    // =================== Node Selection ===================

    handleNodeSelection = (node, e) => {
        if (this.isMultiSelectionKeyPressed(e)) {
            // Multi-selection mode: toggle the clicked node
            if (this.selectedNodes.has(node)) {
                node.classList.remove(this.nodeSelectionClass);
                this.selectedNodes.delete(node);
                this.dotnetRef.invokeMethodAsync("NotifyNodeDeselected", node.id);
            } else {
                node.classList.add(this.nodeSelectionClass);
                this.selectedNodes.add(node);
                this.dotnetRef.invokeMethodAsync("NotifyNodeSelected", node.id);
            }
        } else {
            // If clicking on an already selected node, keep the selection (for dragging)
            if (this.selectedNodes.has(node)) {
                // Don't change selection - user wants to drag the group
                return;
            }

            // Clear selection and select only this node
            for (const n of this.selectedNodes) {
                n.classList.remove(this.nodeSelectionClass);
            }
            this.selectedNodes.clear();
            node.classList.add(this.nodeSelectionClass);
            this.selectedNodes.add(node);
            this.dotnetRef.invokeMethodAsync("NotifyNodeSelected", node.id);
        }

        const selectedIds = [...this.selectedNodes].map((n) => n.id);
        this.dotnetRef.invokeMethodAsync("NotifySelectionChanged", selectedIds);
    }

    /**
     * Selects nodes programmatically
     */
    selectNodes = (nodesEl) => {
        this.clearSelection();
        for (let node of nodesEl) {
            node.classList.add(this.nodeSelectionClass);
            this.selectedNodes.add(node);
            this.dotnetRef.invokeMethodAsync("NotifyNodeSelected", node.id);
        }
    }

    /**
     * Clears all node selections
     */
    clearSelection = () => {
        for (const n of this.selectedNodes) {
            n.classList.remove(this.nodeSelectionClass);
        }
        this.selectedNodes.clear();
    }

    /**
     * Gets the IDs of currently selected nodes
     */
    getSelectedNodes = () => {
        let ids = [...this.selectedNodes].map((n) => n.id);
        return ids;
    }

    // =================== Node Dragging ===================

    dragNodeStart = (e, node) => {
        if (this.selectedNodes.size === 0) {
            this.selectedNodes.add(node);
            node.classList.add(this.nodeSelectionClass);
            this.dotnetRef.invokeMethodAsync("NotifyNodeSelected", [node.id]);
        }

        const nodes = this.flowContentEl.querySelectorAll('.flow-node');

        for (const n of this.selectedNodes) {
            if (n.getAttribute('kind') === 'Group') {
                this.isGroupNodeDragging = true;
                const childNodes = this.getNodesContainedInGroup(n, nodes);
                childNodes.forEach(node => {
                    this.groupedNodes.add(node);
                    this.selectedNodes.add(node);
                });
            }
        }

        this.isNodeDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        this.dragStartPositions.clear();
        for (const n of this.selectedNodes) {
            const style = window.getComputedStyle(n);
            const matrix = new DOMMatrixReadOnly(style.transform);
            this.dragStartPositions.set(n, {
                x: matrix.m41,
                y: matrix.m42
            });
        }

        e.stopPropagation();
    }

    getNodesInGroup = (node) => {
        if (node.getAttribute('kind') !== 'Group') return [];
        const nodes = this.flowContentEl.querySelectorAll('.flow-node');
        const result = this.getNodesContainedInGroup(node, nodes);

        return [...result.map(node => node.id)];
    }

    getNodesContainedInGroup = (groupNode, nodes) => {
        const groupNodeRect = groupNode.getBoundingClientRect();
        const result = new Set();

        for (const n of nodes) {
            if (n === groupNode || n.getAttribute('kind') === 'Group') continue;
            const nodeRect = n.getBoundingClientRect();

            // Check if rectangles intersect (any overlap)
            const isIntersecting = !(
                nodeRect.right < groupNodeRect.left || // node is completely to the left
                nodeRect.left > groupNodeRect.right || // node is completely to the right
                nodeRect.bottom < groupNodeRect.top || // node is completely above
                nodeRect.top > groupNodeRect.bottom // node is completely below
            );

            if (isIntersecting) {
                result.add(n);
            }
        }

        return result;
    }


    dragNodeMove = (e) => {
        if (!this.isNodeDragging || this.selectedNodes.size === 0) return;

        const deltaX = (e.clientX - this.lastMouseX) / this.zoom;
        const deltaY = (e.clientY - this.lastMouseY) / this.zoom;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        for (const n of this.selectedNodes) {
            const startPos = this.dragStartPositions.get(n);
            const newX = startPos.x + deltaX;
            const newY = startPos.y + deltaY;
            n.style.transform = `translate3d(${newX}px, ${newY}px, 0px)`;
            this.dragStartPositions.set(n, {
                x: newX,
                y: newY
            });
        }

        this.updateEdges(this.selectedNodes);

        e.stopPropagation();
    }

    dragNodeStop = (e) => {
        if (!this.isNodeDragging) return;

        this.isNodeDragging = false;

        if (this.isGroupNodeDragging) {
            for (const n of this.groupedNodes) {
                this.selectedNodes.delete(n);
            }

            this.groupedNodes.clear();
            this.isGroupNodeDragging = false;

        }

        for (const n of this.selectedNodes) {
            const pos = this.dragStartPositions.get(n);
            if (pos) {
                this.dotnetRef.invokeMethodAsync("NotifyNodeMoved", n.id, pos.x, pos.y);
            }
        }

        this.dragStartPositions.clear();
        e.stopPropagation();
    }

    // =================== Canvas Panning ===================

    panStart = (e) => {
        this.isPanning = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.lastOffsetX = this.offsetX;
        this.lastOffsetY = this.offsetY;

        e.stopPropagation();
        e.preventDefault();
    }

    panMove = (e) => {
        if (!this.isPanning) return;

        this.offsetX = this.lastOffsetX + (e.clientX - this.startX);
        this.offsetY = this.lastOffsetY + (e.clientY - this.startY);

        this.updateTransforms();

        e.stopPropagation();
        e.preventDefault();
    }

    panEnd = (e) => {
        if (!this.isPanning) return;

        this.isPanning = false;
        this.dotnetRef.invokeMethodAsync("NotifyPanned", this.offsetX, this.offsetY);

        e.stopPropagation();
        e.preventDefault();
    }

    // =================== Canvas Zoom ===================

    onWheel = (e) => {
        // Always prevent default to stop page scroll
        e.preventDefault();
        e.stopPropagation();

        if (this.isInteractiveElement(e.target))
            return;

        const delta = e.deltaY * -this.scrollSpeed * 0.001;
        const newZoom = this.clamp(this.zoom + delta, this.minZoom, this.maxZoom);

        // If zoom didn't change (at min/max), still prevent scroll but don't update
        if (Math.abs(newZoom - this.zoom) < 0.001) return;

        const rect = this.canvasEl.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        this.offsetX = mouseX - (mouseX - this.offsetX) * (newZoom / this.zoom);
        this.offsetY = mouseY - (mouseY - this.offsetY) * (newZoom / this.zoom);

        this.zoom = newZoom;
        this.updateTransforms(true);

        this.dotnetRef.invokeMethodAsync("NotifyZoomed", this.zoom);
    }

    // =================== Transform & Background Updates ===================

    updateTransforms = (rerender = false) => {
        this.flowContentEl.style.transform = `translate3d(${this.offsetX.toFixed(1)}px, ${this.offsetY.toFixed(1)}px, 0px) scale(${this.zoom.toFixed(2)})`;

        if (rerender) {
            // force reflow to ensure smooth update
            this.flowContentEl.style.display = 'none';
            this.flowContentEl.offsetHeight; // force reflow
            this.flowContentEl.style.display = '';
        }
        this.panBackgroundPosition();
        this.scaleBackgroundSize();
    }

    scaleBackgroundSize = () => {
        const bgSizes = this.cacheGridBackgroundSize.split(",");

        const scaledSizes = bgSizes.map((size) => {
            const parts = size.trim().split(/\s+/);

            const scaled = parts.map((val) => {
                const match = val.match(/^([\d.]+)([a-z%]*)$/i);
                if (match) {
                    const [, num, unit] = match;
                    const scaledNum = parseFloat(num) * this.zoom;
                    return `${scaledNum}${unit}`;
                }
                return val;
            });

            return scaled.join(" ");
        });

        this.gridEl.style.backgroundSize = scaledSizes.join(", ");
    }

    panBackgroundPosition = () => {
        let gridSizeMatrix = this.getBackgroundSizesMatrix();
        let positions = [];

        for (let row of gridSizeMatrix) {
            const computed = `${this.offsetX % (row[0].number * this.zoom)}${row[0].unit} ${
      this.offsetY % (row[1].number * this.zoom)
    }${row[1].unit}`;
            positions.push(computed);
        }

        const backgroundPos = positions.join(",");
        this.gridEl.style.backgroundPosition = backgroundPos;
    }

    getBackgroundSizesMatrix = () => {
        if (this.cacheGridSizeMatrix != null) return this.cacheGridSizeMatrix;

        const bgSizes = this.cacheGridBackgroundSize.split(",");

        this.cacheGridSizeMatrix = bgSizes.map((size) => {
            const parts = size.trim().split(/\s+/);
            let res = [];
            for (let p of parts) {
                let d = this.splitNumberAndUnit(p);
                res.push(d);
            }
            return res;
        });

        return this.cacheGridSizeMatrix;
    }

    // =================== Edge Management ===================

    /**
     * Updates the path of an edge between two sockets
     */
    updatePath = (outputSocketEl, inputSocketEl, edgeEl) => {
        if (!outputSocketEl || !inputSocketEl || !edgeEl) return;

        const fromPos = this.getSocketPosition(outputSocketEl);
        const toPos = this.getSocketPosition(inputSocketEl);

        const path = this.generateSvgPath(toPos, fromPos);

        edgeEl.setAttribute("d", path);
    }

    /**
     * Adds or updates an edge in the node-edge map
     */
    addUpdateEdgeMap = (edgeEl, nodeEl, fromSocketEl, toSocketEl) => {
        if (this.nodeEdgeMap.has(nodeEl)) {
            this.nodeEdgeMap.get(nodeEl).push(edgeEl);
        } else {
            this.nodeEdgeMap.set(nodeEl, [edgeEl]);
        }

        this.edgeSocketsMap.set(edgeEl, {
            to: toSocketEl,
            from: fromSocketEl
        });
    }

    /**
     * Removes an edge from the node-edge map
     */
    deleteEdgeFromMap = (edgeEl, nodeEl) => {
        if (this.nodeEdgeMap.has(nodeEl)) {
            this.nodeEdgeMap.get(nodeEl).delete(edgeEl);
        }
        this.edgeSocketsMap.delete(edgeEl);
    }

    /**
     * Sets the temporary edge element for connection dragging
     */
    setTempEdgeElement = (el) => {
        this.tempEdgeElement = el;
    }

    // =================== Edge Hover Detection ===================

    setupEdgeHoverDetection = () => {
        if (!this.edgesSvgEl) return;

        // Listen only on the SVG container
        this.edgesSvgEl.addEventListener('mouseover', this.handleEdgeMouseEnter);
        this.edgesSvgEl.addEventListener('mouseout', this.handleEdgeMouseLeave);
    }

    handleEdgeMouseEnter = (e) => {
        if (!this.edgeHoverDetectorEl || this.isPanning || this.isNodeDragging || this.isConnectingNodes || this.isRectangleSelecting) return;

        const target = e.target;
        if (target && target.classList && target.classList.contains('edge') && target.id !== 'tempEdge') {
            const pathData = target.getAttribute('d');
            const stroke = target.getAttribute('stroke') || window.getComputedStyle(target).stroke;
            if (pathData) {
                this.edgeHoverDetectorEl.setAttribute('d', pathData);
                this.edgeHoverDetectorEl.setAttribute('stroke', stroke);
                this.hoveredEdgeEl = target;
            }
        }
    }

    handleEdgeMouseLeave = (e) => {
        if (!this.edgeHoverDetectorEl) return;

        const target = e.target;
        if (target && target.classList && target.classList.contains('edge') && target === this.hoveredEdgeEl) {
            this.edgeHoverDetectorEl.removeAttribute('d');
            this.hoveredEdgeEl = null;
        }
    }

    updateEdges = (nodesEl) => {
        if (nodesEl == null || nodesEl == undefined) return;

        let edgesEl = this.getEdgesElementsToBeUpdated(nodesEl);

        for (let edgeEl of edgesEl) {
            if (!this.edgeSocketsMap.has(edgeEl)) continue;
            const data = this.edgeSocketsMap.get(edgeEl);
            this.updatePath(data.to, data.from, edgeEl);
        }
    }

    updateEdge = (nodeEl) => {

        if (nodeEl == null || nodeEl == undefined) return;

        const nodesEl = [nodeEl];

        this.updateEdges(nodesEl);
    }

    getEdgesElementsToBeUpdated = (nodesEl) => {
        let edgesElements = new Set();
        for (let node of nodesEl) {
            if (this.nodeEdgeMap.has(node)) {
                for (let edge of this.nodeEdgeMap.get(node)) {
                    edgesElements.add(edge);
                }
            }
        }
        return edgesElements;
    }

    generateSvgPath = (to, from) => {
        if (this.jsEdgePathFunctionName) {
            return window[this.jsEdgePathFunctionName](to, from);
        }
        return this.createCubicPath(to, from);
    }

    createCubicPath = (to, from) => {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.hypot(dx, dy);
        const offset = Math.min(200, dist * 0.5);

        let c1, c2;

        c1 = {
            x: from.x - offset,
            y: from.y
        };
        c2 = {
            x: to.x + offset,
            y: to.y
        };

        return `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
    }

    // =================== Node Management ===================

    /**
     * Moves a node to the specified position
     */
    moveNode = (nodeEl, x, y) => {
        nodeEl.style.transform = `translate3d(${x}px, ${y}px, 0px)`;
        this.updateEdges([nodeEl]);
    }

    /**
     * Gets the transform position of a node
     */
    getTransformPosition = (nodeEl) => {
        const style = window.getComputedStyle(nodeEl);
        const matrix = new DOMMatrixReadOnly(style.transform);

        return {
            x: matrix.m41,
            y: matrix.m42
        };
    }

    // =================== Canvas Property Management ===================

    /**
     * Sets canvas properties including zoom and offsets
     */
    setCanvasProperties = (props) => {
        this.offsetX = props.offsetX;
        this.offsetY = props.offsetY;
        this.minZoom = props.minZoom || 0.1;
        this.maxZoom = props.maxZoom || 2.0;
        this.zoom = this.clamp(props.zoom, this.minZoom, this.maxZoom);
        this.isReadOnly = props.isReadOnly;

        this.updateTransforms(true);
    }

    /**
     * Gets current canvas properties
     */
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

    /**
     * Sets the canvas offset
     */
    setOffset = (x, y) => {
        this.offsetX = x;
        this.offsetY = y;
        this.updateTransforms();
    }

    /**
     * Sets the canvas zoom level
     */
    setZoom = (z) => {
        this.zoom = this.clamp(z, this.minZoom, this.maxZoom);
        this.updateTransforms(true);
    }

    // =================== Rectangle Selection ===================

    updateSelectionRectangle = (startX, startY, endX, endY) => {
        if (!this.rectangleSelectionElement) return;

        const left = Math.min(startX, endX);
        const top = Math.min(startY, endY);
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);

        this.rectangleSelectionElement.style.left = `${left}px`;
        this.rectangleSelectionElement.style.top = `${top}px`;
        this.rectangleSelectionElement.style.width = `${width}px`;
        this.rectangleSelectionElement.style.height = `${height}px`;
        this.rectangleSelectionElement.style.display = 'block';
    }

    removeSelectionRectangle = () => {
        if (this.rectangleSelectionElement) {
            this.rectangleSelectionElement.style.display = 'none';
        }
    }

    getNodesIntersectingRectangle = (rectLeft, rectTop, rectRight, rectBottom) => {
        const nodes = this.flowContentEl.querySelectorAll('.flow-node');
        const intersectingNodes = [];

        for (const node of nodes) {
            const nodeRect = node.getBoundingClientRect();
            const canvasRect = this.canvasEl.getBoundingClientRect();

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

    startRectangleSelection = (e) => {
        this.isRectangleSelecting = true;
        const canvasRect = this.canvasEl.getBoundingClientRect();
        this.rectangleSelectionStartX = e.clientX - canvasRect.left;
        this.rectangleSelectionStartY = e.clientY - canvasRect.top;

        // Initialize rectangle at start position with zero size
        this.updateSelectionRectangle(
            this.rectangleSelectionStartX,
            this.rectangleSelectionStartY,
            this.rectangleSelectionStartX,
            this.rectangleSelectionStartY
        );
    }

    updateRectangleSelection = (e) => {
        if (!this.isRectangleSelecting) return;

        const canvasRect = this.canvasEl.getBoundingClientRect();
        const currentX = e.clientX - canvasRect.left;
        const currentY = e.clientY - canvasRect.top;

        this.updateSelectionRectangle(
            this.rectangleSelectionStartX,
            this.rectangleSelectionStartY,
            currentX,
            currentY
        );
    }

    stopRectangleSelection = (e) => {
        if (!this.isRectangleSelecting) return;

        this.isRectangleSelecting = false;
        const canvasRect = this.canvasEl.getBoundingClientRect();
        const endX = e.clientX - canvasRect.left;
        const endY = e.clientY - canvasRect.top;

        const rectLeft = Math.min(this.rectangleSelectionStartX, endX);
        const rectTop = Math.min(this.rectangleSelectionStartY, endY);
        const rectRight = Math.max(this.rectangleSelectionStartX, endX);
        const rectBottom = Math.max(this.rectangleSelectionStartY, endY);

        const intersectingNodes = this.getNodesIntersectingRectangle(
            rectLeft,
            rectTop,
            rectRight,
            rectBottom
        );

        // Handle selection based on modifier keys
        if (!this.isMultiSelectionKeyPressed(e)) {
            // Clear existing selection if no modifier key
            this.clearSelection();
        }

        // Add intersecting nodes to selection
        for (const node of intersectingNodes) {
            if (!this.selectedNodes.has(node)) {
                node.classList.add(this.nodeSelectionClass);
                this.selectedNodes.add(node);
                this.dotnetRef.invokeMethodAsync("NotifyNodeSelected", node.id);
            }
        }

        const selectedIds = [...this.selectedNodes].map((n) => n.id);
        this.dotnetRef.invokeMethodAsync("NotifySelectionChanged", selectedIds);

        this.removeSelectionRectangle();
    }

    // =================== Utility Functions ===================

    getSocketPosition = (socketEl) => {
        if (!socketEl) return {
            x: 0,
            y: 0
        };

        const rect = socketEl.getBoundingClientRect();
        const surfaceRect = this.flowContentEl.getBoundingClientRect();

        const x = (rect.left + rect.width / 2 - surfaceRect.left) / this.zoom;
        const y = (rect.top + rect.height / 2 - surfaceRect.top) / this.zoom;

        return {
            x,
            y
        };
    }

    getClickedNode = (e) => {
        return e.target.closest(".flow-node");
    }

    getClickedSocket = (e) => {
        return e.target.closest(".socket-anchor");
    }

    getClickedResizeHandler = (e) => {
        if (e.target.closest(".resize-handle"))
            return this.getClickedNode(e);
        return null;
    }

    isInteractiveElement = (target) => {
        const tagName = target.tagName.toLowerCase();
        const interactiveTags = ['input', 'textarea', 'select', 'button', 'a', 'canvas'];

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

        //if draggable attribute is false , it is interactive
        if (target.getAttribute('draggable') === 'false')
            return true;


        if (target.closest('.resize-handle'))
            return true;


        return false;
    }

    clamp = (v, min, max) => {
        return Math.min(Math.max(v, min), max);
    }

    splitNumberAndUnit = (input) => {
        const match = input.match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
        if (!match) return {
            number: 0,
            unit: "px"
        };
        return {
            number: parseFloat(match[1]),
            unit: match[2] || "",
        };
    }

    setGroupNodeSize = (el, w, h) => {
        el.style.width = w + 'px';
        el.style.height = h + 'px';
    }

    // =================== Context Menu Click-Outside Handling ===================

    setupGlobalWindowFunctions = () => {
        window.flowContextMenuSetup = (menuRef, dotNetRef) => {
            this.contextMenuElement = menuRef;
            this.contextMenuDotNetRef = dotNetRef;

            // Add click listener with a small delay to avoid closing immediately
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