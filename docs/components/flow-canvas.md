---
layout: default
title: FlowCanvas
parent: Components
nav_order: 1
---

# FlowCanvas

The main canvas component for rendering and managing flow graphs. This is the primary container for your node editor.

## Overview

`FlowCanvas` provides the interactive surface where nodes are displayed, connected, and manipulated. It handles panning, zooming, node selection, and all user interactions with the graph.

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| Graph | FlowGraph | required | The graph instance to display |
| BackgroundContent | RenderFragment | required | Background/grid content |
| Panels | RenderFragment | null | Overlay UI panels (zoom controls, etc.) |
| Height | string | "100%" | Canvas height (CSS value) |
| Width | string | "100%" | Canvas width (CSS value) |
| Style | string | "" | Custom inline CSS styles |
| GridStyle | string | "" | Background grid inline CSS |
| Class | string | "flow-canvas" | CSS class for canvas element |
| SelectionRectangleClass | string | "flow-selection-rectangle" | CSS class for rectangle selection |
| NodeSelectionClass | string | "selected" | CSS class applied to selected nodes |
| ExecutingEdgeClass | string | "edge-executing" | CSS class for edges during execution |
| IsReadOnly | bool | false | Read-only mode (pan/zoom only, no editing) |
| Zoom | double | 1.0 | Initial zoom level |
| MinZoom | double | 0.2 | Minimum zoom level |
| MaxZoom | double | 2.0 | Maximum zoom level |
| PanKey | string | "alt" | Modifier key for panning: "shift", "ctrl", "alt", "meta" |
| AutoUpdateSocketColors | bool | true | Automatically update socket colors based on connections |
| EdgeShouldMatchDataType | bool | true | Validate type compatibility when connecting sockets |
| JsEdgePathFunctionName | string | null | Custom JavaScript function name for edge rendering |
| ScrollSpeed | float | 1 | How fast zoom happens in the canvas viewport |


## Methods

### SetZoomAsync
Sets the canvas zoom level.

**Signature**: `ValueTask SetZoomAsync(double zoom)`

```csharp
await canvas.SetZoomAsync(1.5); // 150% zoom
```

### SetOffsetAsync
Sets the canvas pan offset.

**Signature**: `ValueTask SetOffsetAsync(double offsetX, double offsetY)`

```csharp
await canvas.SetOffsetAsync(100, 50);
```

### SetReadOnlyAsync
Enables or disables read-only mode.

**Signature**: `ValueTask SetReadOnlyAsync(bool isReadOnly)`

```csharp
await canvas.SetReadOnlyAsync(true); // Lock canvas
```

### SetCanvasModeAsync
Sets the canvas interaction mode.

**Signature**: `ValueTask SetCanvasModeAsync(CanvasMode mode)`

```csharp
// CanvasMode.Select - Click to select nodes, Alt+drag to pan
await canvas.SetCanvasModeAsync(CanvasMode.Select);

// CanvasMode.Pan - Always pan mode
await canvas.SetCanvasModeAsync(CanvasMode.Pan);
```

### GetViewportPropertiesAsync
Gets the current viewport state.

**Signature**: `ValueTask<CanvasProperties> GetViewportPropertiesAsync()`

```csharp
var props = await canvas.GetViewportPropertiesAsync();
Console.WriteLine($"Zoom: {props.Zoom}, Offset: ({props.OffsetX}, {props.OffsetY})");
```

### SetViewportPropertiesAsync
Sets viewport properties (zoom, offset, etc.).

**Signature**: `ValueTask SetViewportPropertiesAsync(CanvasProperties props)`

```csharp
await canvas.SetViewportPropertiesAsync(new CanvasProperties 
{ 
    Zoom = 1.0, 
    OffsetX = 0, 
    OffsetY = 0,
    MinZoom = 0.2,
    MaxZoom = 2.0,
    IsReadOnly = false
});
```

### ClearAsync
Clears all nodes and edges, resets viewport.

**Signature**: `ValueTask ClearAsync()`

```csharp
await canvas.ClearAsync();
```

### SelectNodesAsync
Selects nodes by their IDs.

**Signature**: `ValueTask SelectNodesAsync(params string[] nodeIds)`

```csharp
await canvas.SelectNodesAsync("node1", "node2", "node3");
```

### ClearNodeSelectionAsync
Clears the current node selection.

**Signature**: `ValueTask ClearNodeSelectionAsync()`

```csharp
await canvas.ClearNodeSelectionAsync();
```

### GetSelectedNodesAsync
Gets IDs of currently selected nodes.

**Signature**: `ValueTask<string[]> GetSelectedNodesAsync()`

```csharp
var selectedIds = await canvas.GetSelectedNodesAsync();
```

### Refresh
Triggers a component re-render.

**Signature**: `void Refresh()`

```csharp
canvas.Refresh();
```

## Events

### OnCanvasLoaded
Fired when the canvas finishes loading.

**Type**: `EventCallback<CanvasLoadedEventArgs>`

```csharp
<FlowCanvas OnCanvasLoaded="HandleLoaded" ...>

@code {
    void HandleLoaded(CanvasLoadedEventArgs e)
    {
        Console.WriteLine($"Canvas loaded with zoom: {e.Zoom}");
    }
}
```

### OnPanned
Fired when the canvas is panned.

**Type**: `EventCallback<PanEventArgs>`

```csharp
void HandlePanned(PanEventArgs e)
{
    Console.WriteLine($"Panned to: ({e.OffsetX}, {e.OffsetY})");
}
```

### OnZoomed
Fired when the zoom level changes.

**Type**: `EventCallback<ZoomEventArgs>`

```csharp
void HandleZoomed(ZoomEventArgs e)
{
    Console.WriteLine($"Zoomed to: {e.Zoom}");
}
```

### OnNodeMoved
Fired when a node is moved.

**Type**: `EventCallback<NodeMovedArgs>`

```csharp
void HandleNodeMoved(NodeMovedArgs e)
{
    Console.WriteLine($"Node {e.NodeId} moved to ({e.X}, {e.Y})");
}
```

### OnNodeSelected
Fired when a node is selected.

**Type**: `EventCallback<NodeSelectedEventArgs>`

```csharp
void HandleNodeSelected(NodeSelectedEventArgs e)
{
    Console.WriteLine($"Node selected: {e.NodeId}");
}
```

### OnNodeDeselected
Fired when a node is deselected.

**Type**: `EventCallback<NodeDeselectedEventArgs>`

```csharp
void HandleNodeDeselected(NodeDeselectedEventArgs e)
{
    Console.WriteLine($"Node deselected: {e.NodeId}");
}
```

### OnSelectionChanged
Fired when the selection changes (multiple nodes).

**Type**: `EventCallback<SelectionChangedEventArgs>`

```csharp
void HandleSelectionChanged(SelectionChangedEventArgs e)
{
    Console.WriteLine($"Selected {e.SelectedNodeIds.Length} nodes");
}
```

### OnNotifyNodesCleared
Fired when all nodes are cleared from the canvas.

**Type**: `EventCallback<NodesClearedEventArgs>`

```csharp
void HandleNodesCleared(NodesClearedEventArgs e)
{
    Console.WriteLine($"Cleared {e.ClearedCount} nodes");
}
```

### OnEdgeConnectRequest
Fired when an edge connection is requested. Can be handled to customize connection logic.

**Type**: `EventCallback<ConnectRequestArgs>`

```csharp
async Task HandleConnectRequest(ConnectRequestArgs e)
{
    // Custom validation
    if (ShouldAllowConnection(e.FromSocket, e.ToSocket))
    {
        // Let it proceed (don't set Handled)
    }
    else
    {
        e.Handled = true; // Block the connection
    }
}
```

### OnSocketLongPress
Fired when a socket is long-pressed (held for 1 second).

**Type**: `EventCallback<SocketLongPressEventArgs>`

```csharp
void HandleSocketLongPress(SocketLongPressEventArgs e)
{
    Console.WriteLine($"Long press on socket: {e.Socket.Name}");
}
```

### OnContextMenu
Fired when the canvas is right-clicked.

**Type**: `EventCallback<CanvasContextMenuEventArgs>`

```csharp
async Task HandleContextMenu(CanvasContextMenuEventArgs e)
{
    // Show context menu
    await contextMenu.ShowAsync(e.ClientX, e.ClientY, e.X, e.Y);
}
```

## Complete Example

```razor
@using FlowState.Components
@using FlowState.Models
@using FlowState.Models.Events

<FlowCanvas @ref="canvas"
            Graph="graph"
            Height="100vh"
            Width="100vw"
            MinZoom="0.5"
            MaxZoom="3.0"
            Zoom="1.0"
            PanKey="alt"
            IsReadOnly="false"
            OnCanvasLoaded="OnLoaded"
            OnNodeMoved="OnNodeMoved"
            OnContextMenu="ShowContextMenu">
    <BackgroundContent>
        <FlowBackground class="custom-grid"/>
    </BackgroundContent>
    <Panels>
        <FlowPanels>
            <button @onclick="ZoomIn">+</button>
            <button @onclick="ZoomOut">-</button>
        </FlowPanels>
    </Panels>
</FlowCanvas>

@code {
    FlowCanvas? canvas;
    FlowGraph graph = new();

    async Task OnLoaded(CanvasLoadedEventArgs e)
    {
        // Canvas is ready
        await graph.CreateNodeAsync<MyNode>(100, 100, []);
    }

    void OnNodeMoved(NodeMovedArgs e)
    {
        Console.WriteLine($"Node moved to ({e.X}, {e.Y})");
    }

    async Task ShowContextMenu(CanvasContextMenuEventArgs e)
    {
        // Show your context menu
    }

    async Task ZoomIn()
    {
        var props = await canvas!.GetViewportPropertiesAsync();
        await canvas.SetZoomAsync(Math.Min(props.Zoom + 0.1, props.MaxZoom));
    }

    async Task ZoomOut()
    {
        var props = await canvas!.GetViewportPropertiesAsync();
        await canvas.SetZoomAsync(Math.Max(props.Zoom - 0.1, props.MinZoom));
    }
}
```

## See Also

- [FlowBackground](./flow-background.html) - Background customization
- [FlowPanels](./flow-panels.html) - Overlay UI panels
- [FlowGraph](../flow-graph.html) - Graph management
- [Getting Started](../getting-started.html) - Complete working example

