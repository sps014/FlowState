---
layout: default
title: Components
nav_order: 3
has_children: true
---

# Components

FlowState provides a set of Blazor components for building interactive node-based editors.

## Core Components

- **[FlowCanvas](./components/flow-canvas.html)** - Main canvas for rendering graphs
- **[FlowBackground](./components/flow-background.html)** - Customizable background
- **[FlowSocket](./components/flow-socket.html)** - Input/output connection points
- **[FlowNodeBase](./components/flow-node-base.html)** - Base class for custom nodes
- **[FlowContextMenu](./components/flow-context-menu.html)** - Context menu for node creation
- **[FlowPanels](./components/flow-panels.html)** - Overlay panels for UI controls
- **[FlowGroupNodeBase](./components/flow-group-node-base.html)** - Base class for group nodes
- **[FlowResizeHandle](./components/flow-resize-handle.html)** - Resize handle for group nodes

## Quick Start

All components work together to create a complete node editor:

```razor
<FlowCanvas Graph="graph" Height="600px">
    <BackgroundContent>
        <FlowBackground />
    </BackgroundContent>
</FlowCanvas>
```

Browse the individual component pages for detailed API documentation and examples.

