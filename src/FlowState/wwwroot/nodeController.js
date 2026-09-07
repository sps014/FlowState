/**
Handles Dragging, Moving, and Resizing Nodes
**/
export class NodeController {
    /**
     * @param {FlowCanvas} canvas - The main canvas instance.
     */
    constructor(canvas) {
        /** @type {FlowCanvas} */
        this.canvas = canvas;

        // Dragging State
        /** @type {boolean} Whether a node is being dragged */
        this.isNodeDragging = false;
        /** @type {boolean} Whether a group node is being dragged */
        this.isGroupNodeDragging = false;
        /** @type {Map<HTMLElement, {x: number, y: number}>} Origin positions of dragged nodes */
        this.dragOriginPositions = new Map();
        /** @type {number} Pointer X at drag start */
        this.dragPointerStartX = 0;
        /** @type {number} Pointer Y at drag start */
        this.dragPointerStartY = 0;
        /** @type {Set<HTMLElement>} Nodes grouped within the dragged group node */
        this.groupedNodes = new Set();

        // Resizing State
        /** @type {boolean} Whether a node is being resized */
        this.isResizing = false;
        /** @type {HTMLElement} Node being resized */
        this.resizeNodeEl = null;
        /** @type {number} Width at resize start */
        this.resizeStartWidth = 0;
        /** @type {number} Height at resize start */
        this.resizeStartHeight = 0;
    }

    // --- Resizing ---

    /**
     * Starts resizing a node.
     * @param {MouseEvent} e - The mouse event.
     * @param {HTMLElement} resizeHandler - The node to resize.
     */
    startResize(e, resizeHandler) {
        this.resizeNodeEl = resizeHandler;
        this.isResizing = true;
        const size = this.canvas.splitNumberAndUnit(this.resizeNodeEl.style.width);
        const height = this.canvas.splitNumberAndUnit(this.resizeNodeEl.style.height);
        this.resizeStartWidth = size.number || this.resizeNodeEl.offsetWidth;
        this.resizeStartHeight = height.number || this.resizeNodeEl.offsetHeight;
        this.canvas.canvasEl.style.cursor = 'se-resize';
        this.canvas.canvasEl.classList.add('is-dragging');
    }

    /**
     * Updates the node size during resize.
     * @param {MouseEvent} e - The mouse event.
     */
    resizeNode = (e) => {
        const rect = this.resizeNodeEl.getBoundingClientRect();
        let width = (e.pageX - rect.left) / this.canvas.zoom;
        let height = (e.pageY - rect.top) / this.canvas.zoom;
        if (this.canvas.snapToGrid) {
            width = this.canvas.snap(width);
            height = this.canvas.snap(height);
        }
        this.canvas.setGroupNodeSize(this.resizeNodeEl, Math.max(width, this.canvas.snapGridSize), Math.max(height, this.canvas.snapGridSize));
    }

    /**
     * Stops resizing the node.
     * @param {MouseEvent} e - The mouse event.
     */
    stopResize = (e) => {
        const width = this.canvas.splitNumberAndUnit(this.resizeNodeEl.style.width).number;
        const height = this.canvas.splitNumberAndUnit(this.resizeNodeEl.style.height).number;

        this.canvas.dotnetRef.invokeMethodAsync(
            "NotifyNodeResized",
            this.resizeNodeEl.id,
            this.resizeStartWidth,
            this.resizeStartHeight,
            width,
            height
        );
        this.isResizing = false;
        this.resizeNodeEl = null;
        this.canvas.canvasEl.classList.remove('is-dragging');
        this.canvas.canvasEl.style.cursor = this.canvas.canvasMode === 1 ? 'grab' : 'default';
    }

    // --- Dragging ---

    /**
     * Starts dragging a node.
     * @param {MouseEvent} e - The mouse event.
     * @param {HTMLElement} node - The node to drag.
     */
    dragNodeStart = (e, node) => {
        const selectionCtrl = this.canvas.selectionController;

        if (selectionCtrl.selectedNodes.size === 0) {
            selectionCtrl.selectedNodes.add(node);
            node.classList.add(this.canvas.nodeSelectionClass);
            this.canvas.dotnetRef.invokeMethodAsync("NotifyNodeSelected", node.id);
        }

        // Use spatial grid for efficient group node containment queries
        for (const n of selectionCtrl.selectedNodes) {
            if (n.getAttribute('kind') === 'Group') {
                this.isGroupNodeDragging = true;
                const childNodes = this.canvas.spatialGrid.queryNodesInNode(n);

                childNodes.forEach(child => {
                    this.groupedNodes.add(child);
                    selectionCtrl.selectedNodes.add(child);
                });
            }
        }

        this.isNodeDragging = true;
        this.dragPointerStartX = e.clientX;
        this.dragPointerStartY = e.clientY;
        this.canvas.canvasEl.classList.add('is-dragging');

        this.dragOriginPositions.clear();
        for (const n of selectionCtrl.selectedNodes) {
            const style = window.getComputedStyle(n);
            const matrix = new DOMMatrixReadOnly(style.transform);
            const x = n.dataX ?? matrix.m41;
            const y = n.dataY ?? matrix.m42;
            this.dragOriginPositions.set(n, { x, y });
        }
        e.stopPropagation();
    }

    /**
     * Updates node positions during drag.
     * @param {MouseEvent} e - The mouse event.
     */
    dragNodeMove = (e) => {
        if (!this.isNodeDragging || this.canvas.selectionController.selectedNodes.size === 0) return;

        const deltaX = (e.clientX - this.dragPointerStartX) / this.canvas.zoom;
        const deltaY = (e.clientY - this.dragPointerStartY) / this.canvas.zoom;

        for (const n of this.canvas.selectionController.selectedNodes) {
            const origin = this.dragOriginPositions.get(n);
            if (!origin) continue;
            let newX = origin.x + deltaX;
            let newY = origin.y + deltaY;
            if (this.canvas.snapToGrid) {
                newX = this.canvas.snap(newX);
                newY = this.canvas.snap(newY);
            }
            this.moveNode(n, newX, newY, false);
            this.canvas.spatialGrid.markDirty(n);
        }

        this.canvas.edgeController.updateEdges(this.canvas.selectionController.selectedNodes);
        e.stopPropagation();
    }

    /**
     * Stops dragging nodes.
     * @param {MouseEvent} e - The mouse event.
     */
    dragNodeStop = (e) => {
        if (!this.isNodeDragging) return;
        this.isNodeDragging = false;
        this.canvas.canvasEl.classList.remove('is-dragging');

        this.canvas.spatialGrid.updateDirtyNodes();
        this.canvas.viewportVirtualization.scheduleUpdate();

        if (this.isGroupNodeDragging) {
            for (const n of this.groupedNodes) {
                this.canvas.selectionController.selectedNodes.delete(n);
            }
            this.groupedNodes.clear();
            this.isGroupNodeDragging = false;
        }

        const ids = [];
        const oldXs = [];
        const oldYs = [];
        const xs = [];
        const ys = [];

        for (const n of this.canvas.selectionController.selectedNodes) {
            const origin = this.dragOriginPositions.get(n);
            if (!origin) continue;
            const nx = n.dataX ?? origin.x;
            const ny = n.dataY ?? origin.y;
            ids.push(n.id);
            oldXs.push(origin.x);
            oldYs.push(origin.y);
            xs.push(nx);
            ys.push(ny);
        }

        if (ids.length > 0) {
            this.canvas.dotnetRef.invokeMethodAsync("NotifyNodesMoved", ids, oldXs, oldYs, xs, ys);
        }

        this.dragOriginPositions.clear();
        e.stopPropagation();
    }

    /**
     * Nudges selected nodes by a canvas-space delta and records undo.
     * @param {number} dx
     * @param {number} dy
     */
    nudgeSelectedNodes = (dx, dy) => {
        const nodes = [...this.canvas.selectionController.selectedNodes];
        if (nodes.length === 0 || this.canvas.isReadOnly) return;

        const ids = [];
        const oldXs = [];
        const oldYs = [];
        const xs = [];
        const ys = [];

        for (const n of nodes) {
            const ox = n.dataX || 0;
            const oy = n.dataY || 0;
            let nx = ox + dx;
            let ny = oy + dy;
            if (this.canvas.snapToGrid) {
                nx = this.canvas.snap(nx);
                ny = this.canvas.snap(ny);
            }
            if (nx === ox && ny === oy) continue;
            ids.push(n.id);
            oldXs.push(ox);
            oldYs.push(oy);
            xs.push(nx);
            ys.push(ny);
            this.moveNode(n, nx, ny, false);
            this.canvas.spatialGrid.markDirty(n);
        }

        if (ids.length === 0) return;

        this.canvas.spatialGrid.updateDirtyNodes();
        this.canvas.edgeController.updateEdges(nodes);
        this.canvas.dotnetRef.invokeMethodAsync("NotifyNodesMoved", ids, oldXs, oldYs, xs, ys);
    }

    /**
     * Moves a node to a specific position.
     * @param {HTMLElement} nodeEl - The node element.
     * @param {number} x - The x coordinate.
     * @param {number} y - The y coordinate.
     * @param {boolean} updateEdges - Whether to update connected edges.
     */
    moveNode = (nodeEl, x, y, updateEdges = true) => {
        nodeEl.style.transform = `translate3d(${x}px, ${y}px, 0px)`;
        nodeEl.dataX = x;
        nodeEl.dataY = y;

        if (updateEdges) {
            this.canvas.edgeController.updateEdges([nodeEl]);
        }

        if (!this.isNodeDragging) {
            this.canvas.spatialGrid.updateNode(nodeEl);
        }
    }
}
