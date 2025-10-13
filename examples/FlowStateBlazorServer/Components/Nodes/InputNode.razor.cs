namespace FlowStateBlazorServer.Components.Nodes;

using FlowState.Attributes;
using FlowState.Components;
using Microsoft.AspNetCore.Components;

[FlowNodeMetadata("Input")]
public partial class InputNode
{

    [Parameter]
    public long Value { get; set; }

    public override ValueTask ExecuteAsync()
    {
        // Input node does not perform any action during execution.
        return ValueTask.CompletedTask;
    }
}