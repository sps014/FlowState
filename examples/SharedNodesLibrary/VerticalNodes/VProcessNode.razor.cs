namespace SharedNodesLibrary.VerticalNodes;

using FlowState.Attributes;
using FlowState.Components;
using FlowState.Models.Execution;
using Microsoft.AspNetCore.Components;

[FlowNodeMetadata(
    Category = "Vertical",
    Title = "Process",
    Description = "Applies a linear transform (value × multiplier + offset) to the incoming value",
    Icon = "⚙️",
    Order = 2)]
public partial class VProcessNode : FlowNodeBase
{
    [Parameter]
    public float Multiplier { get; set; } = 1f;

    [Parameter]
    public float Offset { get; set; } = 0f;

    public override ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        var input = context.GetInputSocketData<float>("Input");
        var result = input * Multiplier + Offset;
        context.SetOutputSocketData("Transformed", result);
        context.SetOutputSocketData("Passthrough", input);
        return ValueTask.CompletedTask;
    }
}
