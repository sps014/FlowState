---
layout: default
title: FlowExecutionContext
nav_order: 11
---

# FlowExecutionContext

Execution context passed to nodes during graph execution. Provides access to input/output data and shared state.

## Overview

`FlowExecutionContext` is passed to every node's `ExecuteAsync` method during graph execution. Use it to read inputs, write outputs, and manage shared state.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| CancellationToken | CancellationToken | Cancellation token for long operations |
| Execution | FlowGraphExecution | Execution handler instance |
| Node | FlowNodeBase | Current node being executed |
| CustomData | Dictionary<string, object?> | Shared data across all nodes |

## Socket Data Methods

### GetInputSocketData
Gets data from an input socket.

**Signatures**:
- `object? GetInputSocketData(string socketName)`
- `T? GetInputSocketData<T>(string socketName)`

```csharp
public override async ValueTask ExecuteAsync(FlowExecutionContext context)
{
    // Get typed input
    var floatValue = context.GetInputSocketData<float>("InputA");
    
    // Get untyped input
    var value = context.GetInputSocketData("InputB");
    
    // Handle optional input
    var optional = context.GetInputSocketData<float?>("Optional") ?? 0f;
    
    await ValueTask.CompletedTask;
}
```

### SetOutputSocketData
Sets data for an output socket.

**Signature**: `void SetOutputSocketData(string socketName, object? value)`

```csharp
public override async ValueTask ExecuteAsync(FlowExecutionContext context)
{
    var result = ComputeResult();
    
    // Set single output
    context.SetOutputSocketData("Result", result);
    
    // Set multiple outputs
    context.SetOutputSocketData("Sum", a + b);
    context.SetOutputSocketData("Product", a * b);
    context.SetOutputSocketData("Average", (a + b) / 2);
    
    await ValueTask.CompletedTask;
}
```

### GetOutputSocketData
Gets data from an output socket.

**Signatures**:
- `object? GetOutputSocketData(string socketName)`
- `T? GetOutputSocketData<T>(string socketName)`

```csharp
// Usually called internally, but available if needed
var previousOutput = context.GetOutputSocketData<float>("Result");
```

## State Management Methods

### GetState
Gets a value from shared execution state.

**Signature**: `T GetState<T>(string key)`

```csharp
public override async ValueTask ExecuteAsync(FlowExecutionContext context)
{
    // Get shared counter
    var counter = context.GetState<int>("globalCounter");
    
    await ValueTask.CompletedTask;
}
```

### SetState
Sets a value in shared execution state.

**Signature**: `void SetState<T>(string key, T value)`

```csharp
public override async ValueTask ExecuteAsync(FlowExecutionContext context)
{
    // Set shared counter
    context.SetState("globalCounter", 42);
    
    // Set complex object
    context.SetState("userData", new UserData { Name = "John" });
    
    await ValueTask.CompletedTask;
}
```

### HasState
Checks if a key exists in execution state.

**Signature**: `bool HasState(string key)`

```csharp
if (context.HasState("cachedResult"))
{
    var result = context.GetState<float>("cachedResult");
}
```

### RemoveState
Removes a key from execution state.

**Signature**: `bool RemoveState(string key)`

```csharp
context.RemoveState("tempData");
```

## Custom Data Dictionary

The `CustomData` dictionary is shared across all nodes in a single execution:

```csharp
public override async ValueTask ExecuteAsync(FlowExecutionContext context)
{
    // Store data
    context.CustomData["userId"] = 123;
    context.CustomData["timestamp"] = DateTime.Now;
    
    // Retrieve data
    if (context.CustomData.TryGetValue("userId", out var userId))
    {
        Console.WriteLine($"User ID: {userId}");
    }
    
    await ValueTask.CompletedTask;
}
```

## Cancellation Support

Check cancellation token for long-running operations:

```csharp
public override async ValueTask ExecuteAsync(FlowExecutionContext context)
{
    for (int i = 0; i < 1000; i++)
    {
        // Check if cancelled
        if (context.CancellationToken.IsCancellationRequested)
        {
            break;
        }
        
        // Do work
        await ProcessItemAsync(i);
    }
}
```

## Complete Examples

### Simple Math Node

```csharp
[FlowNodeMetadata(Title = "Multiply", Category = "Math")]
public partial class MultiplyNode : FlowNodeBase
{
    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        // Get inputs
        var a = context.GetInputSocketData<float>("A");
        var b = context.GetInputSocketData<float>("B");
        
        // Calculate
        var result = a * b;
        
        // Set output
        context.SetOutputSocketData("Result", result);
        
        await ValueTask.CompletedTask;
    }
}
```

### Node with State

```csharp
[FlowNodeMetadata(Title = "Accumulator", Category = "Utility")]
public partial class AccumulatorNode : FlowNodeBase
{
    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        // Get or initialize accumulator
        var total = context.GetState<float>("accumulatorTotal");
        
        // Get input and add to total
        var value = context.GetInputSocketData<float>("Value");
        total += value;
        
        // Save new total
        context.SetState("accumulatorTotal", total);
        
        // Output current total
        context.SetOutputSocketData("Total", total);
        
        await ValueTask.CompletedTask;
    }
}
```

### Node with Custom Data

```csharp
[FlowNodeMetadata(Title = "Logger", Category = "Debug")]
public partial class LoggerNode : FlowNodeBase
{
    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        var message = context.GetInputSocketData<string>("Message");
        
        // Get or create log list in CustomData
        if (!context.CustomData.ContainsKey("logs"))
        {
            context.CustomData["logs"] = new List<string>();
        }
        
        var logs = (List<string>)context.CustomData["logs"]!;
        logs.Add($"[{DateTime.Now:HH:mm:ss}] {message}");
        
        // Output log count
        context.SetOutputSocketData("Count", logs.Count);
        
        await ValueTask.CompletedTask;
    }
}
```

### Async Operation with Cancellation

```csharp
[FlowNodeMetadata(Title = "HTTP Fetch", Category = "Network")]
public partial class HttpFetchNode : FlowNodeBase
{
    [Inject]
    private HttpClient Http { get; set; } = null!;

    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        var url = context.GetInputSocketData<string>("URL");
        
        try
        {
            // Use cancellation token
            var response = await Http.GetStringAsync(url, context.CancellationToken);
            
            context.SetOutputSocketData("Data", response);
            context.SetOutputSocketData("Success", true);
        }
        catch (OperationCanceledException)
        {
            context.SetOutputSocketData("Success", false);
            context.SetOutputSocketData("Error", "Operation cancelled");
        }
        catch (Exception ex)
        {
            context.SetOutputSocketData("Success", false);
            context.SetOutputSocketData("Error", ex.Message);
        }
    }
}
```

## State vs CustomData

**Use State methods** when:
- You want type-safe access
- You're storing simple values
- You prefer convenience methods

**Use CustomData** when:
- You need dynamic key access
- You're storing complex objects
- You want direct dictionary access

```csharp
// State methods (type-safe, convenient)
context.SetState("count", 42);
var count = context.GetState<int>("count");

// CustomData (flexible, direct)
context.CustomData["count"] = 42;
var count = (int)context.CustomData["count"]!;
```

## See Also

- [FlowNodeBase](./components/flow-node-base.html) - Base node class with ExecuteAsync
- [FlowGraph](./flow-graph.html) - Graph execution
- [Custom Nodes](./customization/custom-nodes.html) - Creating nodes with execution logic

