/**
Handles Zooming, Panning, and Grid Background
**/
export class ViewportController {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Panning State
        this.isPanning = false;
        this.startX = 0;
        this.startY = 0;
        this.lastOffsetX = 0;
        this.lastOffsetY = 0;

        // Cache
        this.cacheGridBackgroundSize = null;
        this.cacheGridSizeMatrix = null;
    }

    initGrid() {
        const style = window.getComputedStyle(this.canvas.gridEl);
        this.cacheGridBackgroundSize = style.backgroundSize;
    }

    panStart = (e) => {
        this.isPanning = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.lastOffsetX = this.canvas.offsetX;
        this.lastOffsetY = this.canvas.offsetY;

        e.stopPropagation();
        e.preventDefault();
    }

    panMove = (e) => {
        if (!this.isPanning) return;

        this.canvas.offsetX = this.lastOffsetX + (e.clientX - this.startX);
        this.canvas.offsetY = this.lastOffsetY + (e.clientY - this.startY);

        this.updateTransforms();

        e.stopPropagation();
        e.preventDefault();
    }

    panEnd = (e) => {
        if (!this.isPanning) return;

        this.isPanning = false;
        this.canvas.dotnetRef.invokeMethodAsync("NotifyPanned", this.canvas.offsetX, this.canvas.offsetY);

        e.stopPropagation();
        e.preventDefault();
    }

    onWheel = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (this.canvas.isInteractiveElement(e.target)) return;

        const delta = e.deltaY * -this.canvas.scrollSpeed * 0.001;
        const newZoom = this.canvas.clamp(this.canvas.zoom + delta, this.canvas.minZoom, this.canvas.maxZoom);

        if (Math.abs(newZoom - this.canvas.zoom) < 0.001) return;

        const rect = this.canvas.canvasEl.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        this.canvas.offsetX = mouseX - (mouseX - this.canvas.offsetX) * (newZoom / this.canvas.zoom);
        this.canvas.offsetY = mouseY - (mouseY - this.canvas.offsetY) * (newZoom / this.canvas.zoom);

        this.canvas.zoom = newZoom;
        this.updateTransforms(true);

        this.canvas.dotnetRef.invokeMethodAsync("NotifyZoomed", this.canvas.zoom);
    }

    updateTransforms = (rerender = false) => {
        this.canvas.flowContentEl.style.transform = `translate3d(${this.canvas.offsetX.toFixed(1)}px, ${this.canvas.offsetY.toFixed(1)}px, 0px) scale(${this.canvas.zoom.toFixed(2)})`;

        if (rerender) {
            this.canvas.flowContentEl.style.display = 'none';
            this.canvas.flowContentEl.offsetHeight; // force reflow
            this.canvas.flowContentEl.style.display = '';
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
                    const scaledNum = parseFloat(num) * this.canvas.zoom;
                    return `${scaledNum}${unit}`;
                }
                return val;
            });
            return scaled.join(" ");
        });
        this.canvas.gridEl.style.backgroundSize = scaledSizes.join(", ");
    }

    panBackgroundPosition = () => {
        let gridSizeMatrix = this.getBackgroundSizesMatrix();
        let positions = [];

        for (let row of gridSizeMatrix) {
            const computed = `${this.canvas.offsetX % (row[0].number * this.canvas.zoom)}${row[0].unit} ${this.canvas.offsetY % (row[1].number * this.canvas.zoom)}${row[1].unit}`;
            positions.push(computed);
        }

        this.canvas.gridEl.style.backgroundPosition = positions.join(",");
    }

    getBackgroundSizesMatrix = () => {
        if (this.cacheGridSizeMatrix != null) return this.cacheGridSizeMatrix;
        const bgSizes = this.cacheGridBackgroundSize.split(",");
        this.cacheGridSizeMatrix = bgSizes.map((size) => {
            const parts = size.trim().split(/\s+/);
            let res = [];
            for (let p of parts) {
                res.push(this.canvas.splitNumberAndUnit(p));
            }
            return res;
        });
        return this.cacheGridSizeMatrix;
    }
}

// ============================================================================
// 2. SelectionController: Handles Single/Multi selection & Rectangle Selection
// ============================================================================
class SelectionController {
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