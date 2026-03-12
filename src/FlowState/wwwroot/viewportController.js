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

        // Smooth zoom state
        /** @type {number} Accumulated zoom target (log-space) */
        this._zoomVelocity = 0;
        /** @type {number|null} RAF id for smooth zoom animation */
        this._zoomRafId = null;
        /** @type {number} Mouse X for current zoom gesture */
        this._zoomMouseX = 0;
        /** @type {number} Mouse Y for current zoom gesture */
        this._zoomMouseY = 0;
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
     * Normalizes a WheelEvent delta to a consistent pixel-equivalent value,
     * accounting for deltaMode differences across browsers and OS.
     * @param {WheelEvent} e
     * @returns {number} Normalized delta in pixels.
     */
    _normalizeWheelDelta = (e) => {
        let delta = e.deltaY;
        if (e.deltaMode === 1) {
            // Line mode (Firefox on Windows) — ~20px per line
            delta *= 20;
        } else if (e.deltaMode === 2) {
            // Page mode — ~400px per page
            delta *= 400;
        }
        return delta;
    };

    /**
     * Runs the smooth zoom animation loop, applying accumulated velocity each frame.
     */
    _zoomAnimationLoop = () => {
        if (Math.abs(this._zoomVelocity) < 0.0001) {
            this._zoomVelocity = 0;
            this._zoomRafId = null;

            // Zoom gesture ended — clean up state
            this.canvas.canvasEl.classList.remove("is-zooming");
            this.canvas.flowContentEl.style.willChange = "auto";

            if (!this.zoomNotifyTimer) {
                this.zoomNotifyTimer = setTimeout(() => {
                    this.canvas.dotnetRef.invokeMethodAsync("NotifyZoomed", this.canvas.zoom);
                    this.zoomNotifyTimer = null;
                }, 60);
            }
            return;
        }

        // Apply a fraction of the velocity this frame, then decay it
        const step = this._zoomVelocity * 0.25;
        this._zoomVelocity -= step;

        const newZoom = this.canvas.clamp(
            Math.exp(Math.log(this.canvas.zoom) + step),
            this.canvas.minZoom,
            this.canvas.maxZoom
        );

        if (Math.abs(newZoom - this.canvas.zoom) > 0.00001) {
            const ratio = newZoom / this.canvas.zoom;
            this.canvas.offsetX = this._zoomMouseX - (this._zoomMouseX - this.canvas.offsetX) * ratio;
            this.canvas.offsetY = this._zoomMouseY - (this._zoomMouseY - this.canvas.offsetY) * ratio;
            this.canvas.zoom = newZoom;
            this._performUpdateTransforms();
            this.canvas.viewportVirtualization.scheduleUpdate();
        }

        this._zoomRafId = requestAnimationFrame(this._zoomAnimationLoop);
    };

    /**
     * Handles mouse wheel events for zooming.
     * @param {WheelEvent} e - The wheel event.
     */
    onWheel = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (this.canvas.isInteractiveElement(e.target)) return;

        const rect = this.canvas.canvasEl.getBoundingClientRect();
        this._zoomMouseX = e.clientX - rect.left;
        this._zoomMouseY = e.clientY - rect.top;

        // Set zooming state
        this.canvas.canvasEl.classList.add("is-zooming");
        this.canvas.flowContentEl.style.willChange = "transform";

        // Pinch-to-zoom on Mac trackpads fires as wheel events with ctrlKey=true.
        // These deltas are already small and proportional — use a lighter multiplier.
        const isPinch = e.ctrlKey;

        const normalizedDelta = this._normalizeWheelDelta(e);

        // Convert pixel delta to a log-space zoom increment.
        // Using log-space ensures each scroll step is a consistent *percentage* change
        // regardless of the current zoom level (multiplicative, not additive).
        const sensitivity = isPinch
            ? 0.004 * this.canvas.scrollSpeed   // pinch: gentler, already fine-grained
            : 0.0008 * this.canvas.scrollSpeed; // scroll wheel: normalized pixels

        this._zoomVelocity += -normalizedDelta * sensitivity;

        // Clamp accumulated velocity to prevent runaway zooming on fast scrolls
        const maxVelocity = 0.4;
        this._zoomVelocity = Math.max(-maxVelocity, Math.min(maxVelocity, this._zoomVelocity));

        if (!this._zoomRafId) {
            this._zoomRafId = requestAnimationFrame(this._zoomAnimationLoop);
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
     */
    _performUpdateTransforms = () => {
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
