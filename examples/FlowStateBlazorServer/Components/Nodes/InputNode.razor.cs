namespace FlowStateBlazorServer.Components.Nodes;

using FlowState.Attributes;
using FlowState.Components;
using FlowState.Models.Execution;
using Microsoft.AspNetCore.Components;

[FlowNodeMetadata("Input")]
public partial class InputNode
{

    [Parameter]
    public long Value { get; set; }

    public override ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        // Set output value using context API
        context.SetOutputSocketData("Output", Value);
        
        return ValueTask.CompletedTask;
    }
}