---
layout: default
title: Custom Panels
parent: Customization
parent: Customization
nav_order: 3
---

# Custom Panels

Create overlay UI controls like toolbars, minimaps, status bars, and custom widgets that float above the canvas.

## Overview

Panels are overlay UI elements placed inside the `<Panels>` section of `FlowCanvas`. They provide controls and information without interfering with the graph content.

## Basic Panel Structure

```razor
<FlowCanvas Graph="graph" Height="100vh" Width="100vw">
    <BackgroundContent>
        <FlowBackground class="grid-bg"/>
    </BackgroundContent>
    <Panels>
        <FlowPanels>
            <!-- Your custom UI here -->
            <div class="my-panel">
                <button @onclick="DoSomething">Action</button>
            </div>
        </FlowPanels>
    </Panels>
</FlowCanvas>
```

## Zoom Control Panel

A complete zoom control panel from GraphViewportUnity:

```razor
<Panels>
    <FlowPanels>
        <div class="panel-group">
            <button class="panel-btn" title="Zoom In" @onclick="ZoomIn">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
            <button class="panel-btn" title="Zoom Out" @onclick="ZoomOut">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
            <button class="panel-btn" title="Reset View" @onclick="ResetView">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14 8C14 8 12 4 8 4C4 4 2 8 2 8M8 4V1M8 4L5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <div class="zoom-level">@($"{currentZoom:P0}")</div>
        </div>
    </FlowPanels>
</Panels>

<style>
.panel-group {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    pointer-events: auto;
    z-index: 1000;
}

.panel-btn {
    width: 40px;
    height: 40px;
    background: rgba(60, 60, 60, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #ffffff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    padding: 0;
}

.panel-btn:hover {
    background: rgba(80, 80, 80, 0.9);
    border-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
}

.panel-btn:active {
    transform: scale(0.95);
}

.zoom-level {
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: #ffffff;
    padding: 8px 4px;
    background: rgba(40, 40, 40, 0.8);
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}
</style>

@code {
    FlowCanvas? canvas;
    double currentZoom = 1.0;

    async Task ZoomIn()
    {
        if (canvas == null) return;
        var props = await canvas.GetViewportPropertiesAsync();
        var newZoom = Math.Min(props.MaxZoom, props.Zoom + 0.1);
        await canvas.SetZoomAsync(newZoom);
        currentZoom = newZoom;
    }
    
    async Task ZoomOut()
    {
        if (canvas == null) return;
        var props = await canvas.GetViewportPropertiesAsync();
        var newZoom = Math.Max(props.MinZoom, props.Zoom - 0.1);
        await canvas.SetZoomAsync(newZoom);
        currentZoom = newZoom;
    }
    
    async Task ResetView()
    {
        if (canvas == null) return;
        await canvas.SetViewportPropertiesAsync(new CanvasProperties 
        { 
            Zoom = 1.0, 
            OffsetX = 0, 
            OffsetY = 0,
            MinZoom = 0.2,
            MaxZoom = 2.0
        });
        currentZoom = 1.0;
    }
}
```

## Toolbar Panel

Horizontal toolbar at the top:

```razor
<Panels>
    <FlowPanels>
        <div class="toolbar">
            <button class="toolbar-btn" @onclick="SaveGraph">
                💾 Save
            </button>
            <button class="toolbar-btn" @onclick="LoadGraph">
                📂 Load
            </button>
            <div class="toolbar-separator"></div>
            <button class="toolbar-btn" @onclick="ExecuteGraph">
                ▶️ Run
            </button>
            <button class="toolbar-btn" @onclick="StopGraph">
                ⏹️ Stop
            </button>
            <div class="toolbar-separator"></div>
            <button class="toolbar-btn" @onclick="UndoAction">
                ↶ Undo
            </button>
            <button class="toolbar-btn" @onclick="RedoAction">
                ↷ Redo
            </button>
        </div>
    </FlowPanels>
</Panels>

<style>
.toolbar {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(30, 30, 30, 0.95);
    padding: 8px 12px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
    z-index: 1000;
}

.toolbar-btn {
    padding: 8px 16px;
    background: rgba(60, 60, 60, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
}

.toolbar-btn:hover {
    background: rgba(80, 80, 80, 0.9);
    transform: translateY(-1px);
}

.toolbar-separator {
    width: 1px;
    height: 24px;
    background: rgba(255, 255, 255, 0.1);
}
</style>
```

## Status Bar Panel

Bottom status bar with graph information:

```razor
<Panels>
    <FlowPanels>
        <div class="status-bar">
            <div class="status-item">
                <span class="status-label">Nodes:</span>
                <span class="status-value">@graph.Nodes.Count</span>
            </div>
            <div class="status-item">
                <span class="status-label">Edges:</span>
                <span class="status-value">@graph.Edges.Count</span>
            </div>
            <div class="status-item">
                <span class="status-label">Zoom:</span>
                <span class="status-value">@($"{currentZoom:P0}")</span>
            </div>
            <div class="status-item">
                <span class="status-value">@(isReadOnly ? "🔒 Read-Only" : "✏️ Editing")</span>
            </div>
        </div>
    </FlowPanels>
</Panels>

<style>
.status-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    gap: 16px;
    padding: 8px 16px;
    background: rgba(20, 20, 20, 0.95);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 12px;
    color: #cbd5e1;
    pointer-events: auto;
    z-index: 1000;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    background: rgba(60, 60, 60, 0.5);
    border-radius: 4px;
}

.status-label {
    color: rgba(255, 255, 255, 0.6);
}

.status-value {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
}
</style>
```

## Minimap Panel

Minimap showing graph overview:

```razor
<Panels>
    <FlowPanels>
        <div class="minimap">
            <div class="minimap-header">
                <span>Minimap</span>
                <button class="minimap-close" @onclick="ToggleMinimap">×</button>
            </div>
            <div class="minimap-content">
                <canvas @ref="minimapCanvas" width="180" height="120"></canvas>
                <div class="minimap-viewport" style="@GetViewportStyle()"></div>
            </div>
        </div>
    </FlowPanels>
</Panels>

<style>
.minimap {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 200px;
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    overflow: hidden;
    pointer-events: auto;
    z-index: 1000;
}

.minimap-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 600;
    color: white;
    background: rgba(20, 20, 20, 0.8);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.minimap-close {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    line-height: 1;
}

.minimap-close:hover {
    color: white;
}

.minimap-content {
    position: relative;
    width: 100%;
    height: 140px;
    background: rgba(0, 0, 0, 0.3);
}

.minimap-viewport {
    position: absolute;
    border: 2px solid #7c3aed;
    background: rgba(124, 58, 237, 0.1);
    pointer-events: none;
}
</style>
```

## Properties Panel

Sidebar with node properties:

```razor
<Panels>
    <FlowPanels>
        <div class="properties-panel">
            <div class="properties-header">
                Properties
            </div>
            <div class="properties-content">
                @if (selectedNode != null)
                {
                    <div class="property-group">
                        <label class="property-label">Node Type:</label>
                        <div class="property-value">@selectedNode.GetType().Name</div>
                    </div>
                    <div class="property-group">
                        <label class="property-label">Position:</label>
                        <div class="property-value">(@selectedNode.X, @selectedNode.Y)</div>
                    </div>
                    <div class="property-group">
                        <label class="property-label">Sockets:</label>
                        <div class="property-value">@selectedNode.Sockets.Count</div>
                    </div>
                }
                else
                {
                    <div class="property-empty">
                        No node selected
                    </div>
                }
            </div>
        </div>
    </FlowPanels>
</Panels>

<style>
.properties-panel {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 250px;
    max-height: calc(100vh - 40px);
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    overflow: hidden;
    pointer-events: auto;
    z-index: 1000;
}

.properties-header {
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    color: white;
    background: rgba(20, 20, 20, 0.8);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.properties-content {
    padding: 16px;
    max-height: calc(100vh - 100px);
    overflow-y: auto;
}

.property-group {
    margin-bottom: 12px;
}

.property-label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 4px;
    text-transform: uppercase;
}

.property-value {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.9);
    padding: 6px 8px;
    background: rgba(60, 60, 60, 0.5);
    border-radius: 4px;
}

.property-empty {
    text-align: center;
    padding: 24px;
    color: rgba(255, 255, 255, 0.4);
    font-size: 13px;
}
</style>
```

## Important CSS Rules

{: .warning }
> Always set `pointer-events: auto` on panel content and `z-index: 1000` or higher to ensure panels are clickable and appear above canvas content.

```css
.my-panel {
    pointer-events: auto;  /* Critical: makes buttons clickable */
    z-index: 1000;         /* Above canvas content */
}
```

## Panel Positioning

Position panels anywhere on the canvas:

```css
/* Top Right */
.panel-top-right {
    position: absolute;
    top: 20px;
    right: 20px;
}

/* Top Left */
.panel-top-left {
    position: absolute;
    top: 20px;
    left: 20px;
}

/* Bottom Right */
.panel-bottom-right {
    position: absolute;
    bottom: 20px;
    right: 20px;
}

/* Bottom Left */
.panel-bottom-left {
    position: absolute;
    bottom: 20px;
    left: 20px;
}

/* Centered Top */
.panel-centered-top {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
}

/* Centered */
.panel-centered {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
```

## Multi-Panel Layout

Combine multiple panels:

```razor
<Panels>
    <FlowPanels>
        <!-- Top Toolbar -->
        <div class="toolbar-top">...</div>
        
        <!-- Right Side Zoom Controls -->
        <div class="zoom-controls-right">...</div>
        
        <!-- Bottom Status Bar -->
        <div class="status-bottom">...</div>
        
        <!-- Left Properties Panel -->
        <div class="properties-left">...</div>
    </FlowPanels>
</Panels>
```

## See Also

- [FlowPanels](../components/flow-panels.html) - Panels component reference
- [FlowCanvas](../components/flow-canvas.html) - Canvas component
- [Getting Started](../getting-started.html) - Complete examples

