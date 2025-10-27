---
layout: default
title: FlowPanels
parent: Components
nav_order: 6
---

# FlowPanels

Overlay UI panels for canvas controls. Add custom buttons, zoom controls, or any UI elements that float above the canvas.

## Overview

`FlowPanels` provides a container for overlay UI elements. Place it inside the `<Panels>` section of `FlowCanvas` to add floating controls.

## Usage

```razor
<FlowCanvas Graph="graph" Height="100vh" Width="100vw">
    <BackgroundContent>
        <FlowBackground class="grid-bg"/>
    </BackgroundContent>
    <Panels>
        <FlowPanels>
            <!-- Your custom UI here -->
            <button @onclick="ZoomIn">Zoom In</button>
            <button @onclick="ZoomOut">Zoom Out</button>
        </FlowPanels>
    </Panels>
</FlowCanvas>
```

## Zoom Controls Example

A complete zoom control panel from the GraphViewportUnity example:

```razor
@using FlowState.Components
@using FlowState.Models

<FlowCanvas @ref="canvas" 
            Graph="graph" 
            Height="100vh" 
            Width="100vw">
    <BackgroundContent>
        <FlowBackground class="grid-bg"/>
    </BackgroundContent>
    <Panels>
        <FlowPanels>
            <div class="panel-group">
                <!-- Zoom controls -->
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
</FlowCanvas>

<style>
/* Panel Controls */
.panels {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1000;
    pointer-events: none;
}

.panel-group {
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
    justify-center;
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

.panel-btn svg {
    pointer-events: none;
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
    min-width: 40px;
}
</style>

@code {
    FlowCanvas? canvas;
    FlowGraph graph = new();
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
        
        await canvas.SetViewportPropertiesAsync(new FlowState.Models.Serializable.CanvasProperties 
        { 
            Zoom = 1.0, 
            OffsetX = 0, 
            OffsetY = 0,
            MinZoom = canvas.MinZoom,
            MaxZoom = canvas.MaxZoom
        });
        currentZoom = 1.0;
    }
}
```

## Custom Toolbar Example

Create a custom toolbar with various actions:

```razor
<Panels>
    <FlowPanels>
        <div class="custom-toolbar">
            <button @onclick="SaveGraph">💾 Save</button>
            <button @onclick="LoadGraph">📂 Load</button>
            <button @onclick="ExecuteGraph">▶️ Run</button>
            <button @onclick="ToggleReadOnly">🔒 Lock</button>
            <button @onclick="UndoAction">↶ Undo</button>
            <button @onclick="RedoAction">↷ Redo</button>
        </div>
    </FlowPanels>
</Panels>

<style>
.custom-toolbar {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    background: rgba(30, 30, 30, 0.95);
    padding: 8px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
}

.custom-toolbar button {
    padding: 8px 16px;
    background: rgba(60, 60, 60, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.custom-toolbar button:hover {
    background: rgba(80, 80, 80, 0.9);
    transform: translateY(-1px);
}
</style>
```

## Minimap Example

Create a minimap panel:

```razor
<Panels>
    <FlowPanels>
        <div class="minimap-panel">
            <div class="minimap-title">Minimap</div>
            <div class="minimap-content">
                <!-- Simplified view of your graph -->
                <div class="minimap-viewport"></div>
            </div>
        </div>
    </FlowPanels>
</Panels>

<style>
.minimap-panel {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 200px;
    height: 150px;
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    overflow: hidden;
    pointer-events: auto;
}

.minimap-title {
    padding: 8px;
    font-size: 12px;
    font-weight: 600;
    color: white;
    background: rgba(20, 20, 20, 0.8);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.minimap-content {
    position: relative;
    width: 100%;
    height: calc(100% - 32px);
}

.minimap-viewport {
    position: absolute;
    border: 2px solid #7c3aed;
    background: rgba(124, 58, 237, 0.1);
}
</style>
```

## Status Bar Example

Add a status bar at the bottom:

```razor
<Panels>
    <FlowPanels>
        <div class="status-bar">
            <div class="status-item">Nodes: @graph.Nodes.Count</div>
            <div class="status-item">Edges: @graph.Edges.Count</div>
            <div class="status-item">Zoom: @($"{currentZoom:P0}")</div>
            <div class="status-item">@(isReadOnly ? "🔒 Read-Only" : "✏️ Editing")</div>
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
}

.status-item {
    padding: 4px 8px;
    background: rgba(60, 60, 60, 0.5);
    border-radius: 4px;
}
</style>
```

## Positioning

Panels can be positioned anywhere on the canvas using CSS:

```css
/* Top Right (default for zoom controls) */
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
```

## Important CSS Properties

{: .warning }
> Always set `pointer-events: auto` on your panel content so buttons are clickable. The panel container has `pointer-events: none` by default to allow canvas interaction.

```css
.my-panel {
    pointer-events: auto; /* Make clickable */
    z-index: 1000; /* Above canvas content */
}
```

## Complete Multi-Panel Example

Combine multiple panels:

```razor
<Panels>
    <FlowPanels>
        <!-- Zoom Controls (Top Right) -->
        <div class="zoom-panel">
            <button @onclick="ZoomIn">+</button>
            <button @onclick="ZoomOut">-</button>
            <div class="zoom-display">@($"{currentZoom:P0}")</div>
        </div>
        
        <!-- Toolbar (Top Center) -->
        <div class="toolbar">
            <button @onclick="SaveGraph">Save</button>
            <button @onclick="LoadGraph">Load</button>
            <button @onclick="ExecuteGraph">Run</button>
        </div>
        
        <!-- Status (Bottom) -->
        <div class="status">
            Nodes: @graph.Nodes.Count | Edges: @graph.Edges.Count
        </div>
    </FlowPanels>
</Panels>
```

## See Also

- [FlowCanvas](./flow-canvas.html) - Main canvas component
- [Custom Panels](../customization/custom-panels.html) - Advanced panel customization
- [Getting Started](../getting-started.html) - Complete examples with panels

