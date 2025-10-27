---
layout: default
title: Serialization
nav_order: 14
---

# Serialization

Save and load complete graph state as JSON. Preserves nodes, edges, positions, and custom data.

## Overview

FlowState provides built-in serialization to save and restore graphs. All node parameters marked with `[Parameter]` are automatically serialized.

## Quick Start

```csharp
// Save
string json = await graph.SerializeAsync();
await File.WriteAllTextAsync("my-graph.json", json);

// Load
string json = await File.ReadAllTextAsync("my-graph.json");
await graph.DeserializeAsync(json);
```

## Data Classes

### GraphData
Complete graph state.

**Properties**:
- `Canvas` (CanvasProperties) - Viewport state
- `Nodes` (List<NodeProperties>) - All nodes
- `Edges` (List<EdgeProperties>) - All edges

### NodeProperties
Node state.

**Properties**:
- `Type` (string) - Fully qualified type name
- `Id` (string) - Node ID
- `X`, `Y` (double) - Position
- `Data` (Dictionary<string, StoredProperty>) - Parameter values

### EdgeProperties
Edge state.

**Properties**:
- `Id` (string) - Edge ID
- `FromNodeId` (string) - Source node
- `ToNodeId` (string) - Target node
- `FromSocketName` (string) - Source socket
- `ToSocketName` (string) - Target socket

### CanvasProperties
Canvas viewport state.

**Properties**:
- `Zoom` (double) - Zoom level
- `OffsetX`, `OffsetY` (double) - Pan offset
- `MinZoom`, `MaxZoom` (double) - Zoom limits
- `IsReadOnly` (bool) - Read-only state

## Serialization Methods

### SerializeAsync
Serializes graph to JSON string.

**Signature**: `ValueTask<string> SerializeAsync()`

```csharp
string json = await graph.SerializeAsync();
Console.WriteLine(json);
```

### GetSerializableObjectAsync
Gets structured graph data.

**Signature**: `ValueTask<GraphData> GetSerializableObjectAsync()`

```csharp
var data = await graph.GetSerializableObjectAsync();
Console.WriteLine($"Graph has {data.Nodes.Count} nodes and {data.Edges.Count} edges");

// Access node data
foreach (var node in data.Nodes)
{
    Console.WriteLine($"Node: {node.Type} at ({node.X}, {node.Y})");
}
```

## Deserialization Methods

### DeserializeAsync (JSON)
Loads graph from JSON string.

**Signature**: `ValueTask DeserializeAsync(string data)`

```csharp
string json = await File.ReadAllTextAsync("graph.json");
await graph.DeserializeAsync(json);
```

### DeserializeAsync (Object)
Loads graph from GraphData object.

**Signature**: `ValueTask DeserializeAsync(GraphData graphData)`

```csharp
GraphData data = GetGraphDataFromDatabase();
await graph.DeserializeAsync(data);
```

## Custom Node Data

All `[Parameter]` properties are automatically serialized:

```csharp
public partial class ConfigNode : FlowNodeBase
{
    [Parameter]
    public string Name { get; set; } = "Default";
    
    [Parameter]
    public int Count { get; set; } = 10;
    
    [Parameter]
    public bool Enabled { get; set; } = true;
    
    // These will all be saved and restored automatically
}
```

Supported parameter types:
- Primitives: `int`, `float`, `double`, `bool`, `string`
- `DateTime`, `TimeSpan`, `Guid`
- Arrays and Lists of supported types
- Custom classes (JSON-serializable)

## Complete Save/Load Example

```razor
@using FlowState.Components
@using FlowState.Models
@using System.IO

<div class="toolbar">
    <button @onclick="SaveGraph">💾 Save</button>
    <button @onclick="LoadGraph">📂 Load</button>
    <button @onclick="ExportGraph">⬇️ Export</button>
    <button @onclick="ImportGraph">⬆️ Import</button>
</div>

<FlowCanvas Graph="graph" Height="calc(100vh - 60px)" Width="100vw">
    <BackgroundContent>
        <FlowBackground class="grid-bg"/>
    </BackgroundContent>
</FlowCanvas>

@code {
    FlowGraph graph = new();
    private string savedData = "{}";

    async Task SaveGraph()
    {
        // Save to memory
        savedData = await graph.SerializeAsync();
        Console.WriteLine("Graph saved to memory");
    }

    async Task LoadGraph()
    {
        // Load from memory
        await graph.DeserializeAsync(savedData);
        Console.WriteLine("Graph loaded from memory");
    }

    async Task ExportGraph()
    {
        // Export to file
        string json = await graph.SerializeAsync();
        await File.WriteAllTextAsync("my-graph.json", json);
        Console.WriteLine("Graph exported to file");
    }

    async Task ImportGraph()
    {
        // Import from file
        if (File.Exists("my-graph.json"))
        {
            string json = await File.ReadAllTextAsync("my-graph.json");
            await graph.DeserializeAsync(json);
            Console.WriteLine("Graph imported from file");
        }
    }
}
```

## Browser Storage (Blazor WASM)

Save to browser localStorage:

```csharp
@inject IJSRuntime JS

async Task SaveToLocalStorage()
{
    string json = await graph.SerializeAsync();
    await JS.InvokeVoidAsync("localStorage.setItem", "myGraph", json);
}

async Task LoadFromLocalStorage()
{
    string? json = await JS.InvokeAsync<string?>("localStorage.getItem", "myGraph");
    if (!string.IsNullOrEmpty(json))
    {
        await graph.DeserializeAsync(json);
    }
}
```

## Database Storage

Save to database:

```csharp
// Save
var graphData = await graph.GetSerializableObjectAsync();
var entity = new GraphEntity
{
    Id = Guid.NewGuid(),
    Name = "My Graph",
    Data = JsonSerializer.Serialize(graphData),
    CreatedAt = DateTime.UtcNow
};
await database.Graphs.AddAsync(entity);
await database.SaveChangesAsync();

// Load
var entity = await database.Graphs.FindAsync(graphId);
if (entity != null)
{
    await graph.DeserializeAsync(entity.Data);
}
```

## JSON Format

Example serialized graph:

```json
{
  "Canvas": {
    "Zoom": 1.0,
    "OffsetX": 0,
    "OffsetY": 0,
    "MinZoom": 0.2,
    "MaxZoom": 2.0,
    "IsReadOnly": false
  },
  "Nodes": [
    {
      "Type": "MyNamespace.InputNode, MyAssembly",
      "Id": "node-123",
      "X": 100,
      "Y": 100,
      "Data": {
        "Value": {
          "Type": "System.Single",
          "Value": 42.5
        }
      }
    }
  ],
  "Edges": [
    {
      "Id": "edge-456",
      "FromNodeId": "node-123",
      "ToNodeId": "node-789",
      "FromSocketName": "Output",
      "ToSocketName": "Input"
    }
  ]
}
```

## Versioning

For graph versioning, add metadata:

```csharp
public class VersionedGraphData
{
    public int Version { get; set; } = 1;
    public DateTime SavedAt { get; set; }
    public string Author { get; set; } = "";
    public GraphData Graph { get; set; } = null!;
}

// Save
var versionedData = new VersionedGraphData
{
    Version = 1,
    SavedAt = DateTime.UtcNow,
    Author = "User",
    Graph = await graph.GetSerializableObjectAsync()
};
string json = JsonSerializer.Serialize(versionedData);

// Load
var versionedData = JsonSerializer.Deserialize<VersionedGraphData>(json);
if (versionedData.Version == 1)
{
    await graph.DeserializeAsync(versionedData.Graph);
}
```

## Migration

Handle breaking changes with migration:

```csharp
async Task LoadWithMigration(string json)
{
    var data = JsonSerializer.Deserialize<GraphData>(json);
    
    // Migrate old node types
    foreach (var node in data.Nodes)
    {
        if (node.Type == "OldNamespace.OldNode, OldAssembly")
        {
            node.Type = "NewNamespace.NewNode, NewAssembly";
        }
    }
    
    await graph.DeserializeAsync(data);
}
```

## Clear Before Load

Deserialization automatically clears the graph:

```csharp
// No need to manually clear
await graph.DeserializeAsync(json);

// Equivalent to:
await graph.ClearAsync();
await graph.DeserializeAsync(json);
```

## Handling Errors

```csharp
try
{
    await graph.DeserializeAsync(json);
}
catch (JsonException ex)
{
    Console.WriteLine($"Invalid JSON: {ex.Message}");
}
catch (Exception ex)
{
    Console.WriteLine($"Load failed: {ex.Message}");
}
```

## See Also

- [FlowGraph](./flow-graph.html) - Serialize/Deserialize methods
- [FlowNodeBase](./components/flow-node-base.html) - Parameter serialization
- [Getting Started](./getting-started.html) - Save/Load example

