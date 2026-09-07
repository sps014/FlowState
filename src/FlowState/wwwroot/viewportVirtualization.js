/**
 * Viewport Virtualization for efficient rendering of large graphs
 * Only renders nodes that are visible in the current viewport
 */
export class ViewportVirtualization {
    /**
     * @param {FlowCanvas} canvas - The main canvas instance.
     */
    constructor(canvas) {
        /** @type {FlowCanvas} */
        this.canvas = canvas;

        /** @type {boolean} Whether virtualization is enabled */
        this.enabled = true;

        /** @type {number} Padding around viewport (in world units) */
        this.viewportPadding = 200;

        /** @type {Set<HTMLElement>} Set of currently visible nodes */
        this.visibleNodes = new Set();

        /** @type {Set<HTMLElement>} Set of currently hidden nodes */
        this.hiddenNodes = new Set();

        /** @type {Set<SVGPathElement>} Set of currently hidden edges */
        this.hiddenEdges = new Set();

        /** @type {number|null} Timer for debounced updates */
        this.updateTimer = null;

        /** @type {boolean} Whether an update is scheduled */
        this.updateScheduled = false;

        // Statistics
        /** @type {object} Statistics object */
        this.stats = {
            totalNodes: 0,
            visibleNodes: 0,
            hiddenNodes: 0,
            totalEdges: 0,
            hiddenEdges: 0,
            lastUpdateTime: 0,
            changesCount: 0,
            edgeChangesCount: 0
        };
    }

    /**
     * Enable viewport virtualization
     */
    enable() {
        this.enabled = true;
        this.scheduleUpdate();
    }

    /**
     * Disable viewport virtualization (show all nodes and edges)
     */
        disable() {
        this.enabled = false;
        // Show all hidden nodes
        for (const node of this.hiddenNodes) {
            this._showNode(node);
        }
        // Show all hidden edges
        for (const edge of this.hiddenEdges) {
            this._showEdge(edge);
        }
        this.hiddenNodes.clear();
        this.visibleNodes.clear();
        this.hiddenEdges.clear();
    }

    /**
     * Schedule a viewport update 
     */
    scheduleUpdate() {
        if (!this.enabled) return;

        if (!this.updateScheduled) {
            this.updateScheduled = true;
            requestAnimationFrame(() => {
                this.update();
                this.updateScheduled = false;
            });
        }
    }

    /**
     * Update which nodes and edges are visible based on current viewport
     */
    update() {
        if (!this.enabled) return;

        const startTime = performance.now();

        // Calculate viewport bounds in world space
        const canvasWidth = this.canvas.spatialGrid.canvasWidth || this.canvas.canvasEl.clientWidth;
        const canvasHeight = this.canvas.spatialGrid.canvasHeight || this.canvas.canvasEl.clientHeight;

        // Convert to world space
        const viewportX = -this.canvas.offsetX / this.canvas.zoom;
        const viewportY = -this.canvas.offsetY / this.canvas.zoom;
        const viewportWidth = canvasWidth / this.canvas.zoom;
        const viewportHeight = canvasHeight / this.canvas.zoom;

        // Add padding
        const queryX = viewportX - this.viewportPadding;
        const queryY = viewportY - this.viewportPadding;
        const queryWidth = viewportWidth + (this.viewportPadding * 2);
        const queryHeight = viewportHeight + (this.viewportPadding * 2);

        // Query visible nodes from spatial grid
        const nowVisible = new Set(
            this.canvas.spatialGrid.queryRect(queryX, queryY, queryWidth, queryHeight)
        );

        let changesCount = 0;
        let edgeChangesCount = 0;

        // Track edges that need to be checked
        const edgesToCheck = new Set();

        // ONLY hide nodes that WERE visible but are NOW out of view
        for (const node of this.visibleNodes) {
            if (!nowVisible.has(node)) {
                this._hideNode(node);
                this.hiddenNodes.add(node);
                changesCount++;

                // Mark edges connected to this node for checking
                const edges = this.canvas.edgeController.nodeEdgeMap.get(node);
                if (edges) {
                    for (const edge of edges) {
                        edgesToCheck.add(edge);
                    }
                }
            }
        }

        // ONLY show nodes that WERE hidden but are NOW in view
        for (const node of nowVisible) {
            if (!this.visibleNodes.has(node)) {
                // Node is now visible but wasn't before
                if (node.style.visibility === 'hidden' || node.style.contentVisibility === 'hidden') {
                    this._showNode(node);
                    changesCount++;
                }
                this.hiddenNodes.delete(node);

                // Mark edges connected to this node for checking
                const edges = this.canvas.edgeController.nodeEdgeMap.get(node);
                if (edges) {
                    for (const edge of edges) {
                        edgesToCheck.add(edge);
                    }
                }
            }
        }

        // Update visible nodes set
        this.visibleNodes = nowVisible;

        // Optimize edges: hide edges where BOTH endpoints are hidden
        for (const edge of edgesToCheck) {
            const sockets = this.canvas.edgeController.edgeSocketsMap.get(edge);
            if (!sockets) continue;

            const fromNode = sockets.from?.closest('.flow-node');
            const toNode = sockets.to?.closest('.flow-node');

            if (!fromNode || !toNode) continue;

            const fromHidden = !this.visibleNodes.has(fromNode);
            const toHidden = !this.visibleNodes.has(toNode);

            // Hide edge if BOTH nodes are hidden
            if (fromHidden && toHidden) {
                if (edge.style.visibility !== 'hidden') {
                    this._hideEdge(edge);
                    this.hiddenEdges.add(edge);
                    edgeChangesCount++;
                }
            } else {
                if (edge.style.visibility === 'hidden') {
                    this._showEdge(edge);
                    this.hiddenEdges.delete(edge);
                    edgeChangesCount++;
                }
            }
        }

        // Update statistics
        this.stats.totalNodes = this.canvas.spatialGrid.getAllNodes().length;
        this.stats.visibleNodes = this.visibleNodes.size;
        this.stats.hiddenNodes = this.stats.totalNodes - this.stats.visibleNodes;
        this.stats.totalEdges = this.canvas.edgeController.nodeEdgeMap.size;
        this.stats.hiddenEdges = this.hiddenEdges.size;
        this.stats.lastUpdateTime = performance.now() - startTime;
        this.stats.changesCount = changesCount;
        this.stats.edgeChangesCount = edgeChangesCount;
    }

    _hideNode(node) {
        node.style.visibility = 'hidden';
        node.style.contentVisibility = 'hidden';
        node.style.pointerEvents = 'none';
    }

    _showNode(node) {
        node.style.visibility = '';
        node.style.contentVisibility = '';
        node.style.pointerEvents = '';
    }

    _hideEdge(edge) {
        edge.style.visibility = 'hidden';
        edge.style.contentVisibility = 'hidden';
    }

    _showEdge(edge) {
        edge.style.visibility = '';
        edge.style.contentVisibility = '';
    }

    getStats() {
        return {
            ...this.stats,
            enabled: this.enabled,
            viewportPadding: this.viewportPadding
        };
    }

    /**
     * Set viewport padding
     * @param {number} padding - Padding in world units
     */
    setPadding(padding) {
        this.viewportPadding = padding;
        this.scheduleUpdate();
    }

    /**
     * Print statistics to console
     */
    printStats() {
        const stats = this.getStats();
        console.log('=== Viewport Virtualization Stats ===');
        console.log(`  Enabled: ${stats.enabled}`);
        console.log('');
        console.log('  Nodes:');
        console.log(`     Total: ${stats.totalNodes}`);
        console.log(`     Visible: ${stats.visibleNodes}`);
        console.log(`     Hidden: ${stats.hiddenNodes}`);
        console.log(`     Last Changes: ${stats.changesCount}`);
        console.log('');
        console.log('  Edges:');
        console.log(`     Total: ${stats.totalEdges}`);
        console.log(`     Hidden: ${stats.hiddenEdges}`);
        console.log(`     Last Changes: ${stats.edgeChangesCount}`);
        console.log('');
        console.log(`   Viewport Padding: ${stats.viewportPadding}px`);
        console.log(`   Last Update: ${stats.lastUpdateTime.toFixed(2)}ms`);
        console.log('=====================================');
    }

    /**
     * Dispose the viewport virtualization
     */
    dispose() {
        this.disable();
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }
        this.hiddenEdges.clear();
    }
}

