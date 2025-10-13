namespace FlowStateBlazorServer.Components.Nodes;

using FlowState.Attributes;
using FlowState.Components;

/// <summary>
/// Node that displays the value it receives
/// </summary>
[FlowNodeMetadata("Watch")]
public partial class WatchNode
{
    private string displayValue = "No value";

    public override ValueTask ExecuteAsync()
    {
        // Watch node just displays the value, no output
        StateHasChanged();
        return ValueTask.CompletedTask;
    }

    /// <summary>
    /// Sets the value to display
    /// </summary>
    public void SetInput(object? value)
    {
        if (value == null)
        {
            displayValue = "null";
        }
        else
        {
            displayValue = value.ToString() ?? "null";
        }
        
        StateHasChanged();
    }
}

