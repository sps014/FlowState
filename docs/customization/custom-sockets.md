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

