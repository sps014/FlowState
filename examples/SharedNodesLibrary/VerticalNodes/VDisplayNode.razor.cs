namespace SharedNodesLibrary.VerticalNodes;

using FlowState.Attributes;
using FlowState.Components;
using FlowState.Models.Execution;

[FlowNodeMetadata(
    Category = "Vertical",
    Title = "Display",
    Description = "Displays the final value received from the vertical pipeline",
    Icon = "📊",
    Order = 3)]
public partial class VDisplayNode : FlowNodeBase
{
    private string _displayValue = "—";

    public override ValueTask BeforeGraphExecutionAsync()
    {
        _displayValue = "—";
        StateHasChanged();
        return ValueTask.CompletedTask;
    }

    public override ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        var value = context.GetInputSocketData("Input");
        _displayValue = value switch
        {
            null => "null",
            float f => f.ToString("G6"),
            _ => value.ToString() ?? "?"
        };
        StateHasChanged();
        return ValueTask.CompletedTask;
    }
}
