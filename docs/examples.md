---
layout: default
title: Examples
nav_order: 15
---

# Examples

Explore working examples to learn FlowState features and patterns.

## Available Examples

The FlowState repository includes several complete example projects demonstrating different features and styling approaches.

### 1. FlowStateBlazorServer

**Location**: `examples/FlowStateBlazorServer/`

A full-featured Blazor Server application with:
- GraphToolbar with save/load/execute buttons
- Context menu for node creation
- Custom nodes (InputNode, SumNode, IfElseNode, WatchNode, GroupNode)
- Undo/redo functionality
- Read-only mode toggle
- Canvas mode switching (Select/Pan)
- Complete styling with gradient backgrounds

**Key Features Demonstrated**:
- Event handling (OnCanvasLoaded, OnContextMenu, OnSocketLongPress)
- Programmatic node creation and connections
- Graph serialization/deserialization
- Type compatibility (int to float)
- Complete toolbar implementation

**Run It**:
```bash
cd examples/FlowStateBlazorServer
dotnet run
```

Then navigate to `https://localhost:5001`

### 2. FlowStateBlazorWasm

**Location**: `examples/FlowStateBlazorWasm/`

A lightweight Blazor WebAssembly version demonstrating:
- Browser-only operation
- Client-side graph execution
- Minimal dependencies
- Mobile-friendly interface

**Key Features Demonstrated**:
- WASM-specific configuration
- Client-side state management
- Lightweight node implementations

**Run It**:
```bash
cd examples/FlowStateBlazorWasm
dotnet run
```

### 3. SharedNodesLibrary

**Location**: `examples/SharedNodesLibrary/`

A library of reusable nodes and components with two complete viewport examples:

#### GraphViewport.razor
Standard theme with modern glassmorphic styling:
- Dual-grid background (major + minor lines)
- Gradient node titles
- Backdrop blur effects
- Execution progress indicators
- Complete CSS theme

**Demonstrated Patterns**:
- Professional node styling
- Grid background implementation
- Socket organization
- Input element styling

#### GraphViewportUnity.razor
Unity-inspired theme with:
- Custom edge paths (horizontal with rounded corners)
- Solid color background
- Flat node design
- Zoom control panel
- Custom JavaScript for edge rendering

**Demonstrated Patterns**:
- Custom edge path functions
- Panel controls (FlowPanels)
- Unity-style aesthetic
- JavaScript interop

**Custom Nodes**:
- **InputNode** - Numeric input with text field
- **SumNode** - Adds two numbers
- **IfElseNode** - Conditional branching
- **WatchNode** - Displays values
- **GroupNode** - Resizable container

**Unity-Themed Nodes**:
- **WaveParametersNode** - Ocean wave configuration
- **ColorGradientNode** - Color gradient editor
- **OceanWaveRendererNode** - Wave visualization with canvas

**Run It**:
```bash
cd examples/FlowStateBlazorServer
# Then navigate to /unity for Unity theme
dotnet run
```

## Example Comparison

| Feature | BlazorServer | BlazorWasm | SharedNodes |
|---------|-------------|------------|-------------|
| Toolbar | ✓ | Basic | ✓ Advanced |
| Custom Edges | - | - | ✓ |
| Panels | - | - | ✓ |
| Group Nodes | ✓ | - | ✓ |
| Themes | 1 | 1 | 2 |
| Node Types | 5 | 3 | 8 |

## Code Snippets from Examples

### Creating a Graph (from GraphViewport.razor)

```csharp
protected override void OnInitialized()
{
    base.OnInitialized();
    
    // Register nodes
    graph.RegisterNode<InputNode>();
    graph.RegisterNode<IfElseNode>();
    graph.RegisterNode<SumNode>();
    graph.RegisterNode<WatchNode>();
    graph.RegisterNode<GroupNode>();
}

private async Task OnLoaded()
{
    // Set type compatibility
    graph.TypeCompatibiltyRegistry.Register<float>(typeof(int));
    
    // Create nodes
    var input1 = await graph.CreateNodeAsync<InputNode>(50, 80, []);
    var input2 = await graph.CreateNodeAsync<InputNode>(50, 220, []);
    var sumNode = await graph.CreateNodeAsync<SumNode>(350, 150, []);
    
    await Task.Delay(100); // Let UI render
    
    // Connect nodes
    await graph.ConnectAsync(input1.Id, sumNode.Id, "Output", "InputA");
    await graph.ConnectAsync(input2.Id, sumNode.Id, "Output", "InputB");
}
```

### Zoom Controls (from GraphViewportUnity)

```razor
<Panels>
    <FlowPanels>
        <div class="panel-group">
            <button class="panel-btn" @onclick="ZoomIn">+</button>
            <button class="panel-btn" @onclick="ZoomOut">-</button>
            <button class="panel-btn" @onclick="ResetView">Reset</button>
            <div class="zoom-level">@($"{currentZoom:P0}")</div>
        </div>
    </FlowPanels>
</Panels>

@code {
    async Task ZoomIn()
    {
        var props = await canvas!.GetViewportPropertiesAsync();
        await canvas.SetZoomAsync(Math.Min(props.MaxZoom, props.Zoom + 0.1));
    }
}
```

## Learning Path

### 1. Start with Getting Started
Read the [Getting Started](./getting-started.html) guide for the basics.

### 2. Run FlowStateBlazorServer
Explore the standard theme and all features:
```bash
cd examples/FlowStateBlazorServer
dotnet run
```

### 3. Study GraphViewport.razor
Located in `SharedNodesLibrary`, this shows:
- Complete working example
- Professional styling
- All major features

### 4. Explore GraphViewportUnity.razor
Learn advanced customization:
- Custom edge rendering
- Panel controls
- Alternative styling

### 5. Create Your Own
Start building your own nodes and graphs!

## Example Nodes

All example nodes are in `examples/SharedNodesLibrary/Nodes/`:

- **InputNode.razor** - Shows input field implementation
- **SumNode.razor** - Simple math operation
- **IfElseNode.razor** - Conditional logic
- **WatchNode.razor** - Display output values
- **GroupNode.razor** - Resizable container

Study these to understand:
- Node structure (.razor + .razor.cs)
- Socket configuration
- Execution logic
- Parameter handling
- Styling patterns

## Tips for Learning

1. **Start Simple**: Begin with the minimal example from Getting Started
2. **Run Examples**: See features in action
3. **Read the Code**: Study example implementations
4. **Modify Examples**: Change colors, add nodes, experiment
5. **Build Your Own**: Create custom nodes for your use case

## Community Examples

Check the [GitHub repository](https://github.com/sps014/FlowState) for:
- Community contributions
- Additional examples
- Real-world use cases
- Demo videos

## See Also

- [Getting Started](./getting-started.html) - Complete GraphViewport example
- [Custom Nodes](./customization/custom-nodes.html) - Build your own nodes
- [Custom Edges](./customization/custom-edges.html) - Custom edge paths
- [Custom Panels](./customization/custom-panels.html) - Overlay UI controls
- [Styling Guide](./customization/styling-guide.html) - Complete CSS reference

