namespace FlowStateBlazorServer.Components.Nodes;

using FlowState.Attributes;
using FlowState.Models.Execution;

/// <summary>
/// Node that displays the value it receives
/// </summary>
[FlowNodeMetadata("Watch")]
public partial class WatchNode : ExecutableNodeBase
{
    private string displayValue = "No value";

    /// <summary>
    /// Reset the display value before each graph execution
    /// </summary>
    public override ValueTask BeforeGraphExecutionAsync()
    {
        displayValue = "No value";
        StateHasChanged();
        return ValueTask.CompletedTask;
    }

    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        await ExecuteWithProgressAsync(async (ctx) =>
        {
            // Get input value using context API
            var value = ctx.GetInputSocketData("Input");
            
            if (value == null)
            {
                displayValue = "null";
            }
            else
            {
                displayValue = value.ToString() ?? "null";
            }
        }, context);
    }
}

