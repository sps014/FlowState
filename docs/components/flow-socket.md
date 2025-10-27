---
layout: default
title: FlowSocket
parent: Components
nav_order: 3
---

# FlowSocket

Connection points on nodes for data flow. Sockets represent inputs and outputs that can be connected with edges.

## Overview

`FlowSocket` defines where connections can be made on a node. Each socket has a type (Input/Output/Exec) and a data type for type checking during connections.

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| Name | string | required | Unique socket name within the node |
| T | Type | typeof(object) | Data type this socket handles |
| Type | SocketType | Input | Socket type: Input, Output, or Exec |
| Label | string | null | Display label (defaults to Name if not set) |
| InnerColor | string | "#10b981" | Inner socket circle color |
| OuterColor | string | "#065f46" | Outer socket border color |
| Size | int | 14 | Socket size in pixels |
| Class | string | null | Container CSS class |
| AnchorClass | string | null | Socket anchor CSS class |
| LabelClass | string | "socket-label" | Label CSS class |
| MaxConnections | int | 99 | Max connections (output sockets only) |
| OverridePreviousName | bool | false | Replace existing socket with same name |

## Properties

### Connections
List of edges connected to this socket.

**Type**: `List<FlowEdge>`

```csharp
var connectionCount = socket.Connections.Count;
```

### FlowNode
Reference to the parent node.

**Type**: `FlowNodeBase` (CascadingParameter)

```csharp
var parentNode = socket.FlowNode;
```

## Methods

### AutoUpdateSocketColor
Updates the socket colors (typically called by the framework when AutoUpdateSocketColors is enabled).

**Signature**: `void AutoUpdateSocketColor(string innerColor, string outerColor)`

```csharp
socket.AutoUpdateSocketColor("#ff0000", "#990000");
```

### ResetColor
Resets socket colors to their original values.

**Signature**: `void ResetColor()`

```csharp
socket.ResetColor();
```

## Socket Types

FlowState supports three socket types:

### Input Socket
Receives data from other nodes.

```razor
<FlowSocket Name="InputA" Type="SocketType.Input" T="typeof(float)"/>
```

### Output Socket
Sends data to other nodes.

```razor
<FlowSocket Name="Result" Type="SocketType.Output" T="typeof(float)"/>
```

### Exec Socket
Controls execution flow (for nodes that need sequential execution).

```razor
<FlowSocket Name="Execute" Type="SocketType.Exec" T="typeof(object)"/>
```

## Data Type Compatibility

Sockets use the `T` parameter for type checking. By default, sockets can only connect if their types match.

### Exact Type Match

```razor
<!-- These can connect -->
<FlowSocket Name="Output" Type="SocketType.Output" T="typeof(float)"/>
<FlowSocket Name="Input" Type="SocketType.Input" T="typeof(float)"/>
```

### Universal Socket (Object Type)

Use `typeof(object)` to accept any type:

```razor
<FlowSocket Name="Any" Type="SocketType.Input" T="typeof(object)"/>
```

### Custom Type Compatibility

Register compatible types with the graph's TypeCompatibiltyRegistry:

```csharp
// Allow int to connect to float sockets
graph.TypeCompatibiltyRegistry.Register<float>(typeof(int));
```

See [Type Compatibility](../type-compatibility.html) for more details.

## Styling Sockets

### Custom Colors

Set socket colors to match your design:

```razor
<FlowSocket Name="Vector" 
            Type="SocketType.Output" 
            T="typeof(Vector3)"
            InnerColor="#8b5cf6"
            OuterColor="#6d28d9"/>
```

### Type-Based Coloring

Create a color scheme based on data types:

```csharp
private (string Inner, string Outer) GetSocketColors(Type type)
{
    return type.Name switch
    {
        nameof(Single) => ("#10b981", "#065f46"), // Green for float
        nameof(Int32) => ("#3b82f6", "#1e40af"),  // Blue for int
        nameof(String) => ("#f59e0b", "#b45309"),  // Orange for string
        nameof(Boolean) => ("#ef4444", "#b91c1c"), // Red for bool
        _ => ("#6b7280", "#374151")                // Gray for others
    };
}
```

```razor
@{
    var colors = GetSocketColors(typeof(float));
}

<FlowSocket Name="Value" 
            Type="SocketType.Input" 
            T="typeof(float)"
            InnerColor="@colors.Inner"
            OuterColor="@colors.Outer"/>
```

### Custom Socket Styles

Use CSS classes for advanced styling:

```css
.socket-large .socket-anchor {
    width: 20px;
    height: 20px;
}

.socket-glow .socket-anchor {
    box-shadow: 0 0 10px currentColor;
}
```

```razor
<FlowSocket Name="Special" 
            Type="SocketType.Output" 
            T="typeof(float)"
            AnchorClass="socket-large socket-glow"/>
```

## Socket Labels

### Default Label
If no label is provided, the socket Name is used:

```razor
<FlowSocket Name="InputA" Type="SocketType.Input" T="typeof(float)"/>
<!-- Displays "InputA" -->
```

### Custom Label
Provide a user-friendly label:

```razor
<FlowSocket Name="InputA" 
            Label="Input A" 
            Type="SocketType.Input" 
            T="typeof(float)"/>
<!-- Displays "Input A" -->
```

### No Label
Use an empty string to hide the label:

```razor
<FlowSocket Name="In" 
            Label="" 
            Type="SocketType.Input" 
            T="typeof(float)"/>
<!-- No label shown -->
```

## Max Connections

Output sockets can limit the number of connections:

```razor
<!-- Only one connection allowed -->
<FlowSocket Name="Output" 
            Type="SocketType.Output" 
            T="typeof(float)"
            MaxConnections="1"/>
```

When a new connection is made and the limit is reached, the oldest connection is automatically removed.

{: .note }
Input sockets always allow only one connection. The `MaxConnections` parameter only applies to output sockets.

## Complete Node Example

Here's a complete node showing various socket configurations:

```razor
@using FlowState.Components
@using FlowState.Models
@inherits FlowNodeBase

<FlowNode>
    <div class="title">Math Operation</div>
    <div class="body">
        <!-- Input sockets -->
        <FlowSocket Name="A" 
                    Label="Value A"
                    Type="SocketType.Input" 
                    T="typeof(float)"
                    InnerColor="#10b981"
                    OuterColor="#065f46"/>
                    
        <FlowSocket Name="B" 
                    Label="Value B"
                    Type="SocketType.Input" 
                    T="typeof(float)"
                    InnerColor="#10b981"
                    OuterColor="#065f46"/>
        
        <!-- Output socket with limited connections -->
        <FlowSocket Name="Result" 
                    Type="SocketType.Output" 
                    T="typeof(float)"
                    MaxConnections="5"
                    InnerColor="#3b82f6"
                    OuterColor="#1e40af"/>
    </div>
</FlowNode>
```

## Socket Size Reference

Common socket sizes:

```razor
<!-- Small (10px) -->
<FlowSocket Name="Small" Type="SocketType.Input" T="typeof(float)" Size="10"/>

<!-- Default (14px) -->
<FlowSocket Name="Default" Type="SocketType.Input" T="typeof(float)"/>

<!-- Medium (18px) -->
<FlowSocket Name="Medium" Type="SocketType.Input" T="typeof(float)" Size="18"/>

<!-- Large (24px) -->
<FlowSocket Name="Large" Type="SocketType.Input" T="typeof(float)" Size="24"/>
```

## See Also

- [FlowNodeBase](./flow-node-base.html) - Base class for nodes
- [Type Compatibility](../type-compatibility.html) - Managing socket type compatibility
- [Custom Nodes](../customization/custom-nodes.html) - Creating nodes with sockets
- [Custom Sockets](../customization/custom-sockets.html) - Advanced socket customization

