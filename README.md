# FlowState

A modern, high-performance node-based visual programming library for Blazor applications. Build interactive flow-based editors with custom nodes, real-time execution, and a beautiful theme UI.


<img width="1217" height="587" alt="Image" src="https://github.com/user-attachments/assets/57d6fecb-5d84-4f17-ad90-cee3cf881f48" />

![FlowState Banner](https://img.shields.io/badge/Blazor-.NET%2010.0-purple?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

## ✨ Features

- 🎨 **Fully Customizable UI** - Complete control over styles, colors, and appearance
- 🚀 **High Performance** - Optimized for large graphs with hundreds of nodes
- 🔌 **Custom Nodes** - Easily create your own node types with full Blazor component support
- 🎯 **Type-Safe Connections** - Automatic type checking and conversion for socket connections
- 📊 **Visual Execution Flow** - Real-time visualization of node execution with progress indicators
- 🖱️ **Intuitive Interactions** - Pan, zoom, drag, select, and connect with familiar gestures
- 💾 **Serialization** - Save and load graphs with full state preservation
- 🔐 **Read-Only Mode** - Lock graphs for viewing without editing
- ↩️ **Undo/Redo** - Full command pattern implementation with unlimited undo/redo history

## 📦 Installation

### NuGet Package
```bash
dotnet add package FlowState
```

### From Source
```bash
git clone https://github.com/yourusername/FlowState.git
cd FlowState
dotnet build
```

## 🚀 Quick Start

### 1. Add to your Blazor page

```razor
@page "/flow-editor"
@using FlowState.Components
@using FlowState.Models

<FlowCanvas @ref="canvas" 
            Height="100vh" 
            Width="100vw" 
            Graph="graph">
    <BackgroundContent>
        <FlowBackground class="custom-grid"/>
    </BackgroundContent>
</FlowCanvas>

@code {
    private FlowCanvas? canvas;
    private FlowGraph graph = new();

    protected override void OnInitialized()
    {
        // Register your custom node types
        graph.RegisterNode<MyCustomNode>();
    }
}
```

### 2. Style your canvas

```css
.custom-grid {
    background: #111827;
    background-image: 
        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 100px 100px;
}
```

## 🎯 Creating Custom Nodes

### Basic Node Example

Create a custom node by inheriting from `FlowNodeBase`:

```csharp
// MyCustomNode.razor.cs
using FlowState.Attributes;
using FlowState.Components;
using FlowState.Models.Execution;
using Microsoft.AspNetCore.Components;

[FlowNodeMetadata(
    Category = "Math",
    Title = "Double Value",
    Description = "Doubles the input value",
    Icon = "🔢",
    Order = 1)]
public partial class MyCustomNode : FlowNodeBase
{
    [Parameter]
    public int Value { get; set; } = 0;

    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        // Your execution logic here
        var result = Value * 2;
        context.SetOutputSocketData("Output", result);
        await Task.CompletedTask;
    }
}
```

```razor
<!-- MyCustomNode.razor -->
@using FlowState.Components
@using FlowState.Models
@inherits FlowNodeBase

<FlowNode>
    <div class="title">🔢 My Node</div>
    <div class="body">
        <input type="number" @bind="Value" />
        <FlowSocket Name="Output" 
                    Label="Result" 
                    Type="SocketType.Output" 
                    T="typeof(int)" 
                    OuterColor="#4CAF50" 
                    InnerColor="#8BC34A"/>
    </div>
</FlowNode>
```

### Advanced Node with Multiple Sockets

```csharp
// SumNode.razor.cs
[FlowNodeMetadata(
    Category = "Math",
    Title = "Add Numbers",
    Description = "Adds two numbers together",
    Icon = "➕",
    Order = 2)]
public partial class SumNode : FlowNodeBase
{
    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        var a = context.GetInputSocketData<float>("InputA");
        var b = context.GetInputSocketData<float>("InputB");
        var sum = a + b;
        context.SetOutputSocketData("Output", sum);
        await Task.CompletedTask;
    }
}
```

```razor
<!-- SumNode.razor -->
@using FlowState.Components
@using FlowState.Models
@inherits FlowNodeBase

<FlowNode>
    <div class="title">➕ Sum</div>
    <div class="body">
        <FlowSocket Name="InputA" Label="A" Type="SocketType.Input" T="typeof(float)"/>
        <FlowSocket Name="InputB" Label="B" Type="SocketType.Input" T="typeof(float)"/>
        <FlowSocket Name="Output" Label="Sum" Type="SocketType.Output" T="typeof(float)"/>
    </div>
</FlowNode>
```

## 📚 Example

Here's a full working example with multiple node types:

```razor
@page "/editor"
@using FlowState.Components
@using FlowState.Models
@using FlowState.Models.Events

<div style="display: flex; gap: 10px; padding: 10px;">
    <button @onclick="ExecuteGraph">▶️ Execute</button>
    <button @onclick="SaveGraph">💾 Save</button>
    <button @onclick="LoadGraph">📂 Load</button>
    <button @onclick="ClearGraph">🗑️ Clear</button>
</div>

<FlowCanvas @ref="canvas" 
            Height="calc(100vh - 60px)" 
            Width="100vw" 
            Graph="graph"
            OnCanvasLoaded="OnLoaded">
    <BackgroundContent>
        <FlowBackground class="flow-grid"/>
    </BackgroundContent>
</FlowCanvas>

@code {
    private FlowCanvas? canvas;
    private FlowGraph graph = new();
    private string savedData = "{}";

    protected override void OnInitialized()
    {
        // Register all your custom nodes
        graph.RegisterNode<NumberInputNode>();
        graph.RegisterNode<SumNode>();
        graph.RegisterNode<DisplayNode>();
        
        // Register type conversions if needed
        graph.TypeCompatibiltyRegistry.Register<float>(typeof(int));
    }

    private async Task OnLoaded()
    {
        // Create initial nodes programmatically
        var input1 = await graph.CreateNodeAsync<NumberInputNode>(100, 100, new());
        var input2 = await graph.CreateNodeAsync<NumberInputNode>(100, 200, new());
        var sum = await graph.CreateNodeAsync<SumNode>(400, 150, new());
        var display = await graph.CreateNodeAsync<DisplayNode>(700, 150, new());

        await Task.Delay(100); // Wait for DOM

        // Connect nodes
        await graph.ConnectAsync(input1.Id, sum.Id, "Output", "InputA");
        await graph.ConnectAsync(input2.Id, sum.Id, "Output", "InputB");
        await graph.ConnectAsync(sum.Id, display.Id, "Output", "Input");
    }

    private async Task ExecuteGraph()
    {
        await graph.ExecuteAsync();
    }

    private async Task SaveGraph()
    {
        savedData = await graph.SerializeAsync();
        Console.WriteLine("Graph saved!");
    }

    private async Task LoadGraph()
    {
        await graph.DeserializeAsync(savedData);
        Console.WriteLine("Graph loaded!");
    }

    private async Task ClearGraph()
    {
        await graph.ClearAsync();
    }
}
```

```css
<style>
.flow-grid {
    background: #111827;
    background-image: 
        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 100px 100px;
}

.flow-node .title { 
  font-weight: 600; 
  font-size: 14px; 
  margin-bottom: 8px; 
  color: white;
  padding: 12px 16px 8px;
  background: linear-gradient(90deg, rgba(124,58,237,0.1), transparent);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px 12px 0 0;
}

# play with look of your nodes
.flow-node .body { 
  font-size: 13px; 
  color: #cbd5e1;
  padding: 12px 16px;
}

.flow-node {
  position: absolute;
  min-width: 160px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
  border: 1px solid rgba(255,255,255,0.05);
  box-shadow: 
    0 8px 32px rgba(2,6,23,0.6),
    inset 0 1px 0 rgba(255,255,255,0.05);
  transform-origin: 0 0;
  user-select: none;
  cursor: grab;
  backdrop-filter: blur(8px);
  
  /* PERFORMANCE OPTIMIZATIONS */
  /* GPU acceleration with proper text rendering */
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  
  /* Text rendering optimizations - prevents blur during zoom */
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: auto;
  text-rendering: geometricPrecision;
  
  /* Force subpixel precision for crisp text at any zoom level */
  -webkit-transform: translate3d(0, 0, 0);
  -webkit-perspective: 1000;
  perspective: 1000;
  
  /* CSS containment for better rendering performance */
  contain: layout style paint;
  
  /* Prevent layout thrashing */
  isolation: isolate;
}
</style>
```

## 🎨 Node Styling

Customize your nodes with CSS:

```css
.flow-node {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 12px;
    min-width: 200px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.flow-node .title {
    font-weight: 600;
    color: white;
    margin-bottom: 8px;
}

.flow-node .body {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
```

## 🔌 Socket Types and Colors

```razor
<!-- Input Socket -->
<FlowSocket Name="Input" 
            Label="Value" 
            Type="SocketType.Input" 
            T="typeof(float)"
            OuterColor="#2196F3" 
            InnerColor="#64B5F6"/>

<!-- Output Socket -->
<FlowSocket Name="Output" 
            Label="Result" 
            Type="SocketType.Output" 
            T="typeof(float)"
            OuterColor="#4CAF50" 
            InnerColor="#81C784"/>
```

## ⚙️ Configuration Options

### FlowCanvas Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Graph` | `FlowGraph` | Required | The graph data model |
| `Height` | `string` | `"100%"` | Canvas height (CSS value) |
| `Width` | `string` | `"100%"` | Canvas width (CSS value) |
| `CanZoom` | `bool` | `true` | Enable zoom with mouse wheel |
| `CanPan` | `bool` | `true` | Enable panning |
| `IsReadOnly` | `bool` | `false` | Lock graph for viewing only |
| `MinZoom` | `double` | `0.2` | Minimum zoom level |
| `MaxZoom` | `double` | `2.0` | Maximum zoom level |
| `PanKey` | `string` | `"alt"` | Key for panning (alt/shift/ctrl/meta) |
| `NodeSelectionClass` | `string` | `"selected"` | CSS class for selected nodes |
| `AutoUpdateSocketColors` | `bool` | `false` | Auto-color edges based on socket |

## 📖 API Reference

### FlowGraph Methods

**Node Management**

```csharp
// Create node - Generic (recommended)
NodeInfo node = await graph.CreateNodeAsync<MyNodeType>(x, y, data);

// Create node - By Type
NodeInfo node = await graph.CreateNodeAsync(typeof(MyNodeType), x, y, data);

// Create node - By string type name
NodeInfo node = await graph.CreateNodeAsync("MyNamespace.MyNodeType", x, y, data);

// Optional: suppress event firing
NodeInfo node = await graph.CreateNodeAsync<MyNodeType>(x, y, data, supressEvent: true);

// Remove node
graph.RemoveNode(nodeId);

// Get node by ID
FlowNodeBase? node = graph.GetNodeById(nodeId);
```

**Edge Management**

```csharp
// Connect by node IDs and socket names
(EdgeInfo? edge, string? error) = await graph.ConnectAsync(fromNodeId, toNodeId, "OutputSocket", "InputSocket");

// Connect by socket references
(EdgeInfo? edge, string? error) = await graph.ConnectAsync(fromSocket, toSocket);

// Optional: enable type checking
(EdgeInfo? edge, string? error) = await graph.ConnectAsync(fromNodeId, toNodeId, "Output", "Input", checkDataType: true);

// Remove edge
graph.RemoveEdge(edgeId);
```

**Execution**

```csharp
// Execute the entire graph
await graph.ExecuteAsync();
```

**Serialization**

```csharp
// Save graph to JSON (includes all node [Parameter] properties)
string json = await graph.SerializeAsync();

// Load graph from JSON (restores all node parameters)
await graph.DeserializeAsync(json);

// Clear entire graph
await graph.ClearAsync();
```

> **Note:** All `[Parameter]` properties in your custom nodes are automatically serialized and restored. Node positions, connections, and parameter values are preserved.

**Registration**

```csharp
// Register node type
graph.RegisterNode<MyNodeType>();

// Register type conversion (source → target)
graph.TypeCompatibiltyRegistry.Register<float>(typeof(int));  // int can connect to float
```

### FlowNodeBase Lifecycle

```csharp
public class MyNode : FlowNodeBase
{
    // Called before graph execution starts
    public override ValueTask BeforeGraphExecutionAsync()
    {
        // Reset state, clear previous results
        return ValueTask.CompletedTask;
    }

    // Main execution logic
    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        // Get input data
        var input = context.GetInputSocketData<float>("InputName");
        
        // Process data
        var result = input * 2;
        
        // Set output data
        context.SetOutputSocketData("OutputName", result);
    }
    
    // Called after graph execution completes
    public override ValueTask AfterGraphExecutionAsync()
    {
        // Cleanup, finalize
        return ValueTask.CompletedTask;
    }
}
```

## 🎯 Events

Subscribe to graph events:

```csharp
graph.NodeAdded += (sender, e) => Console.WriteLine($"Node added: {e.NodeId}");
graph.NodeRemoved += (sender, e) => Console.WriteLine($"Node removed: {e.NodeId}");
graph.EdgeAdded += (sender, e) => Console.WriteLine($"Edge added: {e.EdgeId}");
graph.EdgeRemoved += (sender, e) => Console.WriteLine($"Edge removed: {e.EdgeId}");
```

### FlowCanvas Events

All available events with their parameters:

```razor
<FlowCanvas @ref="canvas"
            Graph="graph"
            OnCanvasLoaded="HandleCanvasLoaded"
            OnPanned="HandlePanned"
            OnZoomed="HandleZoomed"
            OnNodeMoved="HandleNodeMoved"
            OnNodeSelected="HandleNodeSelected"
            OnNodeDeselected="HandleNodeDeselected"
            OnSelectionChanged="HandleSelectionChanged"
            OnNotifyNodesCleared="HandleNodesCleared"
            OnEdgeConnectRequest="HandleEdgeConnectRequest"
            OnSocketLongPress="HandleSocketLongPress"
            OnContextMenu="HandleContextMenu"/>
```

**Event Descriptions:**

| Event | Args Type | Description |
|-------|-----------|-------------|
| `OnCanvasLoaded` | `CanvasLoadedEventArgs` | Fires when canvas finishes initial setup |
| `OnPanned` | `PanEventArgs` | Fires when canvas is panned |
| `OnZoomed` | `ZoomEventArgs` | Fires when zoom level changes |
| `OnNodeMoved` | `NodeMovedArgs` | Fires when a node is moved |
| `OnNodeSelected` | `NodeSelectedEventArgs` | Fires when a node is selected |
| `OnNodeDeselected` | `NodeDeselectedEventArgs` | Fires when a node is deselected |
| `OnSelectionChanged` | `SelectionChangedEventArgs` | Fires when selection changes (contains all selected nodes) |
| `OnNotifyNodesCleared` | `NodesClearedEventArgs` | Fires when all nodes are cleared |
| `OnEdgeConnectRequest` | `ConnectRequestArgs` | Fires when edge connection is requested |
| `OnSocketLongPress` | `SocketLongPressEventArgs` | Fires when a socket is long-pressed (1 second) |
| `OnContextMenu` | `CanvasContextMenuEventArgs` | Fires on canvas right-click with X, Y coordinates |

**Example Event Handlers:**

```csharp
private void HandleCanvasLoaded(CanvasLoadedEventArgs e)
{
    Console.WriteLine("Canvas is ready!");
}

private void HandleNodeMoved(NodeMovedArgs e)
{
    Console.WriteLine($"Node {e.NodeId} moved to ({e.X}, {e.Y})");
}

private void HandleSelectionChanged(SelectionChangedEventArgs e)
{
    Console.WriteLine($"Selected nodes: {string.Join(", ", e.SelectedNodeIds)}");
}

private void HandleSocketLongPress(SocketLongPressEventArgs e)
{
    Console.WriteLine($"Socket {e.Socket.Name} long-pressed at ({e.X}, {e.Y})");
}

private void HandleContextMenu(CanvasContextMenuEventArgs e)
{
    Console.WriteLine($"Right-click at canvas: ({e.X}, {e.Y}), client: ({e.ClientX}, {e.ClientY})");
}
```

## 🔧 Advanced Features

### Context Menu for Adding Nodes

FlowState includes a built-in context menu component for adding nodes to the canvas:

```razor
<FlowCanvas @ref="canvas" 
            Graph="graph"
            OnContextMenu="HandleContextMenu">
    <BackgroundContent>
        <FlowBackground/>
    </BackgroundContent>
</FlowCanvas>

<FlowContextMenu @ref="contextMenu" Graph="graph" />

@code {
    FlowCanvas? canvas;
    FlowContextMenu? contextMenu;
    FlowGraph graph = new();

    private async Task HandleContextMenu(CanvasContextMenuEventArgs e)
    {
        if (contextMenu != null)
        {
            await contextMenu.ShowAsync(e.ClientX, e.ClientY, e.X, e.Y);
        }
    }
}
```

The context menu automatically displays all registered nodes grouped by category, with search functionality. Customize appearance using CSS variables:

```css
:root {
    --context-menu-bg: #0b1220;
    --context-menu-border: #94a3b8;
    --node-item-hover-bg: #7c3aed;
}
```

### Undo/Redo

FlowState includes a built-in command manager that tracks all graph modifications and enables unlimited undo/redo operations:

**Automatic Tracking**

The following operations are automatically tracked:
- Node addition and removal
- Edge connection and disconnection
- Graph state changes (via StateSnapshotCommand)

**Basic Usage**

```csharp
@code {
    private FlowGraph graph = new();

    // Undo the last action
    private async Task Undo()
    {
        await graph.CommandManager.UndoAsync();
    }

    // Redo the last undone action
    private async Task Redo()
    {
        await graph.CommandManager.RedoAsync();
    }
}
```

**Notes:**
- Undo/Redo is automatically disabled in read-only mode
- The redo stack is cleared when new commands are executed after an undo
- Use `CommandManager.ClearStacks()` to clear all undo/redo history

### Type Conversion

By default, sockets can only connect if their types match exactly. Use type conversion to allow connections between different socket types:

```csharp
// Allow int sockets to connect to float sockets
graph.TypeCompatibiltyRegistry.Register<float>(typeof(int));

// Allow int sockets to connect to string sockets
graph.TypeCompatibiltyRegistry.Register<string>(typeof(int));

// Now these connections work:
// OutputSocket<int> → InputSocket<float>  ✅
// OutputSocket<int> → InputSocket<string> ✅
```

**Special Case: `object` Type**

Sockets with type `object` can connect to **any** socket type without registration:

```csharp
// Create a universal socket that accepts any type
<FlowSocket Name="Input" Type="SocketType.Input" T="typeof(object)"/>

// This socket can now connect to:
// - OutputSocket<int>    ✅
// - OutputSocket<string> ✅
// - OutputSocket<float>  ✅
// - Any other type       ✅
```

**Example:**

```csharp
// Node A has: Output socket of type int
// Node B has: Input socket of type float
// Without type conversion: Connection fails ❌
// With type conversion: Connection succeeds ✅

graph.TypeCompatibiltyRegistry.Register<float>(typeof(int));
await graph.ConnectAsync(nodeA.Id, nodeB.Id, "IntOutput", "FloatInput");  // Now works!
```

### Execution with Progress

```csharp
public override async ValueTask ExecuteAsync(FlowExecutionContext context)
{
    // Get input data
    var input = context.GetInputSocketData<float>("Input");
    
    // Process
    var result = input * 2;
    
    // Set output data
    context.SetOutputSocketData("Output", result);
    
    await Task.CompletedTask;
}
```

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with ❤️

