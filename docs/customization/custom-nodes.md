---
layout: default
title: Custom Nodes
parent: Customization
parent: Customization
nav_order: 2
---

# Creating Custom Nodes

Learn how to create your own node types with custom behavior, appearance, and functionality.

## Node Structure

A custom node consists of two files:

1. **`.razor.cs`** - C# code with logic and metadata
2. **`.razor`** - Razor markup for visual appearance

## Basic Example

### SumNode.razor.cs

```csharp
using FlowState.Components;
using FlowState.Attributes;
using FlowState.Models.Execution;

namespace MyNamespace;

[FlowNodeMetadata(
    Title = "Sum",
    Category = "Math",
    Icon = "➕",
    Description = "Adds two numbers together"
)]
public partial class SumNode : FlowNodeBase
{
    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        var a = context.GetInputSocketData<float>("A");
        var b = context.GetInputSocketData<float>("B");
        var result = a + b;
        context.SetOutputSocketData("Result", result);
        await ValueTask.CompletedTask;
    }
}
```

### SumNode.razor

```razor
@using FlowState.Components
@using FlowState.Models
@inherits FlowNodeBase

<FlowNode>
    <div class="title">➕ Sum</div>
    <div class="body">
        <FlowSocket Name="A" Type="SocketType.Input" T="typeof(float)"/>
        <FlowSocket Name="B" Type="SocketType.Input" T="typeof(float)"/>
        <FlowSocket Name="Result" Type="SocketType.Output" T="typeof(float)"/>
    </div>
</FlowNode>
```

## FlowNodeMetadata Attribute

Configure how your node appears in the context menu:

```csharp
[FlowNodeMetadata(
    Title = "Display Title",          // Shown in context menu
    Category = "Category Name",        // Menu category
    Icon = "🎨",                       // Visual icon
    Description = "What it does",     // Tooltip/description
    Order = 1,                         // Sort order in category
    Kind = NodeKind.Regular            // Regular or Group
)]
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| Title | string | Class name | Display name |
| Category | string | "General" | Context menu category |
| Icon | string | "⚙️" | Icon/emoji |
| Description | string | "" | Tooltip description |
| Order | int | 0 | Sort order within category |
| Kind | NodeKind | Regular | Node type (Regular/Group) |

## Node Lifecycle

### 1. OnInitialized
Blazor component initialization.

```csharp
protected override void OnInitialized()
{
    base.OnInitialized();
    // Initialize component-level state
}
```

### 2. OnRenderedAsync
Called when the node UI first renders.

```csharp
public override async ValueTask OnRenderedAsync()
{
    await base.OnRenderedAsync();
    // UI is now available
    // Good place for DOM operations
}
```

### 3. BeforeGraphExecutionAsync
Called before graph execution starts - reset state here.

```csharp
public override ValueTask BeforeGraphExecutionAsync()
{
    // Reset cached values
    _result = 0;
    _hasExecuted = false;
    return ValueTask.CompletedTask;
}
```

### 4. ExecuteAsync
Main execution logic.

```csharp
public override async ValueTask ExecuteAsync(FlowExecutionContext context)
{
    // Get inputs
    var input = context.GetInputSocketData<float>("Input");
    
    // Process
    var output = ProcessData(input);
    
    // Set outputs
    context.SetOutputSocketData("Output", output);
    
    await ValueTask.CompletedTask;
}
```

## Working with Inputs and Outputs

### Reading Input Data

```csharp
public override async ValueTask ExecuteAsync(FlowExecutionContext context)
{
    // Get typed input
    var number = context.GetInputSocketData<float>("InputA");
    
    // Get untyped input
    var value = context.GetInputSocketData("InputB");
    
    // Handle missing input
    var optional = context.GetInputSocketData<float?>("Optional") ?? 0f;
    
    await ValueTask.CompletedTask;
}
```

### Setting Output Data

```csharp
public override async ValueTask ExecuteAsync(FlowExecutionContext context)
{
    var result = ComputeResult();
    
    // Set output
    context.SetOutputSocketData("Result", result);
    
    // Set multiple outputs
    context.SetOutputSocketData("Sum", a + b);
    context.SetOutputSocketData("Product", a * b);
    
    await ValueTask.CompletedTask;
}
```

## Node with State

### StateNode.razor.cs

```csharp
[FlowNodeMetadata(Title = "Counter", Category = "Utility")]
public partial class CounterNode : FlowNodeBase
{
    private int _count = 0;

    public override ValueTask BeforeGraphExecutionAsync()
    {
        // Optionally reset on each execution
        // _count = 0;
        return ValueTask.CompletedTask;
    }

    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        _count++;
        context.SetOutputSocketData("Count", _count);
        StateHasChanged(); // Update UI
        await ValueTask.CompletedTask;
    }
}
```

### CounterNode.razor

```razor
@inherits FlowNodeBase

<FlowNode>
    <div class="title">🔢 Counter</div>
    <div class="body">
        <div class="count-display">Count: @_count</div>
        <FlowSocket Name="Count" Type="SocketType.Output" T="typeof(int)"/>
    </div>
</FlowNode>
```

## Node with Parameters

Parameters are automatically serialized:

### ConfigNode.razor.cs

```csharp
[FlowNodeMetadata(Title = "Config", Category = "Utility")]
public partial class ConfigNode : FlowNodeBase
{
    [Parameter]
    public string Name { get; set; } = "Default";
    
    [Parameter]
    public float Multiplier { get; set; } = 1.0f;
    
    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        var input = context.GetInputSocketData<float>("Input");
        var result = input * Multiplier;
        context.SetOutputSocketData("Output", result);
        await ValueTask.CompletedTask;
    }
}
```

### ConfigNode.razor

```razor
@inherits FlowNodeBase

<FlowNode>
    <div class="title">⚙️ @Name</div>
    <div class="body">
        <input class="input-box" @bind="Name" placeholder="Name"/>
        <input class="input-box" type="number" @bind="Multiplier" step="0.1"/>
        <FlowSocket Name="Input" Type="SocketType.Input" T="typeof(float)"/>
        <FlowSocket Name="Output" Type="SocketType.Output" T="typeof(float)"/>
    </div>
</FlowNode>
```

## Conditional Execution Node

### IfElseNode.razor.cs

```csharp
[FlowNodeMetadata(Title = "If/Else", Category = "Logic", Icon = "🔀")]
public partial class IfElseNode : FlowNodeBase
{
    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        var a = context.GetInputSocketData<float>("InputA");
        var b = context.GetInputSocketData<float>("InputB");
        
        if (a > b)
        {
            context.SetOutputSocketData("OutputTrue", a);
        }
        else
        {
            context.SetOutputSocketData("OutputFalse", b);
        }
        
        await ValueTask.CompletedTask;
    }
}
```

### IfElseNode.razor

```razor
@inherits FlowNodeBase

<FlowNode>
    <div class="title">🔀 If A > B</div>
    <div class="body">
        <FlowSocket Name="InputA" Label="A" Type="SocketType.Input" T="typeof(float)"/>
        <FlowSocket Name="InputB" Label="B" Type="SocketType.Input" T="typeof(float)"/>
        <FlowSocket Name="OutputTrue" Label="True" Type="SocketType.Output" T="typeof(float)"/>
        <FlowSocket Name="OutputFalse" Label="False" Type="SocketType.Output" T="typeof(float)"/>
    </div>
</FlowNode>
```

## Node with Async Operations

```csharp
[FlowNodeMetadata(Title = "HTTP Request", Category = "Network")]
public partial class HttpNode : FlowNodeBase
{
    [Inject]
    private HttpClient Http { get; set; } = null!;

    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        var url = context.GetInputSocketData<string>("URL");
        
        try
        {
            var response = await Http.GetStringAsync(url);
            context.SetOutputSocketData("Response", response);
            context.SetOutputSocketData("Success", true);
        }
        catch (Exception ex)
        {
            context.SetOutputSocketData("Error", ex.Message);
            context.SetOutputSocketData("Success", false);
        }
    }
}
```

## Styling Nodes

See the [Styling Guide](./styling-guide.html) for complete CSS examples.

### Basic Node Styles

```css
.flow-node .title {
    padding: 12px 16px 8px;
    font-weight: 600;
    font-size: 14px;
    color: white;
    background: linear-gradient(90deg, rgba(124,58,237,0.1), transparent);
    border-bottom: 1px solid rgba(255,255,255,0.05);
}

.flow-node .body {
    padding: 12px 16px;
    font-size: 13px;
    color: #cbd5e1;
}
```

### Custom Node Class

```razor
<FlowNode>
    <div class="title special-node-title">My Node</div>
    <div class="body">...</div>
</FlowNode>

<style>
.special-node-title {
    background: linear-gradient(90deg, #7c3aed, #8b5cf6);
    color: white;
}
</style>
```

## Registering Nodes

Register your node types with the graph:

```csharp
protected override void OnInitialized()
{
    graph.RegisterNode<SumNode>();
    graph.RegisterNode<MultiplyNode>();
    graph.RegisterNode<IfElseNode>();
    graph.RegisterNode<CounterNode>();
}
```

## See Also

- [FlowNodeBase](../components/flow-node-base.html) - Base class reference
- [FlowSocket](../components/flow-socket.html) - Socket component
- [FlowExecutionContext](../flow-execution-context.html) - Execution context
- [Styling Guide](./styling-guide.html) - Complete styling reference

