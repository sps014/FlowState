/**
 * Spatial Grid for efficient spatial queries on flow nodes
 */
export class SpatialGrid {
    /**
     * @param {FlowCanvas} canvas - The main canvas instance.
     */
    constructor(canvas) {
        /** @type {FlowCanvas} */
        this.canvas = canvas;

        // Grid configuration
        /** @type {number} Size of each grid cell in pixels */
        this.cellSize = 200; // Size of each grid cell in pixels
        /** @type {Map<string, Set<HTMLElement>>} Map of cell keys to sets of nodes */
        this.grid = new Map(); // Map<cellKey, Set<nodeElement>>
        /** @type {WeakMap<HTMLElement, Set<string>>} Map of nodes to their cell keys */
        this.nodeToCell = new WeakMap(); // WeakMap<nodeElement, Set<cellKeys>>

        // Bounding rect cache with WeakMap to prevent memory leaks
        // Caches screen-space dimensions (zoom-independent) and world position
        /** @type {WeakMap<HTMLElement, {worldX: number, worldY: number, screenWidth: number, screenHeight: number}>} */
        this.rectCache = new WeakMap();

        // Canvas dimensions
        /** @type {number} Canvas width */
        this.canvasWidth = 0;
        /** @type {number} Canvas height */
        this.canvasHeight = 0;

        // Dirty flag for bulk operations
        /** @type {boolean} Whether there are dirty nodes */
        this.isDirty = false;
        /** @type {Set<HTMLElement>} Set of dirty nodes */
        this.dirtyNodes = new Set();

        // Statistics (for debugging/optimization)
        /** @type {object} Statistics object */
        this.stats = {
            queries: 0,
            hits: 0,
            rebuilds: 0
        };

        // Note: setupMutationObserver is called later when flowContentEl is available
        this.setupCanvasResizeObserver();
        this.setupNodeResizeObserver();
    }

    // =================== Initialization ===================

    /**
     * Sets up the resize observer for the canvas.
     */
    setupCanvasResizeObserver() {
        if (!this.canvas.canvasEl) return;

        this.canvasResizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                this.canvasWidth = width;
                this.canvasHeight = height;

                // rebuild grid on significant size changes
                this.scheduleRebuild();
            }
        });

        this.canvasResizeObserver.observe(this.canvas.canvasEl);
    }

    /**
     * Sets up the resize observer for nodes.
     */
    setupNodeResizeObserver() {
        // Observe all .flow-node elements for size changes
        this.nodeResizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const node = entry.target;

                // Invalidate cache and update grid position
                this.invalidateRect(node);

                // Debounce the grid update to avoid excessive updates during animation
                if (!node._resizeUpdateTimer) {
                    node._resizeUpdateTimer = setTimeout(() => {
                        this.updateNode(node);
                        delete node._resizeUpdateTimer;
                    }, 60);
                }
            }
        });
    }

    /**
     * Sets up the mutation observer for DOM changes.
     */
    setupMutationObserver() {
        if (!this.canvas.flowContentEl) return;

        // Watch for nodes being added/removed from DOM
        this.mutationObserver = new MutationObserver(mutations => {
            let needsUpdate = false;

            for (const mutation of mutations) {
                // Check added nodes
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && node.classList?.contains('flow-node')) {
                        this.addNode(node);
                        needsUpdate = true;
                    }
                }

                // Check removed nodes - cleanup happens automatically via isConnected check
                if (mutation.removedNodes.length > 0) {
                    needsUpdate = true;
                }
            }

            // Cleanup stale nodes if we had removals
            if (needsUpdate) {
                // Debounce cleanup for batch operations
                if (this.mutationCleanupTimer) {
                    clearTimeout(this.mutationCleanupTimer);
                }
                this.mutationCleanupTimer = setTimeout(() => {
                    this.cleanupStaleNodes();
                    // Update viewport virtualization after DOM changes
                    this.canvas.viewportVirtualization?.scheduleUpdate();
                }, 100);
            }
        });

        this.mutationObserver.observe(this.canvas.flowContentEl, {
            childList: true,
            subtree: true
        });
    }

    // =================== Grid Cell Management ===================

    /**
     * Get grid cell key from world coordinates
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     * @returns {string} The cell key.
     */
    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    /**
     * Get all cell keys that a bounding box overlaps
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     * @param {number} width - Width.
     * @param {number} height - Height.
     * @returns {Array<string>} List of cell keys.
     */
    getCellKeysForBounds(x, y, width, height) {
        const keys = [];

        const startX = Math.floor(x / this.cellSize);
        const startY = Math.floor(y / this.cellSize);
        const endX = Math.floor((x + width) / this.cellSize);
        const endY = Math.floor((y + height) / this.cellSize);

        for (let cellX = startX; cellX <= endX; cellX++) {
            for (let cellY = startY; cellY <= endY; cellY++) {
                keys.push(`${cellX},${cellY}`);
            }
        }

        return keys;
    }

    /**
     * Get or create a grid cell
     * @param {string} cellKey - The cell key.
     * @returns {Set<HTMLElement>} The set of nodes in the cell.
     */
    getCell(cellKey) {
        if (!this.grid.has(cellKey)) {
            this.grid.set(cellKey, new Set());
        }
        return this.grid.get(cellKey);
    }

    // =================== Node Management ===================

    /**
     * Add a node to the spatial grid
     * @param {HTMLElement} nodeElement - The node to add.
     */
    addNode(nodeElement) {
        if (!nodeElement) return;

        const rect = this.getNodeRect(nodeElement);
        const cellKeys = this.getCellKeysForBounds(rect.x, rect.y, rect.width, rect.height);

        // Remove from old cells if already in grid
        this.removeNode(nodeElement);

        // Add to new cells
        const cellSet = new Set();
        for (const key of cellKeys) {
            const cell = this.getCell(key);
            cell.add(nodeElement);
            cellSet.add(key);
        }

        // Store cell keys for this node
        this.nodeToCell.set(nodeElement, cellSet);

        // Start observing this node for resize events
        this.nodeResizeObserver.observe(nodeElement);
    }

    /**
     * Remove a node from the spatial grid
     * @param {HTMLElement} nodeElement - The node to remove.
     */
    removeNode(nodeElement) {
        const cellKeys = this.nodeToCell.get(nodeElement);
        if (!cellKeys) return;

        for (const key of cellKeys) {
            const cell = this.grid.get(key);
            if (cell) {
                cell.delete(nodeElement);
                // Clean up empty cells
                if (cell.size === 0) {
                    this.grid.delete(key);
                }
            }
        }

        this.nodeToCell.delete(nodeElement);
        this.rectCache.delete(nodeElement);

        // Stop observing this node
        this.nodeResizeObserver.unobserve(nodeElement);

        // Clean up any pending resize timer
        if (nodeElement._resizeUpdateTimer) {
            clearTimeout(nodeElement._resizeUpdateTimer);
            delete nodeElement._resizeUpdateTimer;
        }
    }

    /**
     * Update a node's position in the grid
     * @param {HTMLElement} nodeElement - The node to update.
     */
    updateNode(nodeElement) {
        // Simply re-add (which removes old position first)
        this.addNode(nodeElement);
    }

    /**
     * Mark a node as dirty for batch update
     * @param {HTMLElement} nodeElement - The node to mark dirty.
     */
    markDirty(nodeElement) {
        this.isDirty = true;
        this.dirtyNodes.add(nodeElement);
    }

    /**
     * Update all dirty nodes
     */
    updateDirtyNodes() {
        if (!this.isDirty) return;

        for (const node of this.dirtyNodes) {
            this.updateNode(node);
        }

        this.dirtyNodes.clear();
        this.isDirty = false;
    }

    // =================== Rect Caching ===================

    /**
     * Get cached or fresh bounding rect for a node
     * Caches screen-space dimensions and calculates world-space on demand
     * @param {HTMLElement} nodeElement - The node.
     * @returns {object} The bounding rect in world space.
     */
    getNodeRect(nodeElement) {
        let cached = this.rectCache.get(nodeElement);

        // Only recalculate if cache doesn't exist
        // Cache is invalidated on node move/resize, but NOT on zoom/pan
        if (!cached) {
            const bounds = nodeElement.getBoundingClientRect();
            
            cached = {
                worldX: nodeElement.dataX,
                worldY: nodeElement.dataY,
                screenWidth: bounds.width,
                screenHeight: bounds.height
            };
            
            this.rectCache.set(nodeElement, cached);
        }

        // Calculate world-space dimensions from cached screen-space
        // This is fast (just division) and always uses current zoom
        const worldWidth = cached.screenWidth / this.canvas.zoom;
        const worldHeight = cached.screenHeight / this.canvas.zoom;

        return {
            x: cached.worldX,
            y: cached.worldY,
            width: worldWidth,
            height: worldHeight,
            left: cached.worldX,
            top: cached.worldY,
            right: cached.worldX + worldWidth,
            bottom: cached.worldY + worldHeight
        };
    }

    /**
     * Invalidate rect cache for a node
     * @param {HTMLElement} nodeElement - The node.
     */
    invalidateRect(nodeElement) {
        this.rectCache.delete(nodeElement);
    }

    // =================== Spatial Queries ===================

    /**
     * Query nodes in a rectangular region
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     * @param {number} width - Width.
     * @param {number} height - Height.
     * @returns {Array<HTMLElement>} List of nodes.
     */
    queryRect(x, y, width, height) {
        this.stats.queries++;

        const cellKeys = this.getCellKeysForBounds(x, y, width, height);
        const candidates = new Set();

        // Gather all candidates from overlapping cells
        for (const key of cellKeys) {
            const cell = this.grid.get(key);
            if (cell) {
                for (const node of cell) {
                    candidates.add(node);
                }
            }
        }

        // Filter to only nodes that actually intersect the query rect
        const results = [];
        for (const node of candidates) {
            const nodeRect = this.getNodeRect(node);
            if (this.rectsIntersect(
                x, y, width, height,
                nodeRect.x, nodeRect.y, nodeRect.width, nodeRect.height
            )) {
                results.push(node);
                this.stats.hits++;
            }
        }

        return results;
    }

    /**
     * Query nodes in viewport
     * @returns {Array<HTMLElement>} List of nodes.
     */
    queryViewport() {
        const x = -this.canvas.offsetX;
        const y = -this.canvas.offsetY;
        const width = this.canvasWidth / this.canvas.zoom;
        const height = this.canvasHeight / this.canvas.zoom;

        return this.queryRect(x, y, width, height);
    }

    /**
     * Query nodes that intersect with a given node (for collision detection)
     * @param {HTMLElement} nodeElement - The node.
     * @returns {Array<HTMLElement>} List of intersecting nodes.
     */
    queryNodeIntersections(nodeElement) {
        const rect = this.getNodeRect(nodeElement);
        return this.queryRect(rect.x, rect.y, rect.width, rect.height)
            .filter(n => n !== nodeElement);
    }

    /**
     * Query nodes contained within a node (for group nodes)
     * @param {HTMLElement} nodeElement - The group node.
     * @returns {Array<HTMLElement>} List of contained nodes.
     */
    queryNodesInNode(nodeElement) {
        const rect = this.getNodeRect(nodeElement);
        const candidates = this.queryRect(rect.x, rect.y, rect.width, rect.height);

        const results = [];
        for (const candidate of candidates) {
            if (candidate === nodeElement) continue;
            if (candidate.getAttribute('kind') === 'Group') continue;

            const candidateRect = this.getNodeRect(candidate);

            // Check if candidate is fully contained
            if (this.rectContains(rect, candidateRect)) {
                results.push(candidate);
            }
        }

        return results;
    }

    /**
     * Get nearest node to a point
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     * @param {number} maxDistance - Maximum distance to search.
     * @returns {HTMLElement|null} The nearest node.
     */
    queryNearest(x, y, maxDistance = Infinity) {
        // Start with the cell containing the point
        const cellKey = this.getCellKey(x, y);
        let searchRadius = 1;
        let nearest = null;
        let nearestDist = maxDistance;

        // Expand search radius until we find something or exceed maxDistance
        while (searchRadius * this.cellSize < maxDistance) {
            const cellKeys = this.getCellsInRadius(x, y, searchRadius);

            for (const key of cellKeys) {
                const cell = this.grid.get(key);
                if (!cell) continue;

                for (const node of cell) {
                    const rect = this.getNodeRect(node);
                    const centerX = rect.x + rect.width / 2;
                    const centerY = rect.y + rect.height / 2;
                    const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearest = node;
                    }
                }
            }

            if (nearest) break;
            searchRadius++;
        }

        return nearest;
    }

    /**
     * Get all cell keys within a radius
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     * @param {number} radius - Radius in cells.
     * @returns {Array<string>} List of cell keys.
     */
    getCellsInRadius(x, y, radius) {
        const keys = [];
        const centerCellX = Math.floor(x / this.cellSize);
        const centerCellY = Math.floor(y / this.cellSize);

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                keys.push(`${centerCellX + dx},${centerCellY + dy}`);
            }
        }

        return keys;
    }

    // =================== Geometry Utilities ===================

    /**
     * Checks if two rectangles intersect.
     * @param {number} x1 - X of first rect.
     * @param {number} y1 - Y of first rect.
     * @param {number} w1 - Width of first rect.
     * @param {number} h1 - Height of first rect.
     * @param {number} x2 - X of second rect.
     * @param {number} y2 - Y of second rect.
     * @param {number} w2 - Width of second rect.
     * @param {number} h2 - Height of second rect.
     * @returns {boolean} True if they intersect.
     */
    rectsIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
        return !(
            x1 + w1 < x2 ||
            x2 + w2 < x1 ||
            y1 + h1 < y2 ||
            y2 + h2 < y1
        );
    }

    /**
     * Checks if one rectangle contains another.
     * @param {object} outer - Outer rectangle.
     * @param {object} inner - Inner rectangle.
     * @returns {boolean} True if outer contains inner.
     */
    rectContains(outer, inner) {
        return (
            inner.x >= outer.x &&
            inner.y >= outer.y &&
            inner.x + inner.width <= outer.x + outer.width &&
            inner.y + inner.height <= outer.y + outer.height
        );
    }

    // =================== Bulk Operations ===================

    /**
     * Rebuild entire grid from scratch
     * @param {NodeList|Array} nodes - Optional list of nodes to rebuild with.
     */
    rebuild(nodes) {
        this.clear();

        if (!nodes) {
            nodes = this.canvas.flowContentEl?.querySelectorAll('.flow-node');
        }

        if (nodes) {
            for (const node of nodes) {
                this.addNode(node);
            }
        }

        this.stats.rebuilds++;
    }

    /**
     * Schedule a rebuild
     */
    scheduleRebuild() {
        if (this.rebuildTimer) {
            clearTimeout(this.rebuildTimer);
        }

        this.rebuildTimer = setTimeout(() => {
            this.rebuild();
        }, 250); // Debounce by 250ms
    }

    /**
     * Clear the entire grid
     */
    clear() {
        // Clean up all nodes before clearing
        for (const node of this.getAllNodes()) {
            if (node._resizeUpdateTimer) {
                clearTimeout(node._resizeUpdateTimer);
                delete node._resizeUpdateTimer;
            }
        }

        this.grid.clear();
        this.nodeToCell = new WeakMap();
        this.rectCache = new WeakMap(); // Reset cache
        this.dirtyNodes.clear();
        this.isDirty = false;
    }

    /**
     * Clean up stale nodes (nodes no longer in DOM)
     * @returns {number} Number of stale nodes cleaned up.
     */
    cleanupStaleNodes() {
        const staleNodes = [];

        for (const cell of this.grid.values()) {
            for (const node of cell) {
                if (!node.isConnected) {
                    staleNodes.push(node);
                }
            }
        }

        if (staleNodes.length > 0) {
            for (const node of staleNodes) {
                this.removeNode(node);
            }
        }

        return staleNodes.length;
    }

    // =================== Debug & Stats ===================

    /**
     * Gets grid statistics.
     * @returns {object} Stats object.
     */
    getStats() {
        return {
            ...this.stats,
            cellCount: this.grid.size,
            nodeCount: this.getAllNodes().length,
            avgNodesPerCell: this.grid.size > 0
                ? this.getAllNodes().length / this.grid.size
                : 0
        };
    }

    /**
     * Gets all nodes in the grid.
     * @returns {Array<HTMLElement>} List of all nodes.
     */
    getAllNodes() {
        const nodes = new Set();
        const staleNodes = [];

        for (const cell of this.grid.values()) {
            for (const node of cell) {
                // Check if node is still in the DOM
                if (node.isConnected) {
                    nodes.add(node);
                } else {
                    // Track stale nodes for cleanup
                    staleNodes.push(node);
                }
            }
        }

        // Clean up stale nodes
        if (staleNodes.length > 0) {
            console.warn(`Found ${staleNodes.length} stale nodes in spatial grid, cleaning up...`);
            for (const node of staleNodes) {
                this.removeNode(node);
            }
        }

        return Array.from(nodes);
    }

    /**
     * Visualize grid cells (for debugging)
     */
    visualize() {
        if (!this.canvas.flowContentEl) return;

        // Remove old visualization
        const oldViz = this.canvas.flowContentEl.querySelector('.spatial-grid-viz');
        if (oldViz) oldViz.remove();

        const viz = document.createElement('div');
        viz.className = 'spatial-grid-viz';
        viz.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 10000;
        `;

        for (const [key, nodes] of this.grid.entries()) {
            const [cellX, cellY] = key.split(',').map(Number);
            const x = cellX * this.cellSize;
            const y = cellY * this.cellSize;

            const cell = document.createElement('div');
            cell.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: ${this.cellSize}px;
                height: ${this.cellSize}px;
                border: 1px solid rgba(0, 255, 0, 0.3);
                background: rgba(0, 255, 0, ${Math.min(0.1 + nodes.size * 0.05, 0.5)});
                font-size: 10px;
                color: white;
                padding: 2px;
            `;
            cell.textContent = nodes.size;
            viz.appendChild(cell);
        }

        this.canvas.flowContentEl.appendChild(viz);
    }

    // =================== Cleanup ===================

    /**
     * Disposes the spatial grid and its observers.
     */
    dispose() {
        if (this.canvasResizeObserver) {
            this.canvasResizeObserver.disconnect();
        }
        if (this.nodeResizeObserver) {
            this.nodeResizeObserver.disconnect();
        }
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        if (this.rebuildTimer) {
            clearTimeout(this.rebuildTimer);
        }
        if (this.mutationCleanupTimer) {
            clearTimeout(this.mutationCleanupTimer);
        }

        // Clean up any pending node resize timers
        for (const node of this.getAllNodes()) {
            if (node._resizeUpdateTimer) {
                clearTimeout(node._resizeUpdateTimer);
                delete node._resizeUpdateTimer;
            }
        }

        this.clear();
    }
}

