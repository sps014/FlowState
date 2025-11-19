/**
 *  Handles Single/Multi selection & Rectangle Selection
 **/
export class SelectionController {
    constructor(canvas) {
        this.canvas = canvas;
        this.selectedNodes = new Set();
        
        // Rectangle Selection State
        this.isRectangleSelecting = false;
        this.rectangleSelectionStartX = 0;
        this.rectangleSelectionStartY = 0;
        this.rectangleSelectionElement = null;
    }

    setSelectionElement(el) {
        this.rectangleSelectionElement = el;
    }

    handleNodeSelection = (node, e) => {
        if (this.canvas.isMultiSelectionKeyPressed(e)) {
            if (this.selectedNodes.has(node)) {
                node.classList.remove(this.canvas.nodeSelectionClass);
                this.selectedNodes.delete(node);
                this.canvas.dotnetRef.invokeMethodAsync("NotifyNodeDeselected", node.id);
            } else {
                node.classList.add(this.canvas.nodeSelectionClass);
                this.selectedNodes.add(node);
                this.canvas.dotnetRef.invokeMethodAsync("NotifyNodeSelected", node.id);
            }
        } else {
            if (this.selectedNodes.has(node)) return; // Maintain selection for drag

            this.clearSelection();
            node.classList.add(this.canvas.nodeSelectionClass);
            this.selectedNodes.add(node);
            this.canvas.dotnetRef.invokeMethodAsync("NotifyNodeSelected", node.id);
        }
        this.notifySelectionChanged();
    }

    selectNodes = (nodesEl) => {
        this.clearSelection();
        for (let node of nodesEl) {
            node.classList.add(this.canvas.nodeSelectionClass);
            this.selectedNodes.add(node);
            this.canvas.dotnetRef.invokeMethodAsync("NotifyNodeSelected", node.id);
        }
    }

    clearSelection = () => {
        for (const n of this.selectedNodes) {
            n.classList.remove(this.canvas.nodeSelectionClass);
        }
        this.selectedNodes.clear();
    }

    deleteSelectedNodes = () => {
        if (this.canvas.isReadOnly || this.selectedNodes.size === 0) return;
        const nodeIds = [...this.selectedNodes].map(node => node.id);
        this.clearSelection();
        this.canvas.dotnetRef.invokeMethodAsync("DeleteNodes", nodeIds);
    }

    notifySelectionChanged = () => {
        const selectedIds = [...this.selectedNodes].map((n) => n.id);
        this.canvas.dotnetRef.invokeMethodAsync("NotifySelectionChanged", selectedIds);
    }

    // --- Rectangle Selection ---

    startRectangleSelection = (e) => {
        this.isRectangleSelecting = true;
        const canvasRect = this.canvas.canvasEl.getBoundingClientRect();
        this.rectangleSelectionStartX = e.clientX - canvasRect.left;
        this.rectangleSelectionStartY = e.clientY - canvasRect.top;
        this.updateSelectionRectangleVisual(this.rectangleSelectionStartX, this.rectangleSelectionStartY, this.rectangleSelectionStartX, this.rectangleSelectionStartY);
    }

    updateRectangleSelection = (e) => {
        if (!this.isRectangleSelecting) return;
        const canvasRect = this.canvas.canvasEl.getBoundingClientRect();
        const currentX = e.clientX - canvasRect.left;
        const currentY = e.clientY - canvasRect.top;
        this.updateSelectionRectangleVisual(this.rectangleSelectionStartX, this.rectangleSelectionStartY, currentX, currentY);
    }

    stopRectangleSelection = (e) => {
        if (!this.isRectangleSelecting) return;
        this.isRectangleSelecting = false;
        const canvasRect = this.canvas.canvasEl.getBoundingClientRect();
        const endX = e.clientX - canvasRect.left;
        const endY = e.clientY - canvasRect.top;

        const rectLeft = Math.min(this.rectangleSelectionStartX, endX);
        const rectTop = Math.min(this.rectangleSelectionStartY, endY);
        const rectRight = Math.max(this.rectangleSelectionStartX, endX);
        const rectBottom = Math.max(this.rectangleSelectionStartY, endY);

        const intersectingNodes = this.getNodesIntersectingRectangle(rectLeft, rectTop, rectRight, rectBottom);

        if (!this.canvas.isMultiSelectionKeyPressed(e)) {
            this.clearSelection();
        }

        for (const node of intersectingNodes) {
            if (!this.selectedNodes.has(node)) {
                node.classList.add(this.canvas.nodeSelectionClass);
                this.selectedNodes.add(node);
                this.canvas.dotnetRef.invokeMethodAsync("NotifyNodeSelected", node.id);
            }
        }
        this.notifySelectionChanged();
        this.removeSelectionRectangle();
    }

    updateSelectionRectangleVisual = (startX, startY, endX, endY) => {
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
        const nodes = this.canvas.flowContentEl.querySelectorAll('.flow-node');
        const intersectingNodes = [];
        for (const node of nodes) {
            const nodeRect = node.getBoundingClientRect();
            const canvasRect = this.canvas.canvasEl.getBoundingClientRect();
            const nodeLeft = nodeRect.left - canvasRect.left;
            const nodeTop = nodeRect.top - canvasRect.top;
            const nodeRight = nodeRect.right - canvasRect.left;
            const nodeBottom = nodeRect.bottom - canvasRect.top;

            const intersects = !(nodeRight < rectLeft || nodeLeft > rectRight || nodeBottom < rectTop || nodeTop > rectBottom);
            if (intersects) intersectingNodes.push(node);
        }
        return intersectingNodes;
    }
}