namespace FlowStateBlazorServer.Components.Nodes;

using FlowState.Attributes;
using FlowState.Components;

[FlowNode("Input")]
public partial class InputNode
{
    public override ValueTask ExecuteAsync()
    {
        // Input node does not perform any action during execution.
        return ValueTask.CompletedTask;
    }
}