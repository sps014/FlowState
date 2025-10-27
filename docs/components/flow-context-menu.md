---
layout: default
title: FlowContextMenu
parent: Components
nav_order: 5
---

# FlowContextMenu

Right-click context menu for creating nodes. Automatically shows all registered node types organized by category.

## Overview

`FlowContextMenu` provides a searchable menu that appears when right-clicking on the canvas. It displays all registered node types and creates new nodes at the clicked position.

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| Graph | FlowGraph | null | Graph reference (required) |
| ShowHeader | bool | true | Show menu header |
| ShowSearch | bool | true | Show search input |
| ShowDescriptions | bool | true | Show node descriptions |
| ShowNodeType | bool | true | Show node type names |
| HeaderContent | string | "Add Node" | Header text |
| SearchPlaceholder | string | "Search nodes..." | Search placeholder text |
| EmptyMessage | string | "No nodes found" | Message when no nodes match search |
| OverlayClass | string | null | CSS class for overlay |
| OverlayStyle | string | null | Inline CSS for overlay |
| MenuClass | string | null | CSS class for menu |
| MenuStyle | string | null | Inline CSS for menu |
| HeaderClass | string | null | CSS class for header |
| HeaderStyle | string | null | Inline CSS for header |

## Methods

### ShowAsync
Shows the context menu at specified position.

**Signature**: `Task ShowAsync(double screenX, double screenY, double canvasX, double canvasY)`

- `screenX`, `screenY`: Screen coordinates for menu positioning
- `canvasX`, `canvasY`: Canvas coordinates for node creation

```csharp
await contextMenu.ShowAsync(e.ClientX, e.ClientY, e.X, e.Y);
```

### HideAsync
Hides the context menu.

**Signature**: `Task HideAsync()`

```csharp
await contextMenu.HideAsync();
```

## Basic Usage

### 1. Add Context Menu Component

```razor
@using FlowState.Components
@using FlowState.Models

<FlowCanvas @ref="canvas" 
            Graph="graph" 
            OnContextMenu="HandleContextMenu">
    <BackgroundContent>
        <FlowBackground class="grid-bg"/>
    </BackgroundContent>
</FlowCanvas>

<FlowContextMenu @ref="contextMenu" Graph="graph"/>

@code {
    FlowCanvas? canvas;
    FlowContextMenu? contextMenu;
    FlowGraph graph = new();

    async Task HandleContextMenu(CanvasContextMenuEventArgs e)
    {
        await contextMenu!.ShowAsync(e.ClientX, e.ClientY, e.X, e.Y);
    }
}
```

### 2. Register Nodes

The context menu automatically shows all registered node types:

```csharp
protected override void OnInitialized()
{
    graph.RegisterNode<InputNode>();
    graph.RegisterNode<OutputNode>();
    graph.RegisterNode<MathNode>();
}
```

## Node Organization

Nodes are automatically organized by their `[FlowNodeMetadata]` category:

```csharp
[FlowNodeMetadata(
    Category = "Math",
    Title = "Add",
    Icon = "➕",
    Description = "Adds two numbers",
    Order = 1
)]
public partial class AddNode : FlowNodeBase
{
    // ...
}

[FlowNodeMetadata(
    Category = "Math",
    Title = "Multiply",
    Icon = "✖️",
    Description = "Multiplies two numbers",
    Order = 2
)]
public partial class MultiplyNode : FlowNodeBase
{
    // ...
}
```

This creates a "Math" category in the context menu with both nodes.

## Customization

### Custom Header

```razor
<FlowContextMenu @ref="contextMenu" 
                 Graph="graph"
                 HeaderContent="Create New Node"
                 ShowHeader="true"/>
```

### Hide Search

```razor
<FlowContextMenu @ref="contextMenu" 
                 Graph="graph"
                 ShowSearch="false"/>
```

### Custom Placeholder

```razor
<FlowContextMenu @ref="contextMenu" 
                 Graph="graph"
                 SearchPlaceholder="Find a node..."/>
```

### Custom Styling

```razor
<FlowContextMenu @ref="contextMenu" 
                 Graph="graph"
                 MenuClass="custom-menu"
                 HeaderClass="custom-header"/>

<style>
.custom-menu {
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.custom-header {
    background: linear-gradient(90deg, #7c3aed, #8b5cf6);
    font-size: 16px;
}
</style>
```

## Search Functionality

The context menu includes built-in search that filters by:
- Node title
- Node description
- Category name
- Node type name

```csharp
// User types "add" in search
// Shows: AddNode, MultiplyAndAdd, etc.
```

## Complete Example

```razor
@page "/editor"
@using FlowState.Components
@using FlowState.Models
@using FlowState.Models.Events

<FlowCanvas @ref="canvas" 
            Graph="graph"
            Height="100vh"
            Width="100vw"
            OnContextMenu="ShowContextMenu">
    <BackgroundContent>
        <FlowBackground class="grid-bg"/>
    </BackgroundContent>
</FlowCanvas>

<FlowContextMenu @ref="contextMenu"
                 Graph="graph"
                 ShowHeader="true"
                 ShowSearch="true"
                 ShowDescriptions="true"
                 HeaderContent="Add Node"
                 SearchPlaceholder="Search nodes..."/>

<style>
.grid-bg {
    background: #111827;
    background-image: 
        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 100px 100px;
}
</style>

@code {
    FlowCanvas? canvas;
    FlowContextMenu? contextMenu;
    FlowGraph graph = new();

    protected override void OnInitialized()
    {
        // Register all node types
        graph.RegisterNode<InputNode>();
        graph.RegisterNode<OutputNode>();
        graph.RegisterNode<AddNode>();
        graph.RegisterNode<MultiplyNode>();
        graph.RegisterNode<CompareNode>();
        graph.RegisterNode<BranchNode>();
    }

    async Task ShowContextMenu(CanvasContextMenuEventArgs e)
    {
        if (contextMenu != null)
        {
            await contextMenu.ShowAsync(e.ClientX, e.ClientY, e.X, e.Y);
        }
    }
}
```

## Click-Outside to Close

The context menu automatically closes when clicking outside of it. This is handled by JavaScript interop and requires no additional code.

## Programmatic Node Creation

While the context menu is convenient, you can also create nodes programmatically:

```csharp
// Instead of using context menu
var node = await graph.CreateNodeAsync<AddNode>(100, 100, new Dictionary<string, object?>());
```

## See Also

- [FlowCanvas](./flow-canvas.html) - Canvas events including OnContextMenu
- [Custom Nodes](../customization/custom-nodes.html) - Creating nodes that appear in the menu
- [FlowNodeMetadata](../customization/custom-nodes.html#metadata) - Organizing nodes with metadata

