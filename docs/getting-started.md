---
layout: default
title: Getting Started
nav_order: 3
---

# Getting Started

This guide will walk you through creating your first node graph with FlowState.

## Minimal Example

Here's the simplest working setup:

```razor
@page "/"
@using FlowState.Components
@using FlowState.Models

<FlowCanvas Height="100vh" Width="100vw" Graph="graph">
    <BackgroundContent>
        <FlowBackground />
    </BackgroundContent>
</FlowCanvas>

@code {
    FlowGraph graph = new();
}
```

This creates an empty canvas with the default background. You can pan (hold Alt + drag) and zoom (mouse wheel).

For custom styling, see the [Styling Guide](./customization/styling-guide.html).

## Complete Working Example

For a full-featured production example with all FlowState features, see the **GraphViewport.razor** component in the SharedNodesLibrary.

### Location

```
examples/SharedNodesLibrary/GraphViewport.razor
```

### Key Features

This complete example includes:

- ✅ **GraphToolbar** - Custom toolbar with save/load/execute/undo/redo buttons
- ✅ **FlowCanvas** - Main canvas with event handling
- ✅ **FlowContextMenu** - Right-click context menu for adding nodes
- ✅ **Node Registration** - Register custom node types (`InputNode`, `SumNode`, `IfElseNode`, `WatchNode`, `GroupNode`)
- ✅ **Programmatic Node Creation** - Create and position nodes on canvas load
- ✅ **Node Connections** - Connect nodes to create data flow
- ✅ **Type Compatibility** - Allow int-to-float connections
- ✅ **Serialization** - Save and load graph state as JSON
- ✅ **Undo/Redo** - Full command history with `CommandManager`
- ✅ **Read-Only Mode** - Lock the canvas for presentation
- ✅ **Canvas Modes** - Switch between Select and Pan modes
- ✅ **Event Handling** - Socket long press, context menu, canvas loaded
- ✅ **Custom Styling** - Complete CSS with glassmorphism, grid background, and execution progress animation

### How to Run

1. Clone the FlowState repository
2. Navigate to the example:
   ```bash
   cd examples/FlowStateBlazorServer
   dotnet run
   ```
3. Open your browser to `https://localhost:5001`

### View the Source

The complete source code is available in the repository:
- **Component**: `examples/SharedNodesLibrary/GraphViewport.razor`
- **Toolbar**: `examples/SharedNodesLibrary/GraphToolbar.razor`
- **Custom Nodes**: `examples/SharedNodesLibrary/Nodes/`

**Browse on GitHub**: [SharedNodesLibrary](https://github.com/sps014/FlowState/tree/main/examples/SharedNodesLibrary)

For styling details, see the [Styling Guide](./customization/styling-guide.html).

## Next Steps

- [FlowCanvas Reference](./components/flow-canvas.html) - Learn about all canvas options
- [Create Custom Nodes](./customization/custom-nodes.html) - Build your own node types
- [Styling Guide](./customization/styling-guide.html) - Customize the appearance
- [FlowGraph API](./flow-graph.html) - Explore graph management methods

