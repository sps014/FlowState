---
layout: default
title: Type Compatibility
nav_order: 12
---

# Type Compatibility

Manage socket type compatibility rules. Allow different types to connect when appropriate.

## Overview

`TypeCompatibiltyRegistry` allows you to define which socket types can connect to each other beyond exact type matches.

## Default Behavior

By default, sockets can only connect if:
1. Their types match exactly (e.g., `float` to `float`)
2. The target socket accepts `object` type (universal socket)

## Methods

### Register
Registers compatible types for a target type.

**Signatures**:
- `void Register<T>(params Type[] toTypes)`
- `void Register(string fromType, params IEnumerable<string> toTypes)`

```csharp
// Allow int to connect to float sockets
graph.TypeCompatibiltyRegistry.Register<float>(typeof(int));

// Allow multiple types
graph.TypeCompatibiltyRegistry.Register<float>(typeof(int), typeof(double));
```

### IsCompatible
Checks if two types are compatible.

**Signatures**:
- `bool IsCompatible(string fromType, string toType)`
- `bool IsCompatible(Type fromType, Type toType)`

```csharp
var compatible = graph.TypeCompatibiltyRegistry.IsCompatible(typeof(int), typeof(float));
```

## Common Patterns

### Numeric Compatibility

Allow all numeric types to connect:

```csharp
// Int can connect to float
graph.TypeCompatibiltyRegistry.Register<float>(typeof(int));

// Float can connect to double
graph.TypeCompatibiltyRegistry.Register<double>(typeof(float));

// Int can connect to double
graph.TypeCompatibiltyRegistry.Register<double>(typeof(int));
```

### String Conversion

Allow objects to connect to string sockets:

```csharp
graph.TypeCompatibiltyRegistry.Register<string>(
    typeof(int),
    typeof(float),
    typeof(bool),
    typeof(object)
);
```

### Boolean Compatibility

Allow numeric types to connect to bool (0 = false, non-zero = true):

```csharp
graph.TypeCompatibiltyRegistry.Register<bool>(
    typeof(int),
    typeof(float)
);
```

## Universal Sockets

Use `typeof(object)` for sockets that accept any type:

```razor
<FlowSocket Name="AnyInput" 
            Type="SocketType.Input" 
            T="typeof(object)"/>
```

This socket can receive connections from any output socket type.

## Complete Example

```csharp
using FlowState.Models;

var graph = new FlowGraph();

// Set up comprehensive type compatibility
var registry = graph.TypeCompatibiltyRegistry;

// Numeric types
registry.Register<float>(typeof(int), typeof(byte), typeof(short));
registry.Register<double>(typeof(float), typeof(int));
registry.Register<decimal>(typeof(float), typeof(int), typeof(double));

// String conversions
registry.Register<string>(
    typeof(int),
    typeof(float),
    typeof(double),
    typeof(bool),
    typeof(DateTime)
);

// Boolean conversions
registry.Register<bool>(typeof(int), typeof(float));

// Now these connections will work:
// int → float ✓
// float → double ✓
// int → string ✓
// float → bool ✓
```

## Practical Example

```csharp
@using FlowState.Models

@code {
    FlowGraph graph = new();

    protected override void OnInitialized()
    {
        // Allow int values to connect to float sockets
        graph.TypeCompatibiltyRegistry.Register<float>(typeof(int));
        
        // Register nodes
        graph.RegisterNode<IntInputNode>();   // Outputs int
        graph.RegisterNode<FloatMathNode>();  // Expects float input
        
        // This connection will now work:
        // IntInputNode.Output (int) → FloatMathNode.Input (float)
    }
}
```

## Custom Type Example

For custom types, use the class name or full type name:

```csharp
// Custom class
public class Vector3
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Z { get; set; }
}

// Allow Vector3 to connect to Position socket
graph.TypeCompatibiltyRegistry.Register<Position>(typeof(Vector3));
```

## Type Names

When working with string-based registration:

```csharp
// By type name
registry.Register("System.Single", new[] { "System.Int32" });

// Or use nameof for built-in types
registry.Register(
    typeof(float).ToString(), 
    new[] { typeof(int).ToString() }
);
```

## Checking Compatibility in Code

```csharp
var fromType = typeof(int);
var toType = typeof(float);

if (graph.TypeCompatibiltyRegistry.IsCompatible(fromType, toType))
{
    Console.WriteLine($"{fromType.Name} can connect to {toType.Name}");
}
else
{
    Console.WriteLine($"{fromType.Name} cannot connect to {toType.Name}");
}
```

## Bidirectional Compatibility

Compatibility is directional. If you want both directions, register both:

```csharp
// int → float
graph.TypeCompatibiltyRegistry.Register<float>(typeof(int));

// float → int (with potential data loss)
graph.TypeCompatibiltyRegistry.Register<int>(typeof(float));
```

## Validation During Connection

Type compatibility is checked during `ConnectAsync`:

```csharp
var (edge, error) = await graph.ConnectAsync(
    fromNodeId, 
    toNodeId, 
    "Output",    // int type
    "Input",     // float type
    checkDataType: true  // Enable type checking
);

if (error != null)
{
    Console.WriteLine($"Connection failed: {error}");
    // Error: "Incompatible Data Types System.Int32->System.Single"
    // Unless compatibility is registered
}
```

## Disable Type Checking

To allow any connection regardless of type:

```csharp
await graph.ConnectAsync(
    fromNodeId, 
    toNodeId, 
    "Output", 
    "Input",
    checkDataType: false  // Skip type checking
);
```

Or set it globally on the canvas:

```razor
<FlowCanvas Graph="graph" 
            EdgeShouldMatchDataType="false"
            ...>
```

## See Also

- [FlowSocket](./components/flow-socket.html) - Socket type parameter
- [FlowGraph](./flow-graph.html) - ConnectAsync method
- [Custom Sockets](./customization/custom-sockets.html) - Socket customization

