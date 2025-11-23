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

        // Reflow debounce timer
        this.reflowTimer = null;
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
    };

    panMove = (e) => {
        if (!this.isPanning) return;

        this.canvas.offsetX = this.lastOffsetX + (e.clientX - this.startX);
        this.canvas.offsetY = this.lastOffsetY + (e.clientY - this.startY);

        this.updateTransforms();

        e.stopPropagation();
        e.preventDefault();
    };

    panEnd = (e) => {
        if (!this.isPanning) return;

        this.isPanning = false;
        this.canvas.dotnetRef.invokeMethodAsync(
            "NotifyPanned",
            this.canvas.offsetX,
            this.canvas.offsetY
        );

        e.stopPropagation();
        e.preventDefault();
    };

    onWheel = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (this.canvas.isInteractiveElement(e.target)) return;

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

        this.canvas.dotnetRef.invokeMethodAsync("NotifyZoomed", this.canvas.zoom);
    };

    updateTransforms = (rerender = false) => {
        this.canvas.flowContentEl.style.transform = `translate3d(${this.canvas.offsetX}px, ${this.canvas.offsetY}px, 0px) scale(${this.canvas.zoom})`;

        if (rerender) {
            // Clear previous timeout
            if (this.reflowTimer) {
                clearTimeout(this.reflowTimer);
            }

            // Set new timeout to trigger reflow after interaction settles
            this.reflowTimer = setTimeout(() => {
                requestAnimationFrame(() => {
                    this.canvas.flowContentEl.style.willChange = "transform";
                    this.canvas.flowContentEl.style.willChange = "auto";
                    this.reflowTimer = null;
                });
            }, 200);
        }
        this.panBackgroundPosition();
        this.scaleBackgroundSize();
    };

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
