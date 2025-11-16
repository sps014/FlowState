---
layout: default
title: FlowGraph
nav_order: 10
---

# FlowGraph

Core graph management class. Handles nodes, edges, execution, and serialization.

## Overview

`FlowGraph` is the central class that manages your node graph. It maintains collections of nodes and edges, handles connections, and orchestrates graph execution.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| NodeRegistry | FlowNodeRegistry | Registry for node types |
| CommandManager | CommandManager | Undo/redo command manager |
| TypeCompatibiltyRegistry | TypeCompatibiltyRegistry | Type compatibility rules |
| Nodes | IReadOnlyList<FlowNodeBase> | All nodes in the graph |
| Edges | IReadOnlyList<FlowEdge> | All edges in the graph |
| Canvas | FlowCanvas | Associated canvas component |
| ExecutionFlow | FlowGraphExecution | Execution handler |

## Node Management

### RegisterNode
Registers a node type for use in the graph.

**Signature**: `void RegisterNode<T>() where T : FlowNodeBase`

```csharp
graph.RegisterNode<InputNode>();
graph.RegisterNode<SumNode>();
graph.RegisterNode<OutputNode>();
```

### CreateNodeAsync
Creates a new node at the specified position.

**Signatures**:
- `ValueTask<NodeInfo> CreateNodeAsync<T>(double x, double y, Dictionary<string, object?> data)`
- `ValueTask<NodeInfo> CreateNodeAsync(Type type, double x, double y, Dictionary<string, object?> data)`
- `ValueTask<NodeInfo> CreateNodeAsync(string typeName, double x, double y, Dictionary<string, object?> data)`

```csharp
// Generic type
var node = await graph.CreateNodeAsync<SumNode>(100, 100, []);

// With custom data
var nodeWithData = await graph.CreateNodeAsync<InputNode>(200, 100, new()
{
    ["Value"] = 42
});

// By Type
var nodeByType = await graph.CreateNodeAsync(typeof(SumNode), 300, 100, []);
```

### RemoveNodeAsync
Removes a node and all connected edges.

**Signature**: `ValueTask RemoveNodeAsync(string id)`

```csharp
await graph.RemoveNodeAsync("node-id-123");
```

### RemoveAllNodes
Clears all nodes from the graph.

**Signature**: `void RemoveAllNodes()`

```csharp
graph.RemoveAllNodes();
```

### GetNodeById
Gets a node by its ID.

**Signature**: `FlowNodeBase? GetNodeById(string id)`

```csharp
var node = graph.GetNodeById("node-id-123");
if (node != null)
{
    Console.WriteLine($"Node at ({node.X}, {node.Y})");
}
```

### GetNodeInfoById
Gets node info (including unrendered nodes).

**Signature**: `NodeInfo? GetNodeInfoById(string id)`

```csharp
var nodeInfo = graph.GetNodeInfoById("node-id-123");
```

## Edge Management

### ConnectAsync
Creates a connection between sockets.

**Signatures**:
- `ValueTask<(EdgeInfo? Edge, string? Error)> ConnectAsync(FlowSocket from, FlowSocket to, bool checkDataType = true)`
- `ValueTask<(EdgeInfo? Edge, string? Error)> ConnectAsync(string fromNodeId, string toNodeId, string fromSocketName, string toSocketName, bool checkDataType = true)`

```csharp
// Connect by node IDs and socket names
var (edge, error) = await graph.ConnectAsync(
    "node1-id", 
    "node2-id", 
    "Output", 
    "Input"
);

if (error != null)
{
    Console.WriteLine($"Connection failed: {error}");
}

// Connect by socket references
var fromSocket = node1.GetSocketByName("Output", SocketType.Output);
var toSocket = node2.GetSocketByName("Input", SocketType.Input);
await graph.ConnectAsync(fromSocket!, toSocket!);
```

### RemoveEdgeAsync
Removes an edge.

**Signature**: `ValueTask RemoveEdgeAsync(string id)`

```csharp
await graph.RemoveEdgeAsync("edge-id-123");
```

### RemoveAllEdges
Clears all edges from the graph.

**Signature**: `void RemoveAllEdges()`

```csharp
graph.RemoveAllEdges();
```

### GetEdgeById
Gets an edge by its ID.

**Signature**: `FlowEdge? GetEdgeById(string id)`

```csharp
var edge = graph.GetEdgeById("edge-id-123");
```



## Execution

### ExecuteAsync
Executes the entire graph.

**Signature**: `ValueTask ExecuteAsync(bool branchTracking = true, CancellationToken cancellationToken = default)`

```csharp
// Simple execution
await graph.ExecuteAsync();

// With cancellation
var cts = new CancellationTokenSource();
await graph.ExecuteAsync(true, cts.Token);

// Without branch tracking (execute all nodes)
await graph.ExecuteAsync(branchTracking: false);
```

## Serialization

### SerializeAsync
Serializes the graph to JSON.

**Signature**: `ValueTask<string> SerializeAsync()`

```csharp
string json = await graph.SerializeAsync();
await File.WriteAllTextAsync("graph.json", json);
```

### DeserializeAsync
Deserializes a graph from JSON.

**Signatures**:
- `ValueTask DeserializeAsync(string data)`
- `ValueTask DeserializeAsync(GraphData graphData)`

```csharp
// From JSON string
string json = await File.ReadAllTextAsync("graph.json");
await graph.DeserializeAsync(json);

// From GraphData object
GraphData data = GetGraphData();
await graph.DeserializeAsync(data);
```

### GetSerializableObjectAsync
Gets serializable graph data.

**Signature**: `async ValueTask<GraphData> GetSerializableObjectAsync()`

```csharp
var data = await graph.GetSerializableObjectAsync();
Console.WriteLine($"Graph has {data.Nodes.Count} nodes");
```

### ClearAsync
Clears the entire graph including nodes, edges, and resets canvas.

**Signature**: `ValueTask ClearAsync()`

```csharp
await graph.ClearAsync();
```

## Events

### NodeAdded
Fired when a node is added.

**Type**: `EventHandler<NodeAddedEventArgs>`

```csharp
graph.NodeAdded += (sender, e) =>
{
    Console.WriteLine($"Node added: {e.NodeId} at ({e.X}, {e.Y})");
};
```

### NodeRemoved
Fired when a node is removed.

**Type**: `EventHandler<NodeRemovedEventArgs>`

```csharp
graph.NodeRemoved += (sender, e) =>
{
    Console.WriteLine($"Node removed: {e.NodeId}");
};
```

### EdgeAdded
Fired when an edge is added.

**Type**: `EventHandler<EdgeAddedEventArgs>`

```csharp
graph.EdgeAdded += (sender, e) =>
{
    Console.WriteLine($"Edge: {e.FromNodeId}.{e.FromSocketName} → {e.ToNodeId}.{e.ToSocketName}");
};
```

### EdgeRemoved
Fired when an edge is removed.

**Type**: `EventHandler<EdgeRemovedEventArgs>`

```csharp
graph.EdgeRemoved += (sender, e) =>
{
    Console.WriteLine($"Edge removed: {e.EdgeId}");
};
```

### AllNodesCleared
Fired when all nodes are cleared.

**Type**: `EventHandler<EventArgs>`

```csharp
graph.AllNodesCleared += (sender, e) =>
{
    Console.WriteLine("All nodes cleared");
};
```

### AllEdgesCleared
Fired when all edges are cleared.

**Type**: `EventHandler<EventArgs>`

```csharp
graph.AllEdgesCleared += (sender, e) =>
{
    Console.WriteLine("All edges cleared");
};
```

### ForcedRequestDomStateChanged
Internal event for DOM updates.

**Type**: `EventHandler<EventArgs>`

## Complete Example

```csharp
using FlowState.Models;
using FlowState.Models.Events;

// Create graph
var graph = new FlowGraph();

// Register node types
graph.RegisterNode<InputNode>();
graph.RegisterNode<SumNode>();
graph.RegisterNode<OutputNode>();

// Set up type compatibility
graph.TypeCompatibiltyRegistry.Register<float>(typeof(int));

// Subscribe to events
graph.NodeAdded += (s, e) => Console.WriteLine($"Node added: {e.NodeId}");
graph.EdgeAdded += (s, e) => Console.WriteLine($"Edge added: {e.EdgeId}");

// Create nodes
var input1 = await graph.CreateNodeAsync<InputNode>(50, 100, []);
var input2 = await graph.CreateNodeAsync<InputNode>(50, 200, []);
var sum = await graph.CreateNodeAsync<SumNode>(300, 150, []);
var output = await graph.CreateNodeAsync<OutputNode>(550, 150, []);

// Connect nodes
await graph.ConnectAsync(input1.Id, sum.Id, "Output", "A");
await graph.ConnectAsync(input2.Id, sum.Id, "Output", "B");
await graph.ConnectAsync(sum.Id, output.Id, "Result", "Input");

// Execute
await graph.ExecuteAsync();

// Save
string json = await graph.SerializeAsync();
await File.WriteAllTextAsync("my-graph.json", json);

// Load
string loadedJson = await File.ReadAllTextAsync("my-graph.json");
await graph.ClearAsync();
await graph.DeserializeAsync(loadedJson);

// Undo/Redo
await graph.CommandManager.UndoAsync();
await graph.CommandManager.RedoAsync();
```

## See Also

- [FlowCanvas](./components/flow-canvas.html) - Canvas component
- [FlowExecutionContext](./flow-execution-context.html) - Execution context
- [CommandManager](./command-manager.html) - Undo/redo system
- [Serialization](./serialization.html) - Save/load details

