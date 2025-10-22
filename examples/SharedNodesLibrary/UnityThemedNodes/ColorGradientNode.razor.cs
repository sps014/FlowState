namespace SharedNodesLibrary.UnityThemedNodes;

using FlowState.Attributes;
using FlowState.Components;
using FlowState.Models.Execution;
using Microsoft.AspNetCore.Components;

[FlowNodeMetadata(
    Category = "Ocean Wave",
    Title = "Ocean Colors",
    Description = "Define ocean color gradient",
    Icon = "🎨",
    Order = 2)]
public partial class ColorGradientNode : FlowNodeBase
{
    [Parameter]
    public string SurfaceColor { get; set; } = "#4FC3F7";

    [Parameter]
    public string DeepColor { get; set; } = "#0277BD";

    [Parameter]
    public string FoamColor { get; set; } = "#E1F5FE";

    [Parameter]
    public float Opacity { get; set; } = 0.9f;

    private async Task OnColorChanged()
    {
        // Execute graph when user changes colors
        if (Graph != null && IsRendered)
        {
            await Graph.ExecuteAsync();
        }
    }

    public override ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        var config = new GradientConfig
        {
            SurfaceColor = SurfaceColor,
            DeepColor = DeepColor,
            FoamColor = FoamColor,
            Opacity = Opacity
        };
        
        context.SetOutputSocketData("GradientConfig", config);
        return ValueTask.CompletedTask;
    }
}

public class GradientConfig
{
    public string SurfaceColor { get; set; } = "#4FC3F7";
    public string DeepColor { get; set; } = "#0277BD";
    public string FoamColor { get; set; } = "#E1F5FE";
    public float Opacity { get; set; } = 0.9f;
}

