namespace FlowStateBlazorWasm.Nodes;

using FlowState.Attributes;
using FlowState.Models.Execution;
using Microsoft.AspNetCore.Components;

[FlowNodeMetadata(
    Category = "Input",
    Title = "Number Input",
    Description = "Provides a numeric input value",
    Icon = "🔢",
    Order = 1)]
public partial class InputNode : ExecutableNodeBase
{
    [Parameter]
    public int Value { get; set; }

    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        await ExecuteWithProgressAsync((ctx) =>
        {
            // Set output value using context API
            ctx.SetOutputSocketData("Output", Value);
            
            return ValueTask.CompletedTask;
        }, context);
    }
}