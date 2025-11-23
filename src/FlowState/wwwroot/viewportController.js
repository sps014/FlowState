/**
Handles Zooming, Panning, and Grid Background
**/
export class ViewportController {
    /**
     * @param {FlowCanvas} canvas - The main canvas instance.
     */
    constructor(canvas) {
        /** @type {FlowCanvas} */
        this.canvas = canvas;

        // Panning State
        /** @type {boolean} Whether the viewport is being panned */
        this.isPanning = false;
        /** @type {number} Start X coordinate of pan */
        this.startX = 0;
        /** @type {number} Start Y coordinate of pan */
        this.startY = 0;
        /** @type {number} Last X offset before pan */
        this.lastOffsetX = 0;
        /** @type {number} Last Y offset before pan */
        this.lastOffsetY = 0;

        // Cache
        /** @type {string} Cached background size string */
        this.cacheGridBackgroundSize = null;
        /** @type {Array<Array<{number: number, unit: string}>>} Cached grid size matrix */
        this.cacheGridSizeMatrix = null;

        // Reflow debounce timer
        /** @type {number|null} Timer for reflow debounce */
        this.reflowTimer = null;

        // Animation Frame State
        /** @type {boolean} Whether an animation frame is pending */
        this.ticking = false;
        /** @type {boolean} Whether a rerender is pending */
        this.pendingRerender = false;

        // Zoom state
        /** @type {number|null} Timer for zoom end detection */
        this.zoomTimer = null;
        /** @type {number|null} Timer for zoom notification throttling */
        this.zoomNotifyTimer = null;
    }

    /**
     * Initializes the grid background.
     */
    initGrid() {
        const style = window.getComputedStyle(this.canvas.gridEl);
        this.cacheGridBackgroundSize = style.backgroundSize;
    }

    /**
     * Starts panning the viewport.
     * @param {MouseEvent} e - The mouse event.
     */
    panStart = (e) => {
        this.isPanning = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.lastOffsetX = this.canvas.offsetX;
        this.lastOffsetY = this.canvas.offsetY;

        this.canvas.canvasEl.classList.add("is-panning");
        this.canvas.flowContentEl.style.willChange = "transform";

        e.stopPropagation();
        e.preventDefault();
    };

    /**
     * Updates the viewport position during pan.
     * @param {MouseEvent} e - The mouse event.
     */
    panMove = (e) => {
        if (!this.isPanning) return;

        this.canvas.offsetX = this.lastOffsetX + (e.clientX - this.startX);
        this.canvas.offsetY = this.lastOffsetY + (e.clientY - this.startY);

        this.updateTransforms();
        this.canvas.viewportVirtualization.scheduleUpdate();

        e.stopPropagation();
        e.preventDefault();
    };

    /**
     * Stops panning the viewport.
     * @param {MouseEvent} e - The mouse event.
     */
    panEnd = (e) => {
        if (!this.isPanning) return;

        this.isPanning = false;
        this.canvas.canvasEl.classList.remove("is-panning");
        this.canvas.flowContentEl.style.willChange = "auto";

        this.canvas.viewportVirtualization.scheduleUpdate();

        this.canvas.dotnetRef.invokeMethodAsync(
            "NotifyPanned",
            this.canvas.offsetX,
            this.canvas.offsetY
        );

        e.stopPropagation();
        e.preventDefault();
    };

    /**
     * Handles mouse wheel events for zooming.
     * @param {WheelEvent} e - The wheel event.
     */
    onWheel = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (this.canvas.isInteractiveElement(e.target)) return;

        // Set zooming state
        this.canvas.canvasEl.classList.add("is-zooming");
        this.canvas.flowContentEl.style.willChange = "transform";

        if (this.zoomTimer) clearTimeout(this.zoomTimer);
        this.zoomTimer = setTimeout(() => {
            this.canvas.canvasEl.classList.remove("is-zooming");
            this.canvas.flowContentEl.style.willChange = "auto";
            this.zoomTimer = null;
        }, 150);

        const delta = e.deltaY * -this.canvas.scrollSpeed * 0.001;
        const newZoom = this.canvas.clamp(
            this.canvas.zoom + delta,
            this.canvas.minZoom,
            this.canvas.maxZoom
        );

        if (Math.abs(newZoom - this.canvas.zoom) < 0.001) return;

        const rect = this.canvas.canvasEl.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        this.canvas.offsetX =
            mouseX - (mouseX - this.canvas.offsetX) * (newZoom / this.canvas.zoom);
        this.canvas.offsetY =
            mouseY - (mouseY - this.canvas.offsetY) * (newZoom / this.canvas.zoom);

        this.canvas.zoom = newZoom;
        this.updateTransforms(true);
        this.canvas.viewportVirtualization.scheduleUpdate();

        // Throttle notification to Blazor
        if (!this.zoomNotifyTimer) {
            this.zoomNotifyTimer = setTimeout(() => {
                this.canvas.dotnetRef.invokeMethodAsync("NotifyZoomed", this.canvas.zoom);
                this.zoomNotifyTimer = null;
            }, 60);
        }
    };

    /**
     * Updates CSS transforms for the viewport.
     * @param {boolean} rerender - Whether to force a rerender of background.
     */
    updateTransforms = (rerender = false) => {
        if (rerender) this.pendingRerender = true;

        if (!this.ticking) {
            requestAnimationFrame(() => {
                this._performUpdateTransforms(this.pendingRerender);
                this.pendingRerender = false;
                this.ticking = false;
            });
            this.ticking = true;
        }
    };

    /**
     * Performs the actual transform update.
     * @param {boolean} rerender - Whether to force a rerender of background.
     */
    _performUpdateTransforms = (rerender) => {
        this.canvas.flowContentEl.style.transform = `translate3d(${this.canvas.offsetX}px, ${this.canvas.offsetY}px, 0px) scale(${this.canvas.zoom})`;
        this.panBackgroundPosition();
        this.scaleBackgroundSize();
    };

    /**
     * Scales the background size based on zoom level.
     */
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
    };

    /**
     * Updates the background position based on offset.
     */
    panBackgroundPosition = () => {
        let gridSizeMatrix = this.getBackgroundSizesMatrix();
        let positions = [];

        for (let row of gridSizeMatrix) {
            const computed = `${this.canvas.offsetX % (row[0].number * this.canvas.zoom)
                }${row[0].unit} ${this.canvas.offsetY % (row[1].number * this.canvas.zoom)
                }${row[1].unit}`;
            positions.push(computed);
        }

        this.canvas.gridEl.style.backgroundPosition = positions.join(",");
    };

    /**
     * Gets the parsed background sizes matrix.
     * @returns {Array<Array<{number: number, unit: string}>>} The size matrix.
     */
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
    };
}
