/**
 * Handles Connections, Drawing, and Hovering
 **/
export class EdgeController {
    constructor(canvas) {
        this.canvas = canvas;

        this.isConnectingNodes = false;
        this.edgesSvgEl = null;
        this.edgeHoverDetectorEl = null;
        this.hoveredEdgeEl = null;

        // Connection State
        this.tempEdgeStartPosition = null;
        this.tempEdgeStopPosition = null;
        this.tempSocket = null;
        this.tempEdgeElement = null;

        // Maps
        this.nodeEdgeMap = new Map(); // Map<NodeEl, Edges[]>
        this.edgeSocketsMap = new Map(); // Map<EdgeEl, {to: SocketEl, from: SocketEl}>
    }

    setElements(svgEl, hoverDetectorEl) {
        this.edgesSvgEl = svgEl;
        this.edgeHoverDetectorEl = hoverDetectorEl;
    }

    setupEdgeHoverDetection = () => {
        if (!this.edgesSvgEl) return;
        this.edgesSvgEl.addEventListener('mouseover', this.handleEdgeMouseEnter);
        this.edgesSvgEl.addEventListener('mouseout', this.handleEdgeMouseLeave);
    }

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

    handleEdgeMouseLeave = (e) => {
        if (!this.edgeHoverDetectorEl) return;
        const target = e.target;
        if (target && target.classList && target.classList.contains('edge') && target === this.hoveredEdgeEl) {
            this.edgeHoverDetectorEl.removeAttribute('d');
            this.hoveredEdgeEl = null;
        }
    }

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

    updateEdges = (nodesEl) => {
        if (nodesEl == null || nodesEl == undefined) return;
        let edgesEl = this.getEdgesElementsToBeUpdated(nodesEl);
        for (let edgeEl of edgesEl) {
            if (!this.edgeSocketsMap.has(edgeEl)) continue;
            const data = this.edgeSocketsMap.get(edgeEl);
            this.updatePath(data.to, data.from, edgeEl);
        }
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

    updatePath = (outputSocketEl, inputSocketEl, edgeEl) => {
        if (!outputSocketEl || !inputSocketEl || !edgeEl) return;
        const fromPos = this.canvas.getSocketPosition(outputSocketEl);
        const toPos = this.canvas.getSocketPosition(inputSocketEl);
        const path = this.generateSvgPath(toPos, fromPos);
        edgeEl.setAttribute("d", path);
    }

    generateSvgPath = (to, from) => {
        if (this.canvas.jsEdgePathFunctionName) {
            return window[this.canvas.jsEdgePathFunctionName](to, from);
        }
        return this.createCubicPath(to, from);
    }

    createCubicPath = (to, from) => {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.hypot(dx, dy);
        const offset = Math.min(200, dist * 0.5);
        let c1 = { x: from.x - offset, y: from.y };
        let c2 = { x: to.x + offset, y: to.y };
        return `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
    }

    addUpdateEdgeMap = (edgeEl, nodeEl, fromSocketEl, toSocketEl) => {
        if (this.nodeEdgeMap.has(nodeEl)) {
            this.nodeEdgeMap.get(nodeEl).push(edgeEl);
        } else {
            this.nodeEdgeMap.set(nodeEl, [edgeEl]);
        }
        this.edgeSocketsMap.set(edgeEl, { to: toSocketEl, from: fromSocketEl });
    }

    deleteEdgeFromMap = (edgeEl, nodeEl) => {
        if (this.nodeEdgeMap.has(nodeEl)) {
            this.nodeEdgeMap.get(nodeEl).delete(edgeEl);
        }
        this.edgeSocketsMap.delete(edgeEl);
    }
}