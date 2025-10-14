namespace FlowStateBlazorServer.Components.Nodes;

using FlowState.Attributes;
using FlowState.Models.Execution;
using Microsoft.AspNetCore.Components;

[FlowNodeMetadata("Input")]
public partial class InputNode : ExecutableNodeBase
{
    [Parameter]
    public int Value { get; set; }

    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        await ExecuteWithProgressAsync(async (ctx) =>
        {
            // Set output value using context API
            ctx.SetOutputSocketData("Output", Value);
        }, context);
    }
}