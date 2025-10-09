# FlowState Blazor - Development Plan

## Overview
Visual scripting library for Blazor inspired by ReactFlow/XYFlow, with Razor-based customization and minimal JSInterop for maximum performance.

## Project Goals
- **Pure C# API**: All business logic and node execution in C#
- **Minimal JSInterop**: Only for essential DOM operations (drag, viewport, rendering)
- **Async Everything**: All operations are async/await based
- **Razor Customization**: Fully customizable nodes via Razor templates
- **High Performance**: JavaScript handles DOM, C# handles logic

---

## Current Project Structure

```
FlowState/
├── src/
│   └── FlowState/                    # Main Blazor component library (Razor SDK)
│       ├── wwwroot/
│       │   └── exampleJsInterop.js
│       └── FlowState.csproj
├── examples/
│   └── FlowStateBlazorWasm/          # Blazor WASM demo app
│       ├── Pages/
│       ├── Layout/
│       ├── wwwroot/
│       └── FlowStateBlazorWasm.csproj
└── index.html                        # Reference JavaScript implementation
```

---

## Target Project Structure

```
FlowState/
├── src/
│   └── FlowState/                           # Main library
│       ├── Components/                      # Blazor components
│       │   ├── FlowGraph.razor             # Main graph container
│       │   ├── FlowGraph.razor.cs          # Code-behind
│       │   ├── FlowNode.razor              # Node wrapper component
│       │   ├── FlowEdge.razor              # Edge/connection component
│       │   └── FlowSocket.razor            # Socket/port component
│       │
│       ├── Core/                           # Core abstractions
│       │   ├── Attributes/
│       │   │   ├── FlowNodeDefinitionAttribute.cs
│       │   │   └── FlowSocketAttribute.cs
│       │   ├── Base/
│       │   │   ├── FlowNodeBase.cs         # Base class for all nodes
│       │   │   └── FlowExecutionContext.cs # Execution context
│       │   ├── Models/
│       │   │   ├── FlowNodeDefinition.cs
│       │   │   ├── FlowSocketDefinition.cs
│       │   │   ├── FlowEdgeData.cs
│       │   │   ├── ViewportInfo.cs
│       │   │   └── Point.cs
│       │   ├── Enums/
│       │   │   ├── SocketType.cs           # Input/Output
│       │   │   ├── DataType.cs             # Number, String, Any, etc.
│       │   │   └── FlowTheme.cs            # Dark, Light
│       │   └── Interfaces/
│       │       ├── IFlowGraph.cs
│       │       ├── IFlowNode.cs
│       │       └── IFlowSocket.cs
│       │
│       ├── Services/                       # Core services
│       │   ├── FlowGraphEngine.cs          # Graph execution engine (C#)
│       │   ├── FlowNodeRegistry.cs         # Node type registry
│       │   ├── FlowGraphSerializer.cs      # JSON serialization
│       │   └── FlowGraphJsInterop.cs       # Minimal JS interop
│       │
│       ├── wwwroot/                        # Static assets
│       │   ├── js/
│       │   │   ├── flowgraph-core.js       # Core JS engine (from index.html)
│       │   │   └── flowgraph-interop.js    # Blazor bridge (minimal)
│       │   └── css/
│       │       └── flowgraph.css           # Styles
│       │
│       └── FlowState.csproj
│
├── examples/
│   └── FlowStateBlazorWasm/                # Demo application
│       ├── Nodes/                          # Example node implementations
│       │   ├── NumberNode.razor
│       │   ├── NumberNode.razor.cs
│       │   ├── MathAddNode.razor
│       │   ├── MathAddNode.razor.cs
│       │   ├── IfNode.razor
│       │   ├── IfNode.razor.cs
│       │   └── WatchNode.razor
│       ├── Pages/
│       │   ├── Home.razor                  # Main demo page
│       │   └── Examples/                   # Various examples
│       ├── wwwroot/
│       └── FlowStateBlazorWasm.csproj
│
└── docs/                                   # Documentation
    ├── getting-started.md
    ├── api-reference.md
    ├── node-development.md
    └── examples/
```

---

## Phase 1: Core Foundation (Weeks 1-2)

### 1.1 Core Abstractions & Attributes

**Files to create:**
- `Core/Attributes/FlowNodeDefinitionAttribute.cs`
  - Defines node metadata (Name, Label, Width, Height, Category, Icon, Colors)
  
- `Core/Attributes/FlowSocketAttribute.cs`
  - Defines socket metadata (Type, Name, Label, DataType, Color, MaxConnections)

- `Core/Base/FlowNodeBase.cs`
  - Abstract base class for all nodes (marked `partial` for .razor.cs usage)
  - Extracts definition/sockets from attributes via reflection (OnInitialized)
  - Provides `RenderSockets()`, `RenderSocket()` helper methods for use in .razor files
  - Abstract `ExecuteAsync(FlowExecutionContext)` method
  - **Note**: UI rendering is done in separate `.razor` file (not code-behind)

- `Core/Base/FlowExecutionContext.cs`
  - Provides `GetInput<T>(string name)` and `GetInput<T>(int index)`
  - Provides `GetData<T>(string key)` for internal node data
  - Provides `SetOutput(string name, object value)`
  - Contains NodeId, execution state, CancellationToken

### 1.2 Core Models & Enums

**Files to create:**
- `Core/Models/FlowNodeDefinition.cs` - Node metadata structure
- `Core/Models/FlowSocketDefinition.cs` - Socket metadata structure
- `Core/Models/FlowEdgeData.cs` - Edge data (From, To, Id)
- `Core/Models/ViewportInfo.cs` - Viewport state (X, Y, Scale)
- `Core/Models/Point.cs` - Position (X, Y)
- `Core/Enums/SocketType.cs` - Input, Output
- `Core/Enums/DataType.cs` - Any, Number, String, Boolean, Object, Array, Image, Texture
- `Core/Enums/FlowTheme.cs` - Dark, Light

### 1.3 Core Interfaces

**Files to create:**
- `Core/Interfaces/IFlowGraph.cs` - Main graph interface (all async methods)
- `Core/Interfaces/IFlowNode.cs` - Node interface
- `Core/Interfaces/IFlowSocket.cs` - Socket interface

**Key design principle**: All operations are async, even if they don't need to be, for consistency

---

## Phase 2: Services Layer (Weeks 3-4)

### 2.1 Node Registry

**File**: `Services/FlowNodeRegistry.cs`

**Responsibilities:**
- Register node types via `Dictionary<string, Type>`
- Cache reflection data (attributes, sockets) per type
- Provide `GetNodeDefinition(string typeName)` 
- Provide `CreateNodeInstance(string typeName, string id, Point position)`
- Group nodes by category for context menu

### 2.2 Graph Execution Engine

**File**: `Services/FlowGraphEngine.cs`

**Responsibilities:**
- Topological sort for execution order
- Async execution of all nodes
- Handle conditional branching (if/else nodes)
- Track execution state and results
- Fire execution events
- Handle cancellation via CancellationToken

**Key methods:**
- `ExecuteAsync(CancellationToken)` - Execute entire graph
- `ExecuteNodeAsync(string nodeId, CancellationToken)` - Execute single node
- `ValidateAsync()` - Check for cycles, invalid connections
- `GetExecutionOrderAsync()` - Return topologically sorted nodes

### 2.3 Serialization Service

**File**: `Services/FlowGraphSerializer.cs`

**Responsibilities:**
- Serialize graph to JSON (nodes, edges, viewport)
- Deserialize JSON to graph state
- Support versioning
- Handle node-specific data

**Key methods:**
- `SerializeAsync()` - Returns JSON string
- `DeserializeAsync(string json)` - Restores graph state

### 2.4 Minimal JSInterop Service

**File**: `Services/FlowGraphJsInterop.cs`

**Design principle**: Only cross JSInterop boundary for operations that MUST be in JavaScript

**JSInterop calls (C# → JS):**
- `InitializeAsync(ElementReference)` - Set up JS engine
- `SetViewportAsync(x, y, scale)` - Update viewport
- `GetViewportAsync()` - Get current viewport
- `UpdateNodePositionAsync(nodeId, x, y)` - Update node position in DOM
- `UpdateEdgePathAsync(edgeId, path)` - Update edge SVG path
- `DisposeAsync()` - Clean up

**JS Callbacks (JS → C#):**
- `OnNodeMovedAsync(nodeId, x, y)` - Node dragged
- `OnNodeSelectedAsync(nodeId)` - Node clicked
- `OnEdgeCreatedAsync(fromSocket, toSocket)` - Connection made
- `OnViewportChangedAsync(x, y, scale)` - Pan/zoom changed

**Everything else stays in C#:**
- Node execution
- Data flow
- Validation
- Event handling
- State management

---

## Phase 3: JavaScript Bridge (Weeks 5-6)

### 3.1 Core JavaScript Engine

**File**: `wwwroot/js/flowgraph-core.js`

**Port from index.html:**
- Viewport management (pan, zoom, fit-to-view)
- Node dragging (pointer capture, transform calculations)
- Connection rendering (SVG paths, curves)
- Socket position calculation (mathematical, no getBoundingClientRect during drag)
- Selection management
- Grid rendering

**Key classes:**
- `FlowGraphEngine` - Main engine
- `SocketPositionWatcher` - Fast socket positioning
- `ViewportController` - Pan/zoom/scale
- `ConnectionRenderer` - SVG path generation

### 3.2 Blazor Interop Bridge

**File**: `wwwroot/js/flowgraph-interop.js`

**Responsibilities:**
- Initialize FlowGraphEngine
- Expose minimal API to C#
- Call C# callbacks via DotNetObjectReference
- Handle cleanup

**API surface (exposed to C#):**
```javascript
// Initialize
initialize(containerElement, dotNetRef, options)

// Viewport
setViewport(x, y, scale)
getViewport() → { x, y, scale }

// Node operations
updateNodePosition(nodeId, x, y)
startNodeDrag(nodeId)
endNodeDrag(nodeId)

// Edge operations
updateEdgePath(edgeId, fromX, fromY, toX, toY)

// Selection
selectNode(nodeId)
clearSelection()
getSelectedNodes() → string[]

// Cleanup
dispose()
```

**Callbacks to C# (via dotNetRef):**
```javascript
dotNetRef.invokeMethodAsync('OnNodeMovedAsync', nodeId, x, y)
dotNetRef.invokeMethodAsync('OnNodeSelectedAsync', nodeId)
dotNetRef.invokeMethodAsync('OnEdgeCreatedAsync', edgeData)
dotNetRef.invokeMethodAsync('OnViewportChangedAsync', x, y, scale)
```

---

## Phase 4: Blazor Components (Weeks 7-8)

### 4.1 Main FlowGraph Component

**File**: `Components/FlowGraph.razor` + `.razor.cs`

**Usage:**
```razor
<FlowGraph NodeTypes="nodeTypes" 
           Theme="FlowTheme.Dark"
           SnapToGrid="true"
           GridSize="20"
           OnNodeSelected="HandleNodeSelected"
           OnGraphExecuted="HandleGraphExecuted">
    
    <FlowNodes>
        <FlowNode Type="data.number" Id="n1" X="100" Y="100" />
        <FlowNode Type="math.add" Id="n2" X="350" Y="175" />
    </FlowNodes>
    
    <FlowEdges>
        <FlowEdge From="n1:value" To="n2:a" />
    </FlowEdges>
</FlowGraph>
```

**Parameters:**
- `NodeTypes` - Dictionary<string, Type> for node registration
- `Theme` - Dark/Light
- `SnapToGrid` - Boolean
- `GridSize` - Integer
- Event callbacks for all events

**Responsibilities:**
- Initialize FlowNodeRegistry with NodeTypes
- Initialize FlowGraphEngine
- Initialize FlowGraphJsInterop
- Render graph container
- Manage lifecycle (OnAfterRenderAsync, DisposeAsync)
- Coordinate between C# and JS

### 4.2 FlowNode Component

**File**: `Components/FlowNode.razor`

**Responsibilities:**
- Wrapper for user-defined node components
- Create instance from NodeTypes dictionary
- Pass parameters (Id, Type, Position)
- Render node definition's RenderNodeBody()
- Apply styling (theme, custom classes)

### 4.3 FlowSocket Component

**File**: `Components/FlowSocket.razor`

**Responsibilities:**
- Render socket UI (circle/custom shape)
- Handle connection start/end
- Validate connections (data type matching)
- Apply styling (color, size)

### 4.4 FlowEdge Component

**File**: `Components/FlowEdge.razor`

**Responsibilities:**
- Render SVG connection path
- Apply styling (color, width, animation)
- Handle selection
- Update path when nodes move

---

## Phase 5: Example Nodes (Weeks 9-10)

### 5.1 Basic Nodes

Create example nodes in `examples/FlowStateBlazorWasm/Nodes/`:

**NumberNode.razor + .razor.cs**
- Input field for number
- Output socket
- Icon: 🔢

**MathAddNode.razor + .razor.cs**
- Two input sockets (A, B)
- One output socket (Sum)
- Async execution
- Icon: ➕

**MathMultiplyNode.razor + .razor.cs**
- Two input sockets (A, B)
- One output socket (Product)
- Icon: ✖️

**WatchNode.razor + .razor.cs**
- One input socket
- Display value
- Icon: 👁️

**IfNode.razor + .razor.cs**
- Condition input
- True/False outputs
- Conditional execution
- Icon: ⚡

**SplitNode.razor + .razor.cs**
- One input
- Multiple outputs
- Icon: 🔀

### 5.2 Advanced Nodes

**StringNode.razor + .razor.cs**
- Text input
- String output
- Icon: 📝

**Render3DNode.razor + .razor.cs**
- Complex UI (canvas, sliders, selectors)
- Multiple inputs/outputs
- Custom controls with data-draggable="false"
- Icon: 🎨

**DynamicSocketNode.razor + .razor.cs**
- Runtime socket addition/removal
- Button controls
- State management
- Icon: ⚡

### 5.3 Node Implementation Pattern (Razor + Code-Behind)

Each node uses the **`.razor` + `.razor.cs`** pattern for clean separation:

**NodeName.razor:** (UI Template)
```razor
@inherits FlowNodeBase

<div class="title">🔢 Node Title</div>
<div class="body">
    @* Node-specific UI controls *@
    <input type="number" @bind="Value" @bind:event="oninput" />
    
    @* Sockets auto-rendered from attributes *@
    @RenderSockets(SocketType.Input)
    <div style="height:8px"></div>
    @RenderSockets(SocketType.Output)
</div>
```

**NodeName.razor.cs:** (Logic & Metadata)
```csharp
[FlowNodeDefinition(
    Name = "node.name",
    Label = "Node Label",
    Width = 160,
    Height = 100,
    Category = "Category",
    Description = "Description",
    Icon = "🔢"
)]
public partial class NodeName : FlowNodeBase
{
    // Properties bound to UI
    [Parameter] public double Value { get; set; } = 0;
    
    // Socket definitions via attributes
    [FlowSocket(SocketType.Input, "input", "Input", DataType.Number)]
    public double InputValue { get; set; }
    
    [FlowSocket(SocketType.Output, "output", "Output", DataType.Number)]
    public double OutputValue { get; set; }
    
    // Async execution logic
    protected override async Task ExecuteAsync(FlowExecutionContext context)
    {
        // Get inputs from connected nodes
        InputValue = context.GetInput<double>("input");
        
        // Simulate async work (API call, file I/O, etc.)
        await Task.Delay(100);
        
        // Process data
        OutputValue = InputValue * 2;
        
        // Set outputs for downstream nodes
        context.SetOutput("output", OutputValue);
    }
}
```

**Why this pattern?**
- ✅ Clean separation of UI and logic
- ✅ Standard Blazor component pattern
- ✅ Full Razor syntax support (no RenderTreeBuilder)
- ✅ Better IntelliSense and tooling
- ✅ Easier to maintain and test

---

## Phase 6: Demo Application (Weeks 11-12)

### 6.1 Main Demo Page

**File**: `examples/FlowStateBlazorWasm/Pages/Home.razor`

**Features:**
- Initialize node types dictionary
- Create sample graph
- Execute graph button
- Animation controls
- Save/Load graph
- Readonly mode toggle

**Example:**
```razor
@page "/"
@inject IJSRuntime JS

<FlowGraph @ref="flowGraph" 
           NodeTypes="nodeTypes"
           Theme="FlowTheme.Dark"
           OnGraphExecuted="OnGraphExecuted">
    
    <FlowNodes>
        @* Initial nodes *@
    </FlowNodes>
    
    <FlowEdges>
        @* Initial connections *@
    </FlowEdges>
</FlowGraph>

@code {
    private FlowGraph flowGraph;
    
    private Dictionary<string, Type> nodeTypes = new()
    {
        ["data.number"] = typeof(NumberNode),
        ["math.add"] = typeof(MathAddNode),
        ["math.multiply"] = typeof(MathMultiplyNode),
        ["logic.if"] = typeof(IfNode),
        ["data.watch"] = typeof(WatchNode),
        ["util.split"] = typeof(SplitNode),
        ["render.3d"] = typeof(Render3DNode),
        ["text.string"] = typeof(StringNode),
        ["dynamic.sockets"] = typeof(DynamicSocketNode)
    };
    
    private async Task OnGraphExecuted(GraphExecutedEventArgs e)
    {
        // Handle execution complete
    }
    
    private async Task ExecuteGraph()
    {
        await flowGraph.ExecuteAsync();
    }
}
```

### 6.2 Example Pages

Create additional example pages:
- `Examples/BasicMath.razor` - Simple math operations
- `Examples/ConditionalFlow.razor` - If/else branching
- `Examples/DynamicNodes.razor` - Runtime node creation
- `Examples/CustomStyling.razor` - Themed nodes
- `Examples/ComplexGraph.razor` - Large graph with many nodes

---

## Phase 7: Testing & Polish (Weeks 13-14)

### 7.1 Unit Tests

Create test projects:
- `tests/FlowState.Core.Tests/`
  - Test node execution
  - Test graph validation
  - Test serialization
  - Test execution context

- `tests/FlowState.Blazor.Tests/`
  - Test component rendering
  - Test event handling
  - Test node registry
  - Test async operations

### 7.2 Performance Optimization

**C# Side:**
- Cache reflection data
- Optimize execution order calculation
- Pool objects where possible
- Use ValueTask for hot paths

**JavaScript Side:**
- Use mathematical calculations (no getBoundingClientRect during drag)
- Implement SocketPositionWatcher pattern from index.html
- Use pointer capture for smooth dragging
- Optimize SVG path updates

### 7.3 Documentation

Create comprehensive docs:
- Getting Started guide
- API Reference
- Node Development guide
- Performance best practices
- Migration guide (for those familiar with ReactFlow)

---

## Developer Experience (API Examples)

### Example 1: Simple Math Node (Razor + Code-Behind)

**MathAddNode.razor:**
```razor
@inherits FlowNodeBase

<div class="title">➕ Add</div>
<div class="body">
    @RenderSockets(SocketType.Input)
    <div style="height:8px"></div>
    @RenderSockets(SocketType.Output)
</div>
```

**MathAddNode.razor.cs:**
```csharp
[FlowNodeDefinition(
    Name = "math.add", 
    Label = "Add", 
    Category = "Math", 
    Icon = "➕",
    Width = 180,
    Height = 120
)]
public partial class MathAddNode : FlowNodeBase
{
    [FlowSocket(SocketType.Input, "a", "A", DataType.Number, MaxConnections = 1)]
    public double A { get; set; }
    
    [FlowSocket(SocketType.Input, "b", "B", DataType.Number, MaxConnections = 1)]
    public double B { get; set; }
    
    [FlowSocket(SocketType.Output, "sum", "Sum", DataType.Number, Color = "#f59e0b")]
    public double Sum { get; set; }
    
    protected override async Task ExecuteAsync(FlowExecutionContext context)
    {
        A = context.GetInput<double>("a");
        B = context.GetInput<double>("b");
        
        await Task.Delay(100); // Simulate async work
        
        Sum = A + B;
        context.SetOutput("sum", Sum);
    }
}
```

### Example 2: Using the Graph

```razor
<FlowGraph NodeTypes="nodeTypes" OnGraphExecuted="OnComplete">
    <FlowNodes>
        <FlowNode Type="data.number" Id="n1" X="100" Y="100" />
        <FlowNode Type="math.add" Id="n2" X="300" Y="100" />
    </FlowNodes>
    <FlowEdges>
        <FlowEdge From="n1:value" To="n2:a" />
    </FlowEdges>
</FlowGraph>

@code {
    private Dictionary<string, Type> nodeTypes = new()
    {
        ["data.number"] = typeof(NumberNode),
        ["math.add"] = typeof(MathAddNode)
    };
}
```

### Example 3: Complex Node with Custom UI

**NumberNode.razor:**
```razor
@inherits FlowNodeBase

<div class="title">🔢 Number</div>
<div class="body">
    <input type="number" 
           class="input-box" 
           @bind="Value" 
           @bind:event="oninput"
           placeholder="Enter value" 
           style="width: calc(100% - 10px);" />
    
    <div style="height:8px"></div>
    @RenderSockets(SocketType.Output)
</div>
```

**NumberNode.razor.cs:**
```csharp
[FlowNodeDefinition(
    Name = "data.number",
    Label = "Number",
    Width = 160,
    Height = 100,
    Category = "Data",
    Description = "Outputs a numeric value",
    Icon = "🔢",
    ColorBackground = "linear-gradient(90deg, rgba(59,130,246,0.15), transparent)",
    ColorText = "#3b82f6"
)]
public partial class NumberNode : FlowNodeBase
{
    [Parameter] public double Value { get; set; } = 0;
    
    [FlowSocket(SocketType.Output, "value", "Value", DataType.Number, Color = "deeppink")]
    public double OutputValue { get; set; }
    
    protected override async Task ExecuteAsync(FlowExecutionContext context)
    {
        // Simulate async data loading
        await Task.Delay(100);
        
        OutputValue = Value;
        context.SetOutput("value", OutputValue);
    }
}
```

### Example 4: Node with Advanced Controls

**Render3DNode.razor:**
```razor
@inherits FlowNodeBase

<div class="title">🎮 3D Renderer</div>
<div class="body">
    @RenderSockets(SocketType.Input)
    
    <!-- 3D Canvas -->
    <div style="margin: 8px 0; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; 
                background: linear-gradient(45deg, #1a1a2e, #16213e); height: 120px; position: relative;">
        <canvas width="280" height="110" 
                style="width: 100%; height: 100%; cursor: grab;" 
                data-draggable="false"></canvas>
    </div>
    
    <!-- Control sliders -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin: 8px 0;">
        <div>
            <label style="font-size: 10px;">Rotation X:</label>
            <input type="range" min="0" max="360" 
                   @bind="RotationX" 
                   @bind:event="oninput"
                   data-draggable="false" 
                   style="width: 100%;" />
        </div>
        <div>
            <label style="font-size: 10px;">Rotation Y:</label>
            <input type="range" min="0" max="360" 
                   @bind="RotationY"
                   @bind:event="oninput"
                   data-draggable="false" 
                   style="width: 100%;" />
        </div>
    </div>
    
    @RenderSockets(SocketType.Output)
</div>
```

**Render3DNode.razor.cs:**
```csharp
[FlowNodeDefinition(
    Name = "render.3d",
    Label = "3D Renderer",
    Width = 320,
    Height = 280,
    Category = "Render",
    Icon = "🎨"
)]
public partial class Render3DNode : FlowNodeBase
{
    [Parameter] public double RotationX { get; set; } = 45;
    [Parameter] public double RotationY { get; set; } = 30;
    
    [FlowSocket(SocketType.Input, "mesh", "Mesh Data", DataType.Object)]
    public object MeshData { get; set; }
    
    [FlowSocket(SocketType.Output, "render", "Rendered", DataType.Texture)]
    public object RenderedTexture { get; set; }
    
    protected override async Task ExecuteAsync(FlowExecutionContext context)
    {
        MeshData = context.GetInput<object>("mesh");
        
        // Simulate async 3D rendering
        await Task.Delay(500);
        
        RenderedTexture = $"Rendered with rotation ({RotationX}, {RotationY})";
        context.SetOutput("render", RenderedTexture);
    }
}
```

### Example 5: Programmatic Graph Building

```csharp
// Create nodes
await flowGraph.AddNodeAsync("data.number", "n1", new Point(100, 100));
await flowGraph.AddNodeAsync("math.add", "n2", new Point(300, 100));

// Connect nodes
await flowGraph.AddEdgeAsync("n1:value", "n2:a");

// Execute
await flowGraph.ExecuteAsync();

// Save
var json = await flowGraph.SerializeAsync();

// Load
await flowGraph.DeserializeAsync(json);
```

---

## Key Design Decisions

### 1. Minimal JSInterop
- **Why**: JSInterop is expensive, causes serialization overhead
- **How**: Keep DOM manipulation in JS, business logic in C#
- **What crosses boundary**: Only viewport, drag events, selection

### 2. Async Everything
- **Why**: Consistency, future-proofing, support for real async operations
- **How**: All public methods return Task/ValueTask
- **Benefits**: Smooth UI, cancellation support, easy to add API calls

### 3. Attribute-Based Node Definition
- **Why**: Clean, declarative, familiar to C# developers
- **How**: Reflection at initialization, cached metadata
- **Benefits**: Type-safe, IntelliSense support, compile-time checking

### 4. Razor-Based UI (.razor + .razor.cs Pattern)
- **Why**: Familiar to Blazor developers, full flexibility, clean separation
- **How**: Use standard Blazor component pattern with `.razor` for UI and `.razor.cs` for logic
- **Benefits**: Full Razor syntax, component composition, data binding, IntelliSense support

### 5. Dictionary-Based Registration
- **Why**: Simple, explicit, no magic
- **How**: Pass Dictionary<string, Type> to FlowGraph
- **Benefits**: Clear registration, easy to understand, no surprises

---

## Performance Targets

- **Node drag**: 60fps with 100+ nodes
- **Graph execution**: <100ms for 1000 nodes
- **Serialization**: <50ms for large graphs
- **JSInterop calls**: <10 per second during normal operation
- **Memory**: Efficient pooling, no leaks

---

## Success Metrics

1. **Developer Experience**: Can create custom node in <5 minutes
2. **Performance**: Matches or exceeds ReactFlow performance
3. **Bundle Size**: <100KB for core library
4. **API Surface**: Intuitive, discoverable, well-documented
5. **Compatibility**: Works on all modern browsers, mobile-friendly

---

## Timeline Summary

- **Weeks 1-2**: Core foundation (abstractions, attributes, base classes)
- **Weeks 3-4**: Services layer (registry, engine, serialization, JSInterop)
- **Weeks 5-6**: JavaScript bridge (port from index.html, interop layer)
- **Weeks 7-8**: Blazor components (FlowGraph, FlowNode, FlowSocket, FlowEdge)
- **Weeks 9-10**: Example nodes (all node types from index.html)
- **Weeks 11-12**: Demo application (full-featured example)
- **Weeks 13-14**: Testing, optimization, documentation

**Total**: 14 weeks for production-ready v1.0

---

## Next Steps

1. Set up project structure
2. Implement core abstractions
3. Create first example node (see [NODE_DEVELOPMENT_GUIDE.md](NODE_DEVELOPMENT_GUIDE.md))
4. Validate API design with real usage
5. Iterate based on feedback

---

## Documentation Files

- **[DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)** - This file: Complete development roadmap
- **[NODE_DEVELOPMENT_GUIDE.md](NODE_DEVELOPMENT_GUIDE.md)** - Quick start guide for creating custom nodes

