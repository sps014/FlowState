namespace SharedNodesLibrary.UnityThemedNodes;

using FlowState.Attributes;
using FlowState.Components;
using FlowState.Models.Execution;
using Microsoft.AspNetCore.Components;

[FlowNodeMetadata(
    Category = "Ocean Wave",
    Title = "Wave Parameters",
    Description = "Controls ocean wave properties",
    Icon = "🌊",
    Order = 1)]
public partial class WaveParametersNode : FlowNodeBase
{
    [Parameter]
    public float Amplitude { get; set; } = 50f;

    [Parameter]
    public float Frequency { get; set; } = 0.02f;

    [Parameter]
    public float Speed { get; set; } = 2.0f;

    [Parameter]
    public int WaveCount { get; set; } = 3;

    private async Task OnParameterChanged()
    {
        // Execute graph when user changes parameters
        if (Graph != null && IsRendered)
        {
            await Graph.ExecuteAsync();
        }
    }

    public override ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        var config = new WaveConfig
        {
            Amplitude = Amplitude,
            Frequency = Frequency,
            Speed = Speed,
            WaveCount = WaveCount
        };
        
        context.SetOutputSocketData("WaveConfig", config);
        return ValueTask.CompletedTask;
    }
}

public class WaveConfig
{
    public float Amplitude { get; set; }
    public float Frequency { get; set; }
    public float Speed { get; set; }
    public int WaveCount { get; set; }
}

