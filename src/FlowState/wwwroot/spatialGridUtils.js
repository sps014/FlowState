/**
 * Utility functions and helpers for the Spatial Grid system
 */

/**
 * Debug visualization overlay for spatial grid
 * Call this from browser console: window.visualizeSpatialGrid()
 * @param {FlowCanvas} canvas - The main canvas instance.
 */
export function createVisualizationOverlay(canvas) {
    canvas.spatialGrid.visualize();
    console.log('Spatial grid stats:', canvas.spatialGrid.getStats());
}

/**
 * Performance comparison: Linear search vs Spatial grid
 * @param {FlowCanvas} canvas - The main canvas instance.
 * @param {number} [iterations=1000] - Number of iterations for the benchmark.
 * @returns {object|undefined} Benchmark results.
 */
export function benchmarkSpatialGrid(canvas, iterations = 1000) {
    const grid = canvas.spatialGrid;
    const allNodes = grid.getAllNodes();

    if (allNodes.length === 0) {
        console.error('No nodes in spatial grid');
        return;
    }

    // Test viewport query
    console.log(`\n=== Benchmark: Viewport Query (${iterations} iterations) ===`);

    // Linear search (fallback)
    const linearStart = performance.now();
    for (let i = 0; i < iterations; i++) {
        const nodes = canvas.flowContentEl.querySelectorAll('.flow-node');
        let count = 0;
        for (const node of nodes) {
            count++;
        }
    }
    const linearTime = performance.now() - linearStart;

    // Spatial grid query
    const gridStart = performance.now();
    for (let i = 0; i < iterations; i++) {
        const nodes = grid.queryViewport();
    }
    const gridTime = performance.now() - gridStart;

    console.log(`Linear search: ${linearTime.toFixed(2)}ms (${(linearTime / iterations).toFixed(3)}ms per query)`);
    console.log(`Spatial grid:  ${gridTime.toFixed(2)}ms (${(gridTime / iterations).toFixed(3)}ms per query)`);
    console.log(`Speedup:       ${(linearTime / gridTime).toFixed(2)}x faster`);

    // Test rectangle selection
    console.log(`\n=== Benchmark: Rectangle Selection (${iterations} iterations) ===`);

    const testRect = {
        x: -100,
        y: -100,
        width: 500,
        height: 500
    };

    // Linear search
    const linearRectStart = performance.now();
    for (let i = 0; i < iterations; i++) {
        const nodes = canvas.flowContentEl.querySelectorAll('.flow-node');
        const results = [];
        for (const node of nodes) {
            const rect = grid.getNodeRect(node);
            if (grid.rectsIntersect(
                testRect.x, testRect.y, testRect.width, testRect.height,
                rect.x, rect.y, rect.width, rect.height
            )) {
                results.push(node);
            }
        }
    }
    const linearRectTime = performance.now() - linearRectStart;

    // Spatial grid query
    const gridRectStart = performance.now();
    for (let i = 0; i < iterations; i++) {
        const results = grid.queryRect(testRect.x, testRect.y, testRect.width, testRect.height);
    }
    const gridRectTime = performance.now() - gridRectStart;

    console.log(`Linear search: ${linearRectTime.toFixed(2)}ms (${(linearRectTime / iterations).toFixed(3)}ms per query)`);
    console.log(`Spatial grid:  ${gridRectTime.toFixed(2)}ms (${(gridRectTime / iterations).toFixed(3)}ms per query)`);
    console.log(`Speedup:       ${(linearRectTime / gridRectTime).toFixed(2)}x faster`);

    // Display stats
    console.log('\n=== Spatial Grid Statistics ===');
    console.log(grid.getStats());

    return {
        viewport: {
            linear: linearTime,
            grid: gridTime,
            speedup: linearTime / gridTime
        },
        rectangle: {
            linear: linearRectTime,
            grid: gridRectTime,
            speedup: linearRectTime / gridRectTime
        },
        stats: grid.getStats()
    };
}

/**
 * Memory usage analysis
 * @param {FlowCanvas} canvas - The main canvas instance.
 * @returns {object} Memory usage analysis results.
 */
export function analyzeSpatialGridMemory(canvas) {
    const grid = canvas.spatialGrid;
    const stats = grid.getStats();

    // Rough memory estimates
    const bytesPerGridCell = 50; // Set object + overhead
    const bytesPerNodeEntry = 100; // WeakMap entry + rect cache
    const bytesPerCellKey = 20; // String key

    const estimatedMemory =
        (stats.cellCount * bytesPerGridCell) +
        (stats.nodeCount * bytesPerNodeEntry) +
        (stats.cellCount * bytesPerCellKey);

    console.log('\n=== Memory Usage Estimate ===');
    console.log(`Grid cells: ${stats.cellCount}`);
    console.log(`Nodes: ${stats.nodeCount}`);
    console.log(`Estimated memory: ${(estimatedMemory / 1024).toFixed(2)} KB`);
    console.log(`Per node: ${(estimatedMemory / stats.nodeCount).toFixed(2)} bytes`);

    return {
        cellCount: stats.cellCount,
        nodeCount: stats.nodeCount,
        estimatedBytes: estimatedMemory,
        estimatedKB: estimatedMemory / 1024
    };
}

/**
 * Print spatial grid structure and contents
 * @param {FlowCanvas} canvas - The main canvas instance.
 */
export function printSpatialGrid(canvas) {
    const grid = canvas.spatialGrid;

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║           SPATIAL GRID STRUCTURE                      ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Basic Info
    console.log('📊 Grid Configuration:');
    console.log(`   Cell Size: ${grid.cellSize}px`);
    console.log(`   Canvas Size: ${grid.canvasWidth}px × ${grid.canvasHeight}px`);
    console.log(`   Cache Timeout: ${grid.cacheTimeout}ms`);

    // Statistics
    const stats = grid.getStats();
    console.log('\n📈 Statistics:');
    console.log(`   Total Cells: ${stats.cellCount}`);
    console.log(`   Total Nodes: ${stats.nodeCount}`);
    console.log(`   Avg Nodes/Cell: ${stats.avgNodesPerCell.toFixed(2)}`);
    console.log(`   Total Queries: ${stats.queries}`);
    console.log(`   Cache Hits: ${stats.hits}`);
    console.log(`   Rebuilds: ${stats.rebuilds}`);

    // Cell breakdown
    console.log('\n🗂️  Cell Breakdown:');

    const cellsByNodeCount = new Map();
    for (const [key, nodes] of grid.grid.entries()) {
        const count = nodes.size;
        if (!cellsByNodeCount.has(count)) {
            cellsByNodeCount.set(count, []);
        }
        cellsByNodeCount.get(count).push(key);
    }

    const sortedCounts = Array.from(cellsByNodeCount.keys()).sort((a, b) => b - a);
    for (const count of sortedCounts) {
        const cells = cellsByNodeCount.get(count);
        console.log(`   ${count} node${count !== 1 ? 's' : ' '}: ${cells.length} cell${cells.length !== 1 ? 's' : ''}`);
    }

    // Detailed cell listing
    console.log('\n📍 Cell Details:');

    const sortedCells = Array.from(grid.grid.entries())
        .sort((a, b) => b[1].size - a[1].size)
        .slice(0, 10); // Top 10 cells

    console.log('   (Top 10 cells by node count)\n');

    for (const [key, nodes] of sortedCells) {
        const [cellX, cellY] = key.split(',').map(Number);
        const worldX = cellX * grid.cellSize;
        const worldY = cellY * grid.cellSize;

        console.log(`   Cell [${cellX}, ${cellY}] @ (${worldX}, ${worldY}):`);
        console.log(`   ├─ Nodes: ${nodes.size}`);

        const nodesList = Array.from(nodes).slice(0, 3);
        for (let i = 0; i < nodesList.length; i++) {
            const node = nodesList[i];
            const isLast = i === nodesList.length - 1 && nodes.size <= 3;
            const prefix = isLast ? '   └─' : '   ├─';
            const id = node.id || 'unknown';
            const kind = node.getAttribute('kind') || 'Regular';
            console.log(`${prefix} ${id} (${kind})`);
        }

        if (nodes.size > 3) {
            console.log(`   └─ ... and ${nodes.size - 3} more`);
        }
        console.log('');

        console.log(grid.rectCache);
    }

    // Node distribution heatmap (ASCII)
    console.log('\n🔥 Distribution Heatmap:');
    console.log('   (showing relative node density)\n');

    if (stats.cellCount > 0) {
        // Find bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const key of grid.grid.keys()) {
            const [x, y] = key.split(',').map(Number);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }

        const width = maxX - minX + 1;
        const height = maxY - minY + 1;

        // Limit heatmap size for readability
        if (width <= 40 && height <= 20) {
            const maxNodesInCell = Math.max(...Array.from(grid.grid.values()).map(n => n.size));

            for (let y = minY; y <= maxY; y++) {
                let row = '   ';
                for (let x = minX; x <= maxX; x++) {
                    const key = `${x},${y}`;
                    const cell = grid.grid.get(key);

                    if (!cell || cell.size === 0) {
                        row += '·';
                    } else {
                        const density = cell.size / maxNodesInCell;
                        if (density >= 0.8) row += '█';
                        else if (density >= 0.6) row += '▓';
                        else if (density >= 0.4) row += '▒';
                        else if (density >= 0.2) row += '░';
                        else row += '▪';
                    }
                }
                console.log(row);
            }

            console.log('\n   Legend: · empty  ▪ low  ░▒▓█ increasing density');
        } else {
            console.log(`   Grid too large to display (${width}×${height})`);
            console.log(`   Use grid.visualize() for visual overlay`);
        }
    }

    console.log('\n' + '─'.repeat(56) + '\n');
}

/**
 * Test spatial grid correctness
 * @param {FlowCanvas} canvas - The main canvas instance.
 */
export function testSpatialGridCorrectness(canvas) {
    const grid = canvas.spatialGrid;
    console.log('\n=== Spatial Grid Correctness Tests ===');

    // Test 1: All nodes are in the grid
    const allDomNodes = Array.from(canvas.flowContentEl.querySelectorAll('.flow-node'));
    const allGridNodes = grid.getAllNodes();

    console.log(`Test 1: All nodes indexed`);
    console.log(`  DOM nodes: ${allDomNodes.length}`);
    console.log(`  Grid nodes: ${allGridNodes.length}`);
    console.log(`  Result: ${allDomNodes.length === allGridNodes.length ? '✓ PASS' : '✗ FAIL'}`);

    // Test 2: Viewport query returns reasonable results
    const viewportNodes = grid.queryViewport();
    console.log(`\nTest 2: Viewport query`);
    console.log(`  Nodes in viewport: ${viewportNodes.length}`);
    console.log(`  Total nodes: ${allGridNodes.length}`);
    console.log(`  Result: ${viewportNodes.length > 0 && viewportNodes.length <= allGridNodes.length ? '✓ PASS' : '✗ FAIL'}`);

    // Test 3: Rect queries are consistent
    const testRect = { x: 0, y: 0, width: 1000, height: 1000 };
    const rectResults1 = grid.queryRect(testRect.x, testRect.y, testRect.width, testRect.height);
    const rectResults2 = grid.queryRect(testRect.x, testRect.y, testRect.width, testRect.height);

    console.log(`\nTest 3: Query consistency`);
    console.log(`  Query 1 results: ${rectResults1.length}`);
    console.log(`  Query 2 results: ${rectResults2.length}`);
    console.log(`  Result: ${rectResults1.length === rectResults2.length ? '✓ PASS' : '✗ FAIL'}`);

    // Test 4: Cache is working
    const testNode = allGridNodes[0];
    if (testNode) {
        const rect1 = grid.getNodeRect(testNode);
        const rect2 = grid.getNodeRect(testNode);
        const cached = grid.rectCache.get(testNode);

        console.log(`\nTest 4: Rect caching`);
        console.log(`  Cache hit: ${cached !== undefined ? 'Yes' : 'No'}`);
        console.log(`  Result: ${cached !== undefined ? '✓ PASS' : '✗ FAIL'}`);
    }

    console.log('\n=== Tests Complete ===\n');
}

/**
 * Export global utilities for browser console debugging
 * @param {FlowCanvas} canvas - The main canvas instance.
 */
export function setupGlobalDebugging(canvas) {
    if (typeof window !== 'undefined') {
        window.spatialGridDebug = {
            visualize: () => createVisualizationOverlay(canvas),
            benchmark: (iterations) => benchmarkSpatialGrid(canvas, iterations),
            analyze: () => analyzeSpatialGridMemory(canvas),
            test: () => testSpatialGridCorrectness(canvas),
            print: () => printSpatialGrid(canvas),
            stats: () => canvas.spatialGrid?.getStats(),
            rebuild: () => canvas.spatialGrid?.rebuild(),
            clear: () => canvas.spatialGrid?.clear(),
            cleanup: () => canvas.spatialGrid?.cleanupStaleNodes()
        };

        // console.log('%c Spatial Grid Debug Tools! ', 'background: #4CAF50; color: white; font-size: 14px; padding: 5px;');
        // console.log('Use window.spatialGridDebug for debugging:');
        // console.log('  • .visualize()      - Show grid visualization');
        // console.log('  • .benchmark()      - Run performance tests');
        // console.log('  • .analyze()        - Memory analysis');
        // console.log('  • .test()           - Correctness tests');
        // console.log('  • .print()          - Print grid structure');
        // console.log('  • .stats()          - Get statistics');
        // console.log('  • .rebuild()        - Rebuild grid');
        // console.log('  • .cleanup()        - Remove stale nodes');
        // console.log('  • .clear()          - Clear grid');
    }
}

