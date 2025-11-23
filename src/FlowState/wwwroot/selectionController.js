/**
 *  Handles Single/Multi selection & Rectangle Selection
 **/
export class SelectionController {
    /**
     * @param {FlowCanvas} canvas - The main canvas instance.
     */
    constructor(canvas) {
        /** @type {FlowCanvas} */
        this.canvas = canvas;
        /** @type {Set<HTMLElement>} Set of selected nodes */
        this.selectedNodes = new Set();

        // Rectangle Selection State
        /** @type {boolean} Whether rectangle selection is active */
        this.isRectangleSelecting = false;
        /** @type {number} Start X coordinate of rectangle selection */
        this.rectangleSelectionStartX = 0;
        /** @type {number} Start Y coordinate of rectangle selection */
        this.rectangleSelectionStartY = 0;
        /** @type {HTMLElement} The visual element for rectangle selection */
        this.rectangleSelectionElement = null;
    }

    /**
     * Sets the element used for visual rectangle selection.
     * @param {HTMLElement} el - The selection rectangle element.
     */
    setSelectionElement(el) {
        this.rectangleSelectionElement = el;
    }

    /**
     * Handles selection of a single node.
     * @param {HTMLElement} node - The node to select.
     * @param {MouseEvent} e - The mouse event.
     */
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

    /**
     * Selects a list of nodes.
     * @param {NodeList|Array} nodesEl - The nodes to select.
     */
    selectNodes = (nodesEl) => {
        this.clearSelection();
        for (let node of nodesEl) {
            node.classList.add(this.canvas.nodeSelectionClass);
            this.selectedNodes.add(node);
            this.canvas.dotnetRef.invokeMethodAsync("NotifyNodeSelected", node.id);
        }
    }

    /**
     * Clears the current selection.
     */
    clearSelection = () => {
        for (const n of this.selectedNodes) {
            n.classList.remove(this.canvas.nodeSelectionClass);
        }
        this.selectedNodes.clear();
    }

    /**
     * Deletes the currently selected nodes.
     */
    deleteSelectedNodes = () => {
        if (this.canvas.isReadOnly || this.selectedNodes.size === 0) return;
        const nodeIds = [...this.selectedNodes].map(node => node.id);
        const nodeCount = nodeIds.length;

        this.clearSelection();

        // Call C# to delete nodes
        this.canvas.dotnetRef.invokeMethodAsync("DeleteNodes", nodeIds).then(() => {
            // After C# removes nodes and Blazor updates DOM, cleanup stale spatial grid refs
            setTimeout(() => {
                this.canvas.spatialGrid.cleanupStaleNodes();
            }, 60); // Small delay to let Blazor update DOM
        });
    }

    /**
     * Notifies C# about selection changes.
     */
    notifySelectionChanged = () => {
        const selectedIds = [...this.selectedNodes].map((n) => n.id);
        this.canvas.dotnetRef.invokeMethodAsync("NotifySelectionChanged", selectedIds);
    }

    // --- Rectangle Selection ---

    /**
     * Starts rectangle selection.
     * @param {MouseEvent} e - The mouse event.
     */
    startRectangleSelection = (e) => {
        this.isRectangleSelecting = true;
        const canvasRect = this.canvas.canvasEl.getBoundingClientRect();
        this.rectangleSelectionStartX = e.clientX - canvasRect.left;
        this.rectangleSelectionStartY = e.clientY - canvasRect.top;
        this.updateSelectionRectangleVisual(this.rectangleSelectionStartX, this.rectangleSelectionStartY, this.rectangleSelectionStartX, this.rectangleSelectionStartY);
    }

    /**
     * Updates rectangle selection during drag.
     * @param {MouseEvent} e - The mouse event.
     */
    updateRectangleSelection = (e) => {
        if (!this.isRectangleSelecting) return;
        const canvasRect = this.canvas.canvasEl.getBoundingClientRect();
        const currentX = e.clientX - canvasRect.left;
        const currentY = e.clientY - canvasRect.top;
        this.updateSelectionRectangleVisual(this.rectangleSelectionStartX, this.rectangleSelectionStartY, currentX, currentY);
    }

    /**
     * Stops rectangle selection and selects intersecting nodes.
     * @param {MouseEvent} e - The mouse event.
     */
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

    /**
     * Updates the visual representation of the selection rectangle.
     * @param {number} startX - Start X coordinate.
     * @param {number} startY - Start Y coordinate.
     * @param {number} endX - End X coordinate.
     * @param {number} endY - End Y coordinate.
     */
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

    /**
     * Hides the selection rectangle.
     */
    removeSelectionRectangle = () => {
        if (this.rectangleSelectionElement) {
            this.rectangleSelectionElement.style.display = 'none';
        }
    }

    /**
     * Gets nodes intersecting with the selection rectangle.
     * @param {number} rectLeft - Left coordinate.
     * @param {number} rectTop - Top coordinate.
     * @param {number} rectRight - Right coordinate.
     * @param {number} rectBottom - Bottom coordinate.
     * @returns {Array<HTMLElement>} List of intersecting nodes.
     */
    getNodesIntersectingRectangle = (rectLeft, rectTop, rectRight, rectBottom) => {
        // Convert screen coordinates to world coordinates for spatial grid query
        const x = (rectLeft - this.canvas.offsetX) / this.canvas.zoom;
        const y = (rectTop - this.canvas.offsetY) / this.canvas.zoom;
        const width = (rectRight - rectLeft) / this.canvas.zoom;
        const height = (rectBottom - rectTop) / this.canvas.zoom;

        return this.canvas.spatialGrid.queryRect(x, y, width, height);
    }
}