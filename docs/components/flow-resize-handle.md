---
layout: default
title: FlowResizeHandle
parent: Components
nav_order: 8
---

# FlowResizeHandle

Resize handle for group nodes. Provides a draggable corner for resizing.

## Overview

`FlowResizeHandle` adds a resize handle (typically in the bottom-right corner) to group nodes, allowing users to drag and resize them.

## Usage

Place `<FlowResizeHandle />` inside your group node markup:

```razor
@using FlowState.Components
@inherits FlowGroupNodeBase

<FlowNode>
    <div class="group-title">My Group</div>
    <FlowResizeHandle />
</FlowNode>
```

## Default Styling

The resize handle has default styling but can be fully customized with CSS:

```css
.resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    cursor: se-resize;
}
```

## Custom Styling

### Simple Triangle Handle

```razor
<FlowNode>
    <div class="content">Group Content</div>
    <FlowResizeHandle />
</FlowNode>

<style>
.resize-handle {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 16px;
    height: 16px;
    cursor: se-resize;
}

.resize-handle::before {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 0 14px 14px;
    border-color: transparent transparent rgba(255,255,255,0.3) transparent;
}

.resize-handle:hover::before {
    border-color: transparent transparent rgba(255,255,255,0.6) transparent;
}
</style>
```

### Grip Lines Handle

```razor
<style>
.resize-handle {
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 16px;
    height: 16px;
    cursor: se-resize;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-end;
    gap: 2px;
    padding: 2px;
}

.resize-handle::before,
.resize-handle::after {
    content: '';
    width: 100%;
    height: 2px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 1px;
}

.resize-handle::after {
    width: 60%;
}

.resize-handle:hover::before,
.resize-handle:hover::after {
    background: rgba(255, 255, 255, 0.6);
}
</style>
```

### Icon Handle

```razor
<FlowNode>
    <div class="content">Group Content</div>
    <FlowResizeHandle />
</FlowNode>

<style>
.resize-handle {
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    cursor: se-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.4);
    font-size: 16px;
}

.resize-handle::before {
    content: '⤡'; /* Or any resize icon */
}

.resize-handle:hover {
    color: rgba(255, 255, 255, 0.8);
}
</style>
```

## Complete Group Node with Resize

```razor
@using FlowState.Components
@using FlowState.Attributes
@inherits FlowGroupNodeBase

<FlowNode>
    <div class="group-wrapper">
        <div class="group-header">
            <span class="group-icon">📦</span>
            <span class="group-title">Container</span>
        </div>
        <div class="group-body">
            <div class="group-info">
                Drag nodes into this area
            </div>
        </div>
        <FlowResizeHandle />
    </div>
</FlowNode>

<style>
.group-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
}

.group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
}

.group-icon {
    font-size: 16px;
}

.group-title {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
}

.group-body {
    flex: 1;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.group-info {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    text-align: center;
}

/* Resize Handle */
.resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 24px;
    height: 24px;
    cursor: se-resize;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    padding: 4px;
}

.resize-handle::before {
    content: '';
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 0 16px 16px;
    border-color: transparent transparent rgba(255, 255, 255, 0.2) transparent;
    transition: border-color 0.2s;
}

.resize-handle:hover::before {
    border-color: transparent transparent rgba(124, 58, 237, 0.6) transparent;
}

/* Group node styling */
.flow-node[kind="Group"] {
    z-index: 1 !important;
    background: rgba(30, 30, 40, 0.6);
    border: 2px dashed rgba(124, 58, 237, 0.4);
    backdrop-filter: blur(4px);
    min-width: 200px;
    min-height: 150px;
}

.flow-node[kind="Group"].selected {
    border-color: rgba(124, 58, 237, 0.8);
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.3);
}
</style>
```

## Resize Behavior

### How It Works

1. User clicks and holds the resize handle
2. Dragging changes the node's width and height
3. On release, `OnResized()` is called on the group node
4. The new size is persisted

### Minimum Size

You can enforce minimum dimensions with CSS:

```css
.flow-node[kind="Group"] {
    min-width: 200px;
    min-height: 150px;
}
```

### Maximum Size

Similarly, enforce maximum dimensions:

```css
.flow-node[kind="Group"] {
    max-width: 1000px;
    max-height: 800px;
}
```

## Handling Resize Events

In your group node class, override `OnResized`:

```csharp
public override void OnResized(double width, double height)
{
    base.OnResized(width, height);
    
    // Update internal state
    Width = width;
    Height = height;
    
    // Trigger UI update
    StateHasChanged();
    
    // Log resize
    Console.WriteLine($"Resized to {width}x{height}");
    
    // Check contained nodes
    var nodes = GetNodesInGroupAsync().Result;
    Console.WriteLine($"Now contains {nodes.Length} nodes");
}
```

## Positioning

The resize handle is typically positioned at the bottom-right corner:

```css
.resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    /* other styles */
}
```

You can position it elsewhere if needed:

```css
/* Bottom-left corner */
.resize-handle-bl {
    position: absolute;
    bottom: 0;
    left: 0;
    cursor: sw-resize;
}

/* Top-right corner */
.resize-handle-tr {
    position: absolute;
    top: 0;
    right: 0;
    cursor: ne-resize;
}
```

{: .note }
Currently, FlowState only supports bottom-right resize handles by default. Custom positioning may require additional JavaScript.

## Accessibility

Add ARIA attributes for better accessibility:

```razor
<FlowResizeHandle />

<style>
.resize-handle::before {
    content: 'Resize';
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
}
</style>
```

## See Also

- [FlowGroupNodeBase](./flow-group-node-base.html) - Group node base class
- [Custom Nodes](../customization/custom-nodes.html) - Creating custom nodes
- [Getting Started](../getting-started.html) - Complete examples

