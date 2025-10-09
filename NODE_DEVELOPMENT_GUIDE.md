# FlowState Node Development Guide

## Quick Start: Creating Your First Node

FlowState uses the standard Blazor `.razor` + `.razor.cs` pattern for maximum clarity and developer experience.

---

## Basic Node Structure

### Step 1: Create the UI Template (`.razor` file)

**MyNode.razor:**
```razor
@inherits FlowNodeBase

<div class="title">🔧 My Node</div>
<div class="body">
    @* Your custom UI here *@
    <input type="text" @bind="MyValue" />
    
    @* Sockets auto-rendered from attributes *@
    @RenderSockets(SocketType.Input)
    <div style="height:8px"></div>
    @RenderSockets(SocketType.Output)
</div>
```

### Step 2: Create the Logic (`.razor.cs` file)

**MyNode.razor.cs:**
```csharp
using FlowState.Core.Base;
using FlowState.Core.Attributes;
using FlowState.Core.Enums;

[FlowNodeDefinition(
    Name = "custom.mynode",
    Label = "My Node",
    Width = 180,
    Height = 120,
    Category = "Custom",
    Description = "My custom node",
    Icon = "🔧"
)]
public partial class MyNode : FlowNodeBase
{
    // UI-bound property
    [Parameter] public string MyValue { get; set; } = "";
    
    // Socket definitions
    [FlowSocket(SocketType.Input, "input", "Input", DataType.String)]
    public string InputData { get; set; }
    
    [FlowSocket(SocketType.Output, "output", "Output", DataType.String)]
    public string OutputData { get; set; }
    
    // Execution logic
    protected override async Task ExecuteAsync(FlowExecutionContext context)
    {
        // Get input from connected node
        InputData = context.GetInput<string>("input");
        
        // Simulate async work (API call, file I/O, etc.)
        await Task.Delay(100);
        
        // Process data
        OutputData = $"{InputData} - {MyValue}";
        
        // Send to downstream nodes
        context.SetOutput("output", OutputData);
    }
}
```

### Step 3: Register the Node

In your Blazor page:

```csharp
@code {
    private Dictionary<string, Type> nodeTypes = new()
    {
        ["custom.mynode"] = typeof(MyNode)
    };
}
```

---

## Complete Examples

### Example 1: Simple Math Node

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
    Icon = "➕"
)]
public partial class MathAddNode : FlowNodeBase
{
    [FlowSocket(SocketType.Input, "a", "A", DataType.Number)]
    public double A { get; set; }
    
    [FlowSocket(SocketType.Input, "b", "B", DataType.Number)]
    public double B { get; set; }
    
    [FlowSocket(SocketType.Output, "sum", "Sum", DataType.Number, Color = "#10b981")]
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

### Example 2: Input Node with UI Control

**NumberNode.razor:**
```razor
@inherits FlowNodeBase

<div class="title">🔢 Number</div>
<div class="body">
    <input type="number" 
           class="input-box" 
           @bind="Value" 
           @bind:event="oninput"
           placeholder="Enter value" />
    
    <div style="height:8px"></div>
    @RenderSockets(SocketType.Output)
</div>
```

**NumberNode.razor.cs:**
```csharp
[FlowNodeDefinition(
    Name = "data.number",
    Label = "Number",
    Category = "Data",
    Icon = "🔢"
)]
public partial class NumberNode : FlowNodeBase
{
    [Parameter] public double Value { get; set; } = 0;
    
    [FlowSocket(SocketType.Output, "value", "Value", DataType.Number)]
    public double OutputValue { get; set; }
    
    protected override async Task ExecuteAsync(FlowExecutionContext context)
    {
        await Task.Delay(50);
        context.SetOutput("value", Value);
    }
}
```

### Example 3: Conditional Logic Node

**IfNode.razor:**
```razor
@inherits FlowNodeBase

<div class="title">⚡ If</div>
<div class="body">
    @RenderSocket("condition")
    <div style="height:8px"></div>
    @RenderSocket("true")
    @RenderSocket("false")
</div>
```

**IfNode.razor.cs:**
```csharp
[FlowNodeDefinition(
    Name = "logic.if",
    Label = "If",
    Category = "Logic",
    Icon = "⚡"
)]
public partial class IfNode : FlowNodeBase
{
    [FlowSocket(SocketType.Input, "condition", "Condition", DataType.Any)]
    public object Condition { get; set; }
    
    [FlowSocket(SocketType.Output, "true", "True", DataType.Any, Color = "#10b981")]
    public object TrueValue { get; set; }
    
    [FlowSocket(SocketType.Output, "false", "False", DataType.Any, Color = "#ef4444")]
    public object FalseValue { get; set; }
    
    protected override async Task ExecuteAsync(FlowExecutionContext context)
    {
        Condition = context.GetInput<object>("condition");
        var isTrue = Convert.ToBoolean(Condition);
        
        await Task.Delay(100);
        
        // Only set the active branch
        if (isTrue)
        {
            context.SetOutput("true", $"TRUE: {Condition}");
        }
        else
        {
            context.SetOutput("false", $"FALSE: {Condition}");
        }
    }
}
```

### Example 4: Complex Node with Multiple Controls

**Render3DNode.razor:**
```razor
@inherits FlowNodeBase

<div class="title">🎮 3D Renderer</div>
<div class="body">
    @RenderSockets(SocketType.Input)
    
    <!-- 3D Preview -->
    <div class="render-preview">
        <canvas width="280" height="110" 
                data-draggable="false"></canvas>
    </div>
    
    <!-- Control Sliders -->
    <div class="controls-grid">
        <div>
            <label>Rotation X:</label>
            <input type="range" min="0" max="360" 
                   @bind="RotationX" 
                   data-draggable="false" />
        </div>
        <div>
            <label>Rotation Y:</label>
            <input type="range" min="0" max="360" 
                   @bind="RotationY"
                   data-draggable="false" />
        </div>
    </div>
    
    <!-- Color Picker -->
    <input type="color" @bind="Color" data-draggable="false" />
    
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
    [Parameter] public string Color { get; set; } = "#10b981";
    
    [FlowSocket(SocketType.Input, "mesh", "Mesh Data", DataType.Object)]
    public object MeshData { get; set; }
    
    [FlowSocket(SocketType.Output, "render", "Rendered", DataType.Texture)]
    public object RenderedTexture { get; set; }
    
    [FlowSocket(SocketType.Output, "stats", "Stats", DataType.Object)]
    public object Stats { get; set; }
    
    protected override async Task ExecuteAsync(FlowExecutionContext context)
    {
        MeshData = context.GetInput<object>("mesh");
        
        // Simulate async 3D rendering
        await Task.Delay(500);
        
        RenderedTexture = $"Rendered with rotation ({RotationX}, {RotationY})";
        Stats = new { fps = 60, triangles = 1000, color = Color };
        
        context.SetOutput("render", RenderedTexture);
        context.SetOutput("stats", Stats);
    }
}
```

---

## API Reference

### FlowNodeDefinitionAttribute

Defines node metadata and appearance.

```csharp
[FlowNodeDefinition(
    Name = "category.nodename",           // Required: Unique identifier
    Label = "Display Name",               // Required: Shown in UI
    Width = 180,                          // Optional: Default 160
    Height = 120,                         // Optional: Default 100
    Category = "Category",                // Optional: For grouping in menus
    Description = "Node description",     // Optional: Tooltip text
    Icon = "🔧",                          // Optional: Emoji or unicode
    ColorBackground = "gradient(...)",    // Optional: CSS background
    ColorText = "#ffffff",                // Optional: Text color
    CustomClass = "my-node-class"         // Optional: CSS class
)]
```

### FlowSocketAttribute

Defines input/output sockets.

```csharp
[FlowSocket(
    SocketType.Input,                     // Required: Input or Output
    "socketName",                         // Required: Unique within node
    "Display Label",                      // Required: Shown in UI
    DataType.Number,                      // Required: Type constraint
    MaxConnections = 1,                   // Optional: -1 = unlimited
    Color = "#10b981",                    // Optional: Socket color
    Size = 16,                            // Optional: Socket size in px
    CustomClass = "my-socket"             // Optional: CSS class
)]
```

### FlowExecutionContext

Access inputs and set outputs during execution.

```csharp
// Get inputs by name
var value = context.GetInput<double>("inputName");

// Get inputs by index (0-based)
var value = context.GetInput<double>(0);

// Get node internal data
var data = context.GetData<string>("key");

// Set outputs by name
context.SetOutput("outputName", value);

// Set outputs by index
context.SetOutput(0, value);

// Access properties
string nodeId = context.NodeId;
CancellationToken token = context.CancellationToken;
```

### Socket Rendering Helpers

```csharp
// Render all sockets of a type
@RenderSockets(SocketType.Input)
@RenderSockets(SocketType.Output)

// Render specific socket by name
@RenderSocket("socketName")
```

---

## Best Practices

### 1. Always Use Async/Await
```csharp
protected override async Task ExecuteAsync(FlowExecutionContext context)
{
    // Even if no async work, use Task.CompletedTask or minimal delay
    await Task.Delay(1);
}
```

### 2. Handle Null Inputs
```csharp
var input = context.GetInput<double?>("input") ?? 0.0;
```

### 3. Use data-draggable="false" for Interactive Controls
```razor
<input type="range" data-draggable="false" />
<button data-draggable="false">Click Me</button>
```

### 4. Separate UI State from Execution State
```csharp
// UI property
[Parameter] public double Value { get; set; }

// Socket property
[FlowSocket(...)]
public double OutputValue { get; set; }
```

### 5. Use Cancellation Tokens for Long Operations
```csharp
protected override async Task ExecuteAsync(FlowExecutionContext context)
{
    await LongRunningOperation(context.CancellationToken);
}
```

---

## Styling Your Nodes

### Custom Node Classes

Apply custom styling via the `CustomClass` attribute:

```csharp
[FlowNodeDefinition(
    Name = "custom.styled",
    CustomClass = "my-custom-node"
)]
```

Then in your CSS:

```css
.my-custom-node {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
}
```

### Socket Styling

```csharp
[FlowSocket(
    SocketType.Output,
    "output",
    "Output",
    DataType.Number,
    Color = "#f59e0b",
    Size = 20,
    CustomClass = "glow-socket"
)]
```

---

## Testing Your Node

### Unit Test Example

```csharp
[Fact]
public async Task MathAddNode_Should_Add_Two_Numbers()
{
    // Arrange
    var node = new MathAddNode();
    var context = new MockFlowExecutionContext();
    context.SetInput("a", 5.0);
    context.SetInput("b", 3.0);
    
    // Act
    await node.ExecuteAsync(context);
    
    // Assert
    var result = context.GetOutput<double>("sum");
    Assert.Equal(8.0, result);
}
```

---

## Common Patterns

### Pattern 1: Data Source Node
- No inputs, only outputs
- User enters data via UI
- Executes immediately on change

### Pattern 2: Transform Node
- Multiple inputs, one output
- Processes and combines data
- Typical math/logic operations

### Pattern 3: Branch Node
- One input, multiple outputs
- Conditional execution
- Only sets active branch outputs

### Pattern 4: Display Node
- One or more inputs, no outputs
- Shows data to user
- End of execution chain

---

## Troubleshooting

### Socket Not Appearing
- Check attribute syntax
- Ensure property is public
- Verify `RenderSockets()` call in .razor file

### Execution Not Triggering
- Verify `ExecuteAsync` is `override`
- Check for exceptions in execution
- Ensure node is connected to graph

### UI Not Updating
- Use `@bind:event="oninput"` for immediate updates
- Call `StateHasChanged()` if needed
- Check if property has `[Parameter]` attribute

---

## Next Steps

1. Create your first node using the basic template
2. Test it in the demo application
3. Experiment with custom UI controls
4. Explore advanced features like dynamic sockets
5. Share your custom nodes with the community!

For more examples, check the `examples/FlowStateBlazorWasm/Nodes/` directory.

