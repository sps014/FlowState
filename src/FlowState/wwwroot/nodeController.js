/**
Handles Dragging, Moving, and Resizing Nodes
**/
export class NodeController {
    constructor(canvas) {
        this.canvas = canvas;

        // Dragging State
        this.isNodeDragging = false;
        this.isGroupNodeDragging = false;
        this.dragStartPositions = new Map();
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.groupedNodes = new Set();

        // Resizing State
        this.isResizing = false;
        this.resizeNodeEl = null;
    }

    // --- Resizing ---

    startResize(e, resizeHandler) {
        this.resizeNodeEl = resizeHandler;
        this.isResizing = true;
        this.canvas.canvasEl.style.cursor = 'se-resize';
    }

    resizeNode = (e) => {
        const rect = this.resizeNodeEl.getBoundingClientRect();
        this.canvas.setGroupNodeSize(this.resizeNodeEl, (e.pageX - rect.left) / this.canvas.zoom, (e.pageY - rect.top) / this.canvas.zoom);
    }

    stopResize = (e) => {
        const width = this.canvas.splitNumberAndUnit(this.resizeNodeEl.style.width).number;
        const height = this.canvas.splitNumberAndUnit(this.resizeNodeEl.style.height).number;

        this.canvas.dotnetRef.invokeMethodAsync("NotifyNodeResized", this.resizeNodeEl.id, width, height);        
        this.isResizing = false;
        this.resizeNodeEl = null;
        this.canvas.canvasEl.style.cursor = 'grab';
    }

    // --- Dragging ---

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