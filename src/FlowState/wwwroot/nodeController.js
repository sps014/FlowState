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
        /** @type {Map<HTMLElement, {x: number, y: number}>} Initial positions of dragged nodes */
        this.dragStartPositions = new Map();
        /** @type {number} Last mouse X position */
        this.lastMouseX = 0;
        /** @type {number} Last mouse Y position */
        this.lastMouseY = 0;
        /** @type {Set<HTMLElement>} Nodes grouped within the dragged group node */
        this.groupedNodes = new Set();

        // Resizing State
        /** @type {boolean} Whether a node is being resized */
        this.isResizing = false;
        /** @type {HTMLElement} Node being resized */
        this.resizeNodeEl = null;
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
        this.canvas.canvasEl.style.cursor = 'se-resize';
    }

    /**
     * Updates the node size during resize.
     * @param {MouseEvent} e - The mouse event.
     */
    resizeNode = (e) => {
        const rect = this.resizeNodeEl.getBoundingClientRect();
        this.canvas.setGroupNodeSize(this.resizeNodeEl, (e.pageX - rect.left) / this.canvas.zoom, (e.pageY - rect.top) / this.canvas.zoom);
    }

    /**
     * Stops resizing the node.
     * @param {MouseEvent} e - The mouse event.
     */
    stopResize = (e) => {
        const width = this.canvas.splitNumberAndUnit(this.resizeNodeEl.style.width).number;
        const height = this.canvas.splitNumberAndUnit(this.resizeNodeEl.style.height).number;

        this.canvas.dotnetRef.invokeMethodAsync("NotifyNodeResized", this.resizeNodeEl.id, width, height);
        this.isResizing = false;
        this.resizeNodeEl = null;
        this.canvas.canvasEl.style.cursor = 'grab';
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
            this.canvas.dotnetRef.invokeMethodAsync("NotifyNodeSelected", [node.id]);
        }

        // Use spatial grid for efficient group node containment queries
        for (const n of selectionCtrl.selectedNodes) {
            if (n.getAttribute('kind') === 'Group') {
                this.isGroupNodeDragging = true;
                // Use spatial grid
                const childNodes = this.canvas.spatialGrid.queryNodesInNode(n);

                childNodes.forEach(child => {
                    this.groupedNodes.add(child);
                    selectionCtrl.selectedNodes.add(child);
                });
            }
        }

        this.isNodeDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        this.dragStartPositions.clear();
        for (const n of selectionCtrl.selectedNodes) {
            const style = window.getComputedStyle(n);
            const matrix = new DOMMatrixReadOnly(style.transform);
            this.dragStartPositions.set(n, { x: matrix.m41, y: matrix.m42 });
        }
        e.stopPropagation();
    }

    /**
     * Updates node positions during drag.
     * @param {MouseEvent} e - The mouse event.
     */
    dragNodeMove = (e) => {
        if (!this.isNodeDragging || this.canvas.selectionController.selectedNodes.size === 0) return;

        const deltaX = (e.clientX - this.lastMouseX) / this.canvas.zoom;
        const deltaY = (e.clientY - this.lastMouseY) / this.canvas.zoom;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        for (const n of this.canvas.selectionController.selectedNodes) {
            const startPos = this.dragStartPositions.get(n);
            const newX = startPos.x + deltaX;
            const newY = startPos.y + deltaY;
            this.moveNode(n, newX, newY, false);
            this.dragStartPositions.set(n, { x: newX, y: newY });

            // Mark node as dirty in spatial grid for batch update
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

        // Update spatial grid with all dirty nodes at once
        this.canvas.spatialGrid.updateDirtyNodes();

        if (this.isGroupNodeDragging) {
            for (const n of this.groupedNodes) {
                this.canvas.selectionController.selectedNodes.delete(n);
            }
            this.groupedNodes.clear();
            this.isGroupNodeDragging = false;
        }

        const ids = [];
        const xs = [];
        const ys = [];

        for (const n of this.canvas.selectionController.selectedNodes) {
            const pos = this.dragStartPositions.get(n);
            if (pos) {
                ids.push(n.id);
                xs.push(pos.x);
                ys.push(pos.y);
            }
        }

        if (ids.length > 0) {
            this.canvas.dotnetRef.invokeMethodAsync("NotifyNodesMoved", ids, xs, ys);
        }

        this.dragStartPositions.clear();
        e.stopPropagation();
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

        // Update spatial grid immediately for single node moves
        // (batch operations will use markDirty instead)
        if (!this.isNodeDragging) {
            this.canvas.spatialGrid.updateNode(nodeEl);
        }
    }
}