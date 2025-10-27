---
layout: default
title: FlowNodeBase
parent: Components
nav_order: 4
---

# FlowNodeBase

Base class for all custom nodes. Inherit from this class to create your own node types.

## Overview

`FlowNodeBase` provides the foundation for custom nodes, handling socket management, lifecycle events, and serialization.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| Id | string | Unique node identifier (auto-generated) |
| X | double | X coordinate position |
| Y | double | Y coordinate position |
| Graph | FlowGraph | Reference to parent graph |
| Sockets | IReadOnlyList<FlowSocket> | All sockets (input + output) |
| InputSockets | IReadOnlyDictionary<string, FlowSocket> | Input sockets dictionary |
| OutputSockets | IReadOnlyDictionary<string, FlowSocket> | Output sockets dictionary |
| DomElement | FlowNode | DOM element reference |
| NodeKind | NodeKind | Node type (Regular or Group) |
| IsRendered | bool | Whether node UI has rendered |

## Abstract Methods

### ExecuteAsync
Main execution logic for the node. Must be implemented.

**Signature**: `abstract ValueTask ExecuteAsync(FlowExecutionContext context)`

```csharp
public override async ValueTask ExecuteAsync(FlowExecutionContext context)
{
    var inputA = context.GetInputSocketData<float>("A");
    var inputB = context.GetInputSocketData<float>("B");
    var result = inputA + inputB;
    context.SetOutputSocketData("Result", result);
    await ValueTask.CompletedTask;
}
```

## Virtual Methods

### BeforeGraphExecutionAsync
Called before graph execution starts. Use this to reset state.

**Signature**: `virtual ValueTask BeforeGraphExecutionAsync()`

```csharp
public override ValueTask BeforeGraphExecutionAsync()
{
    // Reset cached values
    _cachedResult = 0;
    return ValueTask.CompletedTask;
}
```

### OnRenderedAsync
Called when the node UI is first rendered.

**Signature**: `virtual ValueTask OnRenderedAsync()`

```csharp
public override async ValueTask OnRenderedAsync()
{
    await base.OnRenderedAsync();
    // Initialize UI-dependent state
}
```

## Public Methods

### GetSocketByName
Gets a socket by name and type.

**Signature**: `FlowSocket? GetSocketByName(string name, SocketType type)`

```csharp
var socket = node.GetSocketByName("InputA", SocketType.Input);
```

### AddSocket
Adds a socket to the node (typically called automatically).

**Signature**: `void AddSocket(FlowSocket flowSocket, bool overridePreviousName = false)`

```csharp
node.AddSocket(newSocket, overridePreviousName: false);
```

### GetSerializableObjectAsync
Gets serializable representation of the node.

**Signature**: `async ValueTask<NodeProperties> GetSerializableObjectAsync()`

```csharp
var props = await node.GetSerializableObjectAsync();
```

## Node Lifecycle

Understanding the node lifecycle is important for managing state correctly:

1. **Creation**: Node instance is created via `graph.CreateNodeAsync<T>()`
2. **Initialization**: `OnInitialized()` is called (Blazor lifecycle)
3. **First Render**: `OnRenderedAsync()` is called when UI renders
4. **Before Execution**: `BeforeGraphExecutionAsync()` is called before graph execution
5. **Execution**: `ExecuteAsync(context)` is called during graph execution
6. **Disposal**: `Dispose()` is called when node is removed

```csharp
public partial class MyNode : FlowNodeBase
{
    protected override void OnInitialized()
    {
        base.OnInitialized();
        // Component initialization
    }

    public override async ValueTask OnRenderedAsync()
    {
        await base.OnRenderedAsync();
        // UI is now ready
    }

    public override ValueTask BeforeGraphExecutionAsync()
    {
        // Reset state before execution
        return ValueTask.CompletedTask;
    }

    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        // Main logic
        await ValueTask.CompletedTask;
    }

    public void Dispose()
    {
        // Cleanup resources
    }
}
```

## Creating a Custom Node

### MyNode.razor.cs

```csharp
using FlowState.Components;
using FlowState.Attributes;
using FlowState.Models.Execution;

namespace MyNamespace;

[FlowNodeMetadata(
    Title = "My Custom Node",
    Category = "Custom",
    Icon = "⚡",
    Description = "Does something awesome"
)]
public partial class MyNode : FlowNodeBase
{
    private float _cachedValue = 0;

    public override ValueTask BeforeGraphExecutionAsync()
    {
        _cachedValue = 0;
        return ValueTask.CompletedTask;
    }

    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        var input = context.GetInputSocketData<float>("Input");
        var result = input * 2;
        _cachedValue = result;
        context.SetOutputSocketData("Output", result);
        await ValueTask.CompletedTask;
    }
}
```

### MyNode.razor

```razor
@using FlowState.Components
@using FlowState.Models
@inherits FlowNodeBase

<FlowNode>
    <div class="title">⚡ My Custom Node</div>
    <div class="body">
        <FlowSocket Name="Input" Type="SocketType.Input" T="typeof(float)"/>
        <FlowSocket Name="Output" Type="SocketType.Output" T="typeof(float)"/>
        
        @if (_cachedValue > 0)
        {
            <div class="result">Result: @_cachedValue</div>
        }
    </div>
</FlowNode>
```

## Accessing Node Data

### From Within the Node

```csharp
public override async ValueTask ExecuteAsync(FlowExecutionContext context)
{
    // Access node properties
    var myId = this.Id;
    var myPosition = (this.X, this.Y);
    var myGraph = this.Graph;
    
    // Access sockets
    var inputSocket = this.GetSocketByName("Input", SocketType.Input);
    var allInputs = this.InputSockets;
    var allOutputs = this.OutputSockets;
    
    await ValueTask.CompletedTask;
}
```

### From Outside the Node

```csharp
var node = graph.GetNodeById("node-id-123");
if (node != null)
{
    Console.WriteLine($"Node at ({node.X}, {node.Y})");
    Console.WriteLine($"Has {node.Sockets.Count} sockets");
    
    foreach (var socket in node.InputSockets.Values)
    {
        Console.WriteLine($"Input: {socket.Name}");
    }
}
```

## Parameter Serialization

All `[Parameter]` properties are automatically serialized:

```csharp
[FlowNodeMetadata(Title = "Config Node")]
public partial class ConfigNode : FlowNodeBase
{
    [Parameter]
    public string ConfigValue { get; set; } = "default";
    
    [Parameter]
    public int Count { get; set; } = 10;
    
    // These will be saved/loaded automatically
    
    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        // Use ConfigValue and Count
        await ValueTask.CompletedTask;
    }
}
```

```razor
<FlowNode>
    <div class="title">⚙️ Config Node</div>
    <div class="body">
        <input class="input-box" @bind="ConfigValue" />
        <input class="input-box" type="number" @bind="Count" />
    </div>
</FlowNode>
```

## See Also

- [Custom Nodes](../customization/custom-nodes.html) - Complete guide to creating custom nodes
- [FlowSocket](./flow-socket.html) - Socket component
- [FlowExecutionContext](../flow-execution-context.html) - Execution context reference
- [FlowGroupNodeBase](./flow-group-node-base.html) - Group node base class

