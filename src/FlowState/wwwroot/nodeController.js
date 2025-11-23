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
        this.canvas.setGroupNodeSize(this.resizeNodeEl, e.pageX - rect.left, e.pageY - rect.top);
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

        const nodes = this.canvas.flowContentEl.querySelectorAll('.flow-node');

        for (const n of selectionCtrl.selectedNodes) {
            if (n.getAttribute('kind') === 'Group') {
                this.isGroupNodeDragging = true;
                const childNodes = this.getNodesContainedInGroup(n, nodes);
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
        }

        this.canvas.edgeController.updateEdges(this.canvas.selectionController.selectedNodes);
        e.stopPropagation();
    }

    dragNodeStop = (e) => {
        if (!this.isNodeDragging) return;
        this.isNodeDragging = false;

        if (this.isGroupNodeDragging) {
            for (const n of this.groupedNodes) {
                this.canvas.selectionController.selectedNodes.delete(n);
            }
            this.groupedNodes.clear();
            this.isGroupNodeDragging = false;
        }

        for (const n of this.canvas.selectionController.selectedNodes) {
            const pos = this.dragStartPositions.get(n);
            if (pos) {
                this.canvas.dotnetRef.invokeMethodAsync("NotifyNodeMoved", n.id, pos.x, pos.y);
            }
        }
        this.dragStartPositions.clear();
        e.stopPropagation();
    }

    getNodesContainedInGroup = (groupNode, nodes) => {
        const groupNodeRect = groupNode.getBoundingClientRect();
        const result = new Set();
        for (const n of nodes) {
            if (n === groupNode || n.getAttribute('kind') === 'Group') continue;
            const nodeRect = n.getBoundingClientRect();
            const isIntersecting = !(
                nodeRect.right < groupNodeRect.left ||
                nodeRect.left > groupNodeRect.right ||
                nodeRect.bottom < groupNodeRect.top ||
                nodeRect.top > groupNodeRect.bottom
            );
            if (isIntersecting) result.add(n);
        }
        return result;
    }

    moveNode = (nodeEl, x, y,updateEdges=true) => {
        nodeEl.style.transform = `translate3d(${x}px, ${y}px, 0px)`;
        nodeEl.dataX = x;
        nodeEl.dataY = y;

        if(updateEdges)
            this.canvas.edgeController.updateEdges([nodeEl]);
    }
}