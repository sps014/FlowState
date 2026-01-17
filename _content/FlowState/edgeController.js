/**
 * Handles Connections, Drawing, and Hovering
 **/
export class EdgeController {
    /**
     * @param {FlowCanvas} canvas - The main canvas instance.
     */
    constructor(canvas) {
        /** @type {FlowCanvas} */
        this.canvas = canvas;

        /** @type {boolean} Whether a connection is being dragged */
        this.isConnectingNodes = false;
        /** @type {SVGElement} SVG element containing edges */
        this.edgesSvgEl = null;
        /** @type {SVGPathElement} Element for detecting edge hover */
        this.edgeHoverDetectorEl = null;
        /** @type {SVGPathElement} Currently hovered edge element */
        this.hoveredEdgeEl = null;

        // Connection State
        /** @type {{x: number, y: number}|null} Start position of temp edge */
        this.tempEdgeStartPosition = null;
        /** @type {{x: number, y: number}|null} End position of temp edge */
        this.tempEdgeStopPosition = null;
        /** @type {HTMLElement} Socket where connection started */
        this.tempSocket = null;
        /** @type {SVGPathElement} Temporary edge element being dragged */
        this.tempEdgeElement = null;

        // Maps
        /** @type {Map<HTMLElement, SVGPathElement[]>} Map of nodes to connected edges */
        this.nodeEdgeMap = new Map(); // Map<NodeEl, Edges[]>
        /** @type {Map<SVGPathElement, {to: HTMLElement, from: HTMLElement}>} Map of edges to connected sockets */
        this.edgeSocketsMap = new Map(); // Map<EdgeEl, {to: SocketEl, from: SocketEl}>
    }

    /**
     * Sets the SVG elements for edges.
     * @param {SVGElement} svgEl - The SVG container.
     * @param {SVGPathElement} hoverDetectorEl - The hover detector path.
     */
    setElements(svgEl, hoverDetectorEl) {
        this.edgesSvgEl = svgEl;
        this.edgeHoverDetectorEl = hoverDetectorEl;
    }

    /**
     * Sets up event listeners for edge hover detection.
     */
    setupEdgeHoverDetection = () => {
        if (!this.edgesSvgEl) return;
        this.edgesSvgEl.addEventListener('mouseover', this.handleEdgeMouseEnter);
        this.edgesSvgEl.addEventListener('mouseout', this.handleEdgeMouseLeave);
    }

    /**
     * Handles mouse enter on an edge.
     * @param {MouseEvent} e - The mouse event.
     */
    handleEdgeMouseEnter = (e) => {
        if (!this.edgeHoverDetectorEl || this.canvas.viewportController.isPanning || this.canvas.nodeController.isNodeDragging || this.isConnectingNodes || this.canvas.selectionController.isRectangleSelecting) return;

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

    /**
     * Handles mouse leave from an edge.
     * @param {MouseEvent} e - The mouse event.
     */
    handleEdgeMouseLeave = (e) => {
        if (!this.edgeHoverDetectorEl) return;
        const target = e.target;
        if (target && target.classList && target.classList.contains('edge') && target === this.hoveredEdgeEl) {
            this.edgeHoverDetectorEl.removeAttribute('d');
            this.hoveredEdgeEl = null;
        }
    }

    /**
     * Deletes the currently hovered edge.
     */
    deleteHoveredEdge = () => {
        if (!this.hoveredEdgeEl || this.canvas.isReadOnly) return;
        const edgeId = this.hoveredEdgeEl.id || this.hoveredEdgeEl.getAttribute('id');
        if (edgeId) {
            this.canvas.dotnetRef.invokeMethodAsync("DeleteEdge", edgeId);
            this.hoveredEdgeEl = null;
            if (this.edgeHoverDetectorEl) {
                this.edgeHoverDetectorEl.removeAttribute('d');
            }
        }
    }

    // --- Temp Connection (Dragging Wire) ---

    /**
     * Starts a temporary connection (dragging a wire).
     * @param {MouseEvent} e - The mouse event.
     * @param {HTMLElement} socket - The socket where connection started.
     */
    startTempConnection = (e, socket) => {
        this.isConnectingNodes = true;
        this.tempEdgeStartPosition = null;
        this.tempEdgeStopPosition = null;

        if (socket.getAttribute("type") == "input") {
            this.tempEdgeStopPosition = this.canvas.getSocketPosition(socket);
        } else {
            this.tempEdgeStartPosition = this.canvas.getSocketPosition(socket);
        }

        if (this.canvas.autoUpdateSocketColors) {
            const color = socket.getAttribute("innercolor");
            this.tempEdgeElement.setAttribute("stroke", color);
        }
    }

    /**
     * Updates the temporary connection path during drag.
     * @param {MouseEvent} e - The mouse event.
     */
    updateTempConnection = (e) => {
        if (this.tempEdgeStartPosition == null && this.tempEdgeStopPosition == null) return;

        const containerRect = this.canvas.flowContentEl.getBoundingClientRect();
        let currentCursorPos = {
            x: (e.clientX - containerRect.left) / this.canvas.zoom,
            y: (e.clientY - containerRect.top) / this.canvas.zoom,
        };

        let path;
        if (this.tempEdgeStartPosition) {
            path = this.generateSvgPath(this.tempEdgeStartPosition, currentCursorPos);
        } else {
            path = this.generateSvgPath(currentCursorPos, this.tempEdgeStopPosition);
        }
        this.tempEdgeElement.setAttribute("d", path);
    }

    /**
     * Stops the temporary connection and triggers connection logic if valid.
     * @param {MouseEvent} e - The mouse event.
     */
    stopTempConnection = (e) => {
        if (this.tempSocket) {
            let targetSocket = e.target.closest(".socket-anchor");
            let tempSocketType = this.tempSocket.getAttribute("type");

            if (targetSocket && this.tempSocket !== targetSocket && this.tempSocket.getAttribute("type") != targetSocket.getAttribute("type")) {
                let fromNodeId, toNodeId, fromSocketName, toSocketName;

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
                this.canvas.dotnetRef.invokeMethodAsync("EdgeConnectRequest", fromNodeId, toNodeId, fromSocketName, toSocketName);
            }
        }
        this.resetTempConnection();
    }

    /**
     * Resets temporary connection state.
     */
    resetTempConnection = () => {
        if (this.tempEdgeElement) {
            this.tempEdgeElement.setAttribute("d", "");
        }
        this.tempSocket = null;
        this.tempEdgeStartPosition = null;
        this.tempEdgeStopPosition = null;
        this.isConnectingNodes = false;
    }

    // --- Drawing Logic ---

    /**
     * Updates edges connected to the given nodes.
     * @param {NodeList|Array} nodesEl - The nodes to update edges for.
     */
    updateEdges = (nodesEl) => {
        if (nodesEl == null || nodesEl == undefined) return;
        let edgesEl = this.getEdgesElementsToBeUpdated(nodesEl);
        for (let edgeEl of edgesEl) {
            if (!this.edgeSocketsMap.has(edgeEl)) continue;
            const data = this.edgeSocketsMap.get(edgeEl);
            this.updatePath(data.to, data.from, edgeEl);
        }
    }

    /**
     * Gets a set of edge elements that need updating.
     * @param {NodeList|Array} nodesEl - The nodes.
     * @returns {Set<SVGPathElement>} Set of edge elements.
     */
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

    /**
     * Updates the path of a specific edge.
     * @param {HTMLElement} outputSocketEl - The output socket.
     * @param {HTMLElement} inputSocketEl - The input socket.
     * @param {SVGPathElement} edgeEl - The edge element.
     */
    updatePath = (outputSocketEl, inputSocketEl, edgeEl) => {
        if (!outputSocketEl || !inputSocketEl || !edgeEl) return;
        const fromPos = this.canvas.getSocketPosition(outputSocketEl);
        const toPos = this.canvas.getSocketPosition(inputSocketEl);
        const path = this.generateSvgPath(toPos, fromPos);
        edgeEl.setAttribute("d", path);
    }

    /**
     * Generates an SVG path string.
     * @param {{x: number, y: number}} to - End point.
     * @param {{x: number, y: number}} from - Start point.
     * @returns {string} The SVG path data.
     */
    generateSvgPath = (to, from) => {
        if (this.canvas.jsEdgePathFunctionName) {
            return window[this.canvas.jsEdgePathFunctionName](to, from);
        }
        return this.createCubicPath(to, from);
    }

    /**
     * Creates a cubic bezier path.
     * @param {{x: number, y: number}} to - End point.
     * @param {{x: number, y: number}} from - Start point.
     * @returns {string} The SVG path data.
     */
    createCubicPath = (to, from) => {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.hypot(dx, dy);
        const offset = Math.min(200, dist * 0.5);
        let c1 = { x: from.x - offset, y: from.y };
        let c2 = { x: to.x + offset, y: to.y };
        return `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
    }

    /**
     * Adds or updates an edge in the tracking maps.
     * @param {SVGPathElement} edgeEl - The edge element.
     * @param {HTMLElement} nodeEl - The node element.
     * @param {HTMLElement} fromSocketEl - The source socket.
     * @param {HTMLElement} toSocketEl - The target socket.
     */
    addUpdateEdgeMap = (edgeEl, nodeEl, fromSocketEl, toSocketEl) => {
        if (this.nodeEdgeMap.has(nodeEl)) {
            this.nodeEdgeMap.get(nodeEl).push(edgeEl);
        } else {
            this.nodeEdgeMap.set(nodeEl, [edgeEl]);
        }
        this.edgeSocketsMap.set(edgeEl, { to: toSocketEl, from: fromSocketEl });
    }

    /**
     * Removes an edge from the tracking maps.
     * @param {SVGPathElement} edgeEl - The edge element.
     * @param {HTMLElement} nodeEl - The node element.
     */
    deleteEdgeFromMap = (edgeEl, nodeEl) => {
        if (this.nodeEdgeMap.has(nodeEl)) {
            this.nodeEdgeMap.get(nodeEl).delete(edgeEl);
        }
        this.edgeSocketsMap.delete(edgeEl);
    }
}