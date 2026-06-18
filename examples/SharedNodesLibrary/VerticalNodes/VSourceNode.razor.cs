namespace SharedNodesLibrary.VerticalNodes;

using FlowState.Attributes;
using FlowState.Components;
using FlowState.Models.Execution;
using Microsoft.AspNetCore.Components;

[FlowNodeMetadata(
    Category = "Vertical",
    Title = "Source",
    Description = "Emits a numeric value downward through the vertical pipeline",
    Icon = "📤",
    Order = 1)]
public partial class VSourceNode : FlowNodeBase
{
    [Parameter]
    public float Value { get; set; } = 0;

    public override ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        context.SetOutputSocketData("Output", Value);
        return ValueTask.CompletedTask;
    }
}
