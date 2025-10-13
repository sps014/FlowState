namespace FlowStateBlazorServer.Components.Nodes;

using FlowState.Attributes;
using FlowState.Components;
using FlowState.Models.Execution;

/// <summary>
/// Node that displays the value it receives
/// </summary>
[FlowNodeMetadata("Watch")]
public partial class WatchNode
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

    public override ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        // Get input value using context API
        var value = context.GetInputSocketData("Input");
        
        if (value == null)
        {
            displayValue = "null";
        }
        else
        {
            displayValue = value.ToString() ?? "null";
        }
        
        // Watch node just displays the value, no output
        StateHasChanged();
        return ValueTask.CompletedTask;
    }
}

