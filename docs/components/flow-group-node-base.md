---
layout: default
title: FlowGroupNodeBase
parent: Components
nav_order: 7
---

# FlowGroupNodeBase

Base class for resizable group nodes. Create container nodes that can organize and group other nodes.

## Overview

`FlowGroupNodeBase` extends `FlowNodeBase` with resizing capabilities. Group nodes typically appear behind regular nodes and provide visual organization.

## Inherits From

[FlowNodeBase](./flow-node-base.html)

## Additional Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| Width | double | 300 | Node width in pixels |
| Height | double | 300 | Node height in pixels |

## Additional Methods

### GetNodesInGroupAsync
Gets IDs of nodes currently contained within the group boundaries.

**Signature**: `ValueTask<string[]> GetNodesInGroupAsync()`

```csharp
var containedNodeIds = await groupNode.GetNodesInGroupAsync();
Console.WriteLine($"Group contains {containedNodeIds.Length} nodes");
```

### SetSizeAsync
Sets the size of the group node.

**Signature**: `ValueTask SetSizeAsync(double width, double height)`

```csharp
await groupNode.SetSizeAsync(500, 400);
```

### OnResized
Virtual method called when the node is resized (override to add custom behavior).

**Signature**: `virtual void OnResized(double width, double height)`

```csharp
public override void OnResized(double width, double height)
{
    base.OnResized(width, height);
    // Custom resize logic
    Console.WriteLine($"Resized to {width}x{height}");
}
```

### OnRenderedAsync
Override to set initial size.

**Signature**: `override async ValueTask OnRenderedAsync()`

```csharp
public override async ValueTask OnRenderedAsync()
{
    await base.OnRenderedAsync();
    await SetSizeAsync(Width, Height);
}
```

## Creating a Group Node

### MyGroupNode.razor.cs

```csharp
using FlowState.Components;
using FlowState.Attributes;
using FlowState.Models.Execution;

namespace MyNamespace;

[FlowNodeMetadata(
    Title = "Group",
    Category = "Layout",
    Icon = "📦",
    Kind = NodeKind.Group  // Important: Mark as Group kind
)]
public partial class MyGroupNode : FlowGroupNodeBase
{
    protected override void OnInitialized()
    {
        base.OnInitialized();
        Width = 400;
        Height = 300;
    }

    public override void OnResized(double width, double height)
    {
        base.OnResized(width, height);
        // Log resize or update UI
    }

    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        // Group nodes typically don't execute
        // But you can add logic if needed
        await ValueTask.CompletedTask;
    }
}
```

### MyGroupNode.razor

```razor
@using FlowState.Components
@inherits FlowGroupNodeBase

<FlowNode>
    <div class="group-title">📦 Group</div>
    <FlowResizeHandle />
</FlowNode>

<style>
.group-title {
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
```

## Styling Group Nodes

Group nodes should appear behind regular nodes using CSS z-index:

```css
/* Group nodes behind everything */
.flow-node[kind="Group"] {
    z-index: 1 !important;
    background: rgba(50, 50, 50, 0.5);
    border: 2px dashed rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(4px);
}

/* Regular nodes on top */
.flow-node:not([kind="Group"]) {
    z-index: 10;
}

/* Edges in between */
.edge {
    z-index: 5;
}
```

## Complete Example

### GroupNode.razor.cs

```csharp
using FlowState.Components;
using FlowState.Attributes;
using FlowState.Models.Execution;

[FlowNodeMetadata(
    Title = "Container",
    Category = "Layout",
    Icon = "📁",
    Description = "Resizable container for organizing nodes",
    Kind = NodeKind.Group
)]
public partial class GroupNode : FlowGroupNodeBase
{
    protected override void OnInitialized()
    {
        base.OnInitialized();
        Width = 500;
        Height = 350;
    }

    public override void OnResized(double width, double height)
    {
        base.OnResized(width, height);
        StateHasChanged(); // Update UI if displaying size
    }

    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        // Get nodes in this group
        var nodes = await GetNodesInGroupAsync();
        Console.WriteLine($"Group contains: {string.Join(", ", nodes)}");
        await ValueTask.CompletedTask;
    }
}
```

### GroupNode.razor

```razor
@using FlowState.Components
@inherits FlowGroupNodeBase

<FlowNode>
    <div class="group-container">
        <div class="group-header">
            <span class="group-icon">📁</span>
            <span class="group-title">Container</span>
            <span class="group-size">@Width×@Height</span>
        </div>
        <FlowResizeHandle />
    </div>
</FlowNode>

<style>
.group-container {
    width: 100%;
    height: 100%;
}

.group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.group-icon {
    font-size: 16px;
}

.group-title {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
}

.group-size {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    font-family: monospace;
}

/* Make group nodes semi-transparent and behind others */
.flow-node[kind="Group"] {
    z-index: 1 !important;
    background: rgba(30, 30, 40, 0.6);
    border: 2px dashed rgba(124, 58, 237, 0.4);
    backdrop-filter: blur(4px);
}

.flow-node[kind="Group"]:hover {
    border-color: rgba(124, 58, 237, 0.6);
}
</style>
```

## Usage in Graph

```csharp
// Create a group node
var groupNode = await graph.CreateNodeAsync<GroupNode>(100, 100, []);

// Create regular nodes inside the group area
var node1 = await graph.CreateNodeAsync<MyNode>(150, 150, []);
var node2 = await graph.CreateNodeAsync<MyNode>(250, 150, []);

// Get nodes in the group
var group = graph.GetNodeById(groupNode.Id) as GroupNode;
var containedNodes = await group!.GetNodesInGroupAsync();
```

## Programmatic Resizing

```csharp
var groupNode = graph.GetNodeById("group-id") as FlowGroupNodeBase;
if (groupNode != null)
{
    // Resize to fit content
    await groupNode.SetSizeAsync(600, 450);
}
```

## Z-Index Layering

The recommended z-index structure:

```css
/* Layer 1: Group nodes (background) */
.flow-node[kind="Group"] {
    z-index: 1 !important;
}

/* Layer 2: Edges */
.edge {
    z-index: 5;
}

/* Layer 3: Regular nodes (foreground) */
.flow-node:not([kind="Group"]) {
    z-index: 10;
}

/* Layer 4: Selected nodes (always on top) */
.flow-node.selected {
    z-index: 100 !important;
}
```

## See Also

- [FlowResizeHandle](./flow-resize-handle.html) - Resize handle component
- [FlowNodeBase](./flow-node-base.html) - Base node class
- [Custom Nodes](../customization/custom-nodes.html) - Creating custom nodes

