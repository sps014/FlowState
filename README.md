# FlowState

A high-performance node editor for Blazor. Build visual programming tools, node-based workflows, and interactive graph editors with complete styling control.

<img width="1217" height="587" alt="FlowState Demo" src="https://github.com/user-attachments/assets/57d6fecb-5d84-4f17-ad90-cee3cf881f48" />

![Blazor](https://img.shields.io/badge/Blazor-.NET%2010.0-purple?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square) ![NuGet](https://img.shields.io/nuget/v/FlowState?style=flat-square)

## What you get

- **Full customization** - Style everything with regular HTML/CSS, no framework-specific styling
- **High performance** - Handles graphs with hundreds of nodes smoothly
- **Custom nodes** - Create any node type using Blazor components
- **Type safety** - Automatic type checking between connections with custom type conversion
- **Execution engine** - Built-in graph execution with visual progress feedback  
- **Group nodes** - Resizable container nodes to organize your graph
- **Undo/Redo** - Command pattern with unlimited history
- **Serialization** - Save and restore complete graph state
- **Read-only mode** - Lock graphs for presentation
- **Touch support** - Works on desktop and mobile

![Customization Demo](https://github.com/user-attachments/assets/bc1aa472-1c67-4b68-9f12-510a64584abd)

## Installation

```bash
dotnet add package FlowState
```

## Quick Start

Here's a minimal working example:

```razor
@page "/"
@using FlowState.Components
@using FlowState.Models

<FlowCanvas Height="100vh" Width="100vw" Graph="graph">
    <BackgroundContent>
        <FlowBackground class="grid-bg"/>
    </BackgroundContent>
</FlowCanvas>

@code {
    FlowGraph graph = new();

    protected override void OnInitialized() 
    {
        graph.RegisterNode<SumNode>();
    }
}
```

Style the canvas with CSS:

```css
.grid-bg {
    background: #111827;
    background-image: 
        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 100px 100px;
}
```

## Creating Custom Nodes

Making a node is simple. Create a Razor component that inherits `FlowNodeBase`:

**SumNode.razor.cs**
```csharp
using FlowState.Components;
using FlowState.Attributes;
using FlowState.Models.Execution;

namespace YourNamespace;

[FlowNodeMetadata(Category = "Math", Title = "Sum", Icon = "➕")]
public partial class SumNode : FlowNodeBase
{
    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        var a = context.GetInputSocketData<float>("A");
        var b = context.GetInputSocketData<float>("B");
        context.SetOutputSocketData("Result", a + b);
        await ValueTask.CompletedTask;
    }
}
```

**SumNode.razor**
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

That's it. The node will appear in the context menu (right-click on canvas) and you can connect it to other nodes.

## Working with Graphs

**Creating nodes programmatically:**

```csharp
// Create nodes at specific positions
var node1 = await graph.CreateNodeAsync<SumNode>(100, 100, new());
var node2 = await graph.CreateNodeAsync<DisplayNode>(400, 100, new());

// Connect them
await graph.ConnectAsync(node1.Id, node2.Id, "Result", "Input");

// Execute the graph
await graph.ExecuteAsync();
```

**Save and restore:**

```csharp
// Serialize to JSON
string json = await graph.SerializeAsync();
await File.WriteAllTextAsync("graph.json", json);

// Deserialize from JSON
string json = await File.ReadAllTextAsync("graph.json");
await graph.DeserializeAsync(json);
```

**Type conversion for sockets:**

```csharp
// Allow int to connect to float sockets
graph.TypeCompatibiltyRegistry.Register<float>(typeof(int));

// Sockets with type 'object' can connect to anything
<FlowSocket Name="Any" Type="SocketType.Input" T="typeof(object)"/>
```

## Canvas Configuration

Customize the canvas behavior:

```razor
<FlowCanvas Graph="graph"
            Height="100vh"
            Width="100vw"
            IsReadOnly="false"
            MinZoom="0.2"
            MaxZoom="2.0"
            Zoom="1.0"
            PanKey="alt"
            NodeSelectionClass="selected"
            AutoUpdateSocketColors="true"/>
```

## API Reference

**Graph operations:**

```csharp
// Nodes
var node = await graph.CreateNodeAsync<MyNode>(x, y, data);
await graph.RemoveNodeAsync(nodeId);
var node = graph.GetNodeById(nodeId);
graph.RegisterNode<MyNode>();

// Connections
var (edge, error) = await graph.ConnectAsync(fromId, toId, "Out", "In");
await graph.RemoveEdgeAsync(edgeId);

// Execution
await graph.ExecuteAsync();

// Undo/Redo
await graph.CommandManager.UndoAsync();
await graph.CommandManager.RedoAsync();
```

**Node lifecycle hooks:**

**MyNode.razor.cs**
```csharp
using FlowState.Components;
using FlowState.Models.Execution;

public partial class MyNode : FlowNodeBase
{
    // Called before graph execution starts - reset state here
    public override ValueTask BeforeGraphExecutionAsync() 
    {
        // Reset any cached state
        return ValueTask.CompletedTask;
    }

    // Main execution logic
    public override async ValueTask ExecuteAsync(FlowExecutionContext ctx)
    {
        var input = ctx.GetInputSocketData<float>("In");
        ctx.SetOutputSocketData("Out", input * 2);
        await ValueTask.CompletedTask;
    }
}
```

**MyNode.razor**
```razor
@using FlowState.Components
@using FlowState.Models
@inherits FlowNodeBase

<FlowNode>
    <div class="title">My Node</div>
    <div class="body">
        <FlowSocket Name="In" Type="SocketType.Input" T="typeof(float)"/>
        <FlowSocket Name="Out" Type="SocketType.Output" T="typeof(float)"/>
    </div>
</FlowNode>
```

## Events

**Graph events:**

```csharp
graph.NodeAdded += (s, e) => { };
graph.NodeRemoved += (s, e) => { };
graph.EdgeAdded += (s, e) => { };
graph.EdgeRemoved += (s, e) => { };
```

**Canvas events:**

```razor
<FlowCanvas OnCanvasLoaded="..."
            OnNodeMoved="..."
            OnNodeSelected="..."
            OnSelectionChanged="..."
            OnContextMenu="..."
            OnSocketLongPress="..."/>
```

## Advanced Features

**Control panels with zoom/reset buttons:**

Add UI controls for canvas interaction:

```razor
@using FlowState.Components
@using FlowState.Models

<FlowCanvas Graph="graph" Height="100vh" Width="100vw">
    <BackgroundContent>
        <FlowBackground class="grid-bg"/>
    </BackgroundContent>
    <Panels>
        <FlowPanels>
            <!-- Add custom panel buttons here -->
            <div class="panel-group">
                <button class="panel-btn" @onclick="SaveGraph">💾</button>
                <button class="panel-btn" @onclick="LoadGraph">📂</button>
            </div>
        </FlowPanels>
    </Panels>
</FlowCanvas>

@code {
    FlowGraph graph = new();
    
    async Task SaveGraph() => await File.WriteAllTextAsync("graph.json", await graph.SerializeAsync());
    async Task LoadGraph() => await graph.DeserializeAsync(await File.ReadAllTextAsync("graph.json"));
}
```

**Context menu for node creation:**

Add a context menu so users can right-click to create nodes:

```razor
@using FlowState.Components
@using FlowState.Models
@using FlowState.Models.Events

<FlowCanvas Graph="graph" 
            Height="100vh" 
            Width="100vw"
            OnContextMenu="ShowMenu">
    <BackgroundContent>
        <FlowBackground class="grid-bg"/>
    </BackgroundContent>
</FlowCanvas>

<FlowContextMenu @ref="menu" Graph="graph"/>

@code {
    FlowGraph graph = new();
    FlowContextMenu? menu;
    
    protected override void OnInitialized()
    {
        graph.RegisterNode<SumNode>();
        graph.RegisterNode<DisplayNode>();
    }
    
    async Task ShowMenu(CanvasContextMenuEventArgs e) =>
        await menu!.ShowAsync(e.ClientX, e.ClientY, e.X, e.Y);
}
```

**Group nodes:**

Group nodes are resizable containers to organize your graph.

**MyGroupNode.razor.cs**
```csharp
using FlowState.Components;
using FlowState.Attributes;

namespace YourNamespace;

[FlowNodeMetadata(Category = "Layout", Title = "Group", Kind = NodeKind.Group)]
public partial class MyGroupNode : FlowGroupNodeBase
{
    protected override void OnInitialized()
    {
        base.OnInitialized();
        Width = 400;
        Height = 300;
    }
}
```

**MyGroupNode.razor**
```razor
@using FlowState.Components
@inherits FlowGroupNodeBase

<FlowNode>
    <div class="group-title">📦 Group</div>
    <FlowResizeHandle />
</FlowNode>
```

Style group nodes to appear behind other nodes:
```css
.flow-node[kind="Group"] {
    z-index: 1 !important;
    background: rgba(50, 50, 50, 0.5);
    border: 2px dashed rgba(255, 255, 255, 0.3);
}
```

**Execution state management:**

Share data between nodes during execution:

**StateNode.razor.cs**
```csharp
using FlowState.Components;
using FlowState.Models.Execution;

public partial class StateNode : FlowNodeBase
{
    public override async ValueTask ExecuteAsync(FlowExecutionContext ctx)
    {
        // Store and retrieve shared state across all nodes in execution
        ctx.SetState("userCount", 42);
        var count = ctx.GetState<int>("userCount");
        
        // Or use CustomData dictionary directly
        ctx.CustomData["result"] = "computed value";
        var data = ctx.CustomData["result"];
        
        await ValueTask.CompletedTask;
    }
}
```

**StateNode.razor**
```razor
@using FlowState.Components
@inherits FlowNodeBase

<FlowNode>
    <div class="title">State Manager</div>
    <div class="body">
        <FlowSocket Name="Execute" Type="SocketType.Exec" T="typeof(object)"/>
    </div>
</FlowNode>
```

## Examples

Check out the example projects in the repo:
- **Blazor Server** - Full-featured editor with toolbar and custom nodes
- **Blazor WASM** - Lightweight browser-only version
- **Unity themed nodes** - Custom styled nodes (ocean wave renderer, color gradients)

Run them with:
```bash
cd examples/FlowStateBlazorServer
dotnet run
```

## Contributing

Found a bug or want to add a feature? Pull requests are welcome. For major changes, open an issue first.

## License

MIT

---

