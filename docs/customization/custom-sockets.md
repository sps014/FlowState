---
layout: default
title: Custom Sockets
parent: Customization
parent: Customization
nav_order: 4
---

# Custom Sockets

Customize socket appearance, colors, and behavior for your nodes.

## Overview

While sockets work great with default settings, you can customize them extensively to match your design and improve user experience.

## Type-Based Coloring

Create a consistent color scheme based on data types:

```csharp
public partial class MyNode : FlowNodeBase
{
    private (string Inner, string Outer) GetSocketColors(Type type)
    {
        return type.Name switch
        {
            nameof(Single) => ("#10b981", "#065f46"),  // Green for float
            nameof(Int32) => ("#3b82f6", "#1e40af"),   // Blue for int
            nameof(String) => ("#f59e0b", "#b45309"),   // Orange for string
            nameof(Boolean) => ("#ef4444", "#b91c1c"),  // Red for bool
            "Vector3" => ("#8b5cf6", "#6d28d9"),       // Purple for Vector3
            _ => ("#6b7280", "#374151")                 // Gray for others
        };
    }
}
```

### Usage in Razor

```razor
@{
    var floatColors = GetSocketColors(typeof(float));
    var intColors = GetSocketColors(typeof(int));
}

<FlowSocket Name="FloatInput" 
            Type="SocketType.Input" 
            T="typeof(float)"
            InnerColor="@floatColors.Inner"
            OuterColor="@floatColors.Outer"/>

<FlowSocket Name="IntInput" 
            Type="SocketType.Input" 
            T="typeof(int)"
            InnerColor="@intColors.Inner"
            OuterColor="@intColors.Outer"/>
```

## Custom Socket Sizes

Different sizes for different purposes:

```razor
<!-- Small socket (10px) -->
<FlowSocket Name="Small" 
            Type="SocketType.Input" 
            T="typeof(float)"
            Size="10"/>

<!-- Default socket (14px) -->
<FlowSocket Name="Normal" 
            Type="SocketType.Input" 
            T="typeof(float)"/>

<!-- Large socket (20px) -->
<FlowSocket Name="Large" 
            Type="SocketType.Input" 
            T="typeof(float)"
            Size="20"/>
```

## Custom Socket Styles

### Glowing Sockets

```razor
<FlowSocket Name="Special" 
            Type="SocketType.Output" 
            T="typeof(float)"
            AnchorClass="socket-glow"/>

<style>
.socket-glow {
    box-shadow: 0 0 10px currentColor;
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { box-shadow: 0 0 5px currentColor; }
    50% { box-shadow: 0 0 15px currentColor; }
}
</style>
```

### Square Sockets

```razor
<FlowSocket Name="Data" 
            Type="SocketType.Input" 
            T="typeof(object)"
            AnchorClass="socket-square"/>

<style>
.socket-square {
    border-radius: 2px !important;
}
</style>
```

### Diamond Sockets

```razor
<FlowSocket Name="Exec" 
            Type="SocketType.Exec" 
            T="typeof(object)"
            AnchorClass="socket-diamond"/>

<style>
.socket-diamond {
    transform: rotate(45deg);
}
</style>
```

## Socket Labels

### Custom Label Styling

```css
.socket-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 8px;
}

.socket-label-bold {
    font-weight: 600;
    color: white;
}

.socket-label-small {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
}
```

```razor
<FlowSocket Name="Important" 
            Label="⚠️ Important Input"
            LabelClass="socket-label-bold"/>
```

### Label Positioning

```css
/* Input sockets - label on right */
.flow-node .socket-container[data-type="input"] {
    flex-direction: row;
}

/* Output sockets - label on left */
.flow-node .socket-container[data-type="output"] {
    flex-direction: row-reverse;
}
```

## Complete Styled Socket Example

```razor
@inherits FlowNodeBase

<FlowNode>
    <div class="title">🎨 Styled Node</div>
    <div class="body">
        <!-- Float input - Green -->
        <FlowSocket Name="Value" 
                    Label="Value"
                    Type="SocketType.Input" 
                    T="typeof(float)"
                    InnerColor="#10b981"
                    OuterColor="#065f46"
                    Size="16"
                    LabelClass="socket-label-custom"/>
        
        <!-- Boolean input - Red square -->
        <FlowSocket Name="Enable" 
                    Label="Enable"
                    Type="SocketType.Input" 
                    T="typeof(bool)"
                    InnerColor="#ef4444"
                    OuterColor="#b91c1c"
                    AnchorClass="socket-square"/>
        
        <!-- Output with glow -->
        <FlowSocket Name="Result" 
                    Label="Result"
                    Type="SocketType.Output" 
                    T="typeof(float)"
                    InnerColor="#8b5cf6"
                    OuterColor="#6d28d9"
                    AnchorClass="socket-glow"/>
    </div>
</FlowNode>

<style>
.socket-label-custom {
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
}

.socket-square {
    border-radius: 2px !important;
}

.socket-glow {
    box-shadow: 0 0 8px currentColor;
}
</style>
```

## Connection Limits

Control how many connections a socket can have:

```razor
<!-- Single connection output -->
<FlowSocket Name="Single" 
            Type="SocketType.Output" 
            T="typeof(float)"
            MaxConnections="1"/>

<!-- Multiple connections (default) -->
<FlowSocket Name="Multi" 
            Type="SocketType.Output" 
            T="typeof(float)"
            MaxConnections="99"/>
```

## See Also

- [FlowSocket](../components/flow-socket.html) - Socket component reference
- [Type Compatibility](../type-compatibility.html) - Socket type system
- [Styling Guide](./styling-guide.html) - Complete styling reference
- [Custom Edges](./custom-edges.html) - Vertical edge paths for top-to-bottom flows

## Socket Direction (Vertical Layout)

By default, socket anchors appear on the left side (inputs) or right side (outputs) of a node — the classic horizontal flow. Setting `Direction="SocketDirection.Vertical"` moves anchors to the **top** (inputs) or **bottom** (outputs) of their container, enabling top-to-bottom pipelines.

### How It Works

The `Direction` parameter controls the `flex-direction` of the socket container:

| Direction | Type | Anchor position |
|-----------|------|-----------------|
| `Horizontal` (default) | Input | Left |
| `Horizontal` (default) | Output | Right |
| `Vertical` | Input | **Top** |
| `Vertical` | Output | **Bottom** |

### Basic Vertical Node

Structure vertical nodes so input sockets come first (top section) and output sockets come last (bottom section), with your node content in between:

```razor
@inherits FlowNodeBase

<FlowNode>
    <!-- Input sockets row — anchors appear at the TOP -->
    <div class="v-inputs">
        <FlowSocket Name="In"
                    Label="Input"
                    Type="SocketType.Input"
                    Direction="SocketDirection.Vertical"
                    T="typeof(float)"
                    InnerColor="#3b82f6"
                    OuterColor="#1e40af" />
    </div>

    <!-- Node content -->
    <div class="v-body">
        <div class="title">⚙️ My Node</div>
        <!-- controls, displays, etc. -->
    </div>

    <!-- Output sockets row — anchors appear at the BOTTOM -->
    <div class="v-outputs">
        <FlowSocket Name="Out"
                    Label="Output"
                    Type="SocketType.Output"
                    Direction="SocketDirection.Vertical"
                    T="typeof(float)"
                    InnerColor="#10b981"
                    OuterColor="#065f46" />
    </div>
</FlowNode>

<style>
    .v-inputs, .v-outputs {
        display: flex;
        justify-content: center;
        gap: 16px;
    }
</style>
```

### Multiple Vertical Sockets

Arrange several sockets side-by-side in a row:

```razor
<!-- Multiple inputs across the top -->
<div class="v-inputs">
    <FlowSocket Name="A" Label="A" Type="SocketType.Input"
                Direction="SocketDirection.Vertical" T="typeof(float)"
                InnerColor="#3b82f6" OuterColor="#1e40af"/>
    <FlowSocket Name="B" Label="B" Type="SocketType.Input"
                Direction="SocketDirection.Vertical" T="typeof(float)"
                InnerColor="#3b82f6" OuterColor="#1e40af"/>
</div>

<!-- Multiple outputs across the bottom -->
<div class="v-outputs">
    <FlowSocket Name="Sum"  Label="Sum"  Type="SocketType.Output"
                Direction="SocketDirection.Vertical" T="typeof(float)"
                InnerColor="#10b981" OuterColor="#065f46"/>
    <FlowSocket Name="Diff" Label="Diff" Type="SocketType.Output"
                Direction="SocketDirection.Vertical" T="typeof(float)"
                InnerColor="#f59e0b" OuterColor="#b45309"/>
</div>
```

### Vertical Edge Path

When using vertical sockets, pair them with a vertical Bézier edge function so edges flow naturally from bottom to top:

```javascript
// wwwroot/graphLine.js
function createVerticalPath(from, to) {
  const dy = to.y - from.y;
  const dist = Math.abs(dy) + Math.abs(to.x - from.x);
  const offset = Math.min(150, dist * 0.45);
  const c1 = { x: from.x, y: from.y + offset };
  const c2 = { x: to.x,   y: to.y   - offset };
  return `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
}
window.VerticalEdgeFunc = createVerticalPath;
```

```razor
<FlowCanvas Graph="graph"
            JsEdgePathFunctionName="VerticalEdgeFunc"
            Height="100vh"
            Width="100vw">
</FlowCanvas>
```

See `examples/SharedNodesLibrary/VerticalNodes/` and `GraphViewportVertical.razor` for a complete working example.

