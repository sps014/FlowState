namespace SharedNodesLibrary.UnityThemedNodes;

using FlowState.Attributes;
using FlowState.Components;
using FlowState.Models;
using FlowState.Models.Execution;
using Microsoft.AspNetCore.Components;
using System.Text;

[FlowNodeMetadata(
    Category = "Ocean Wave",
    Title = "Wave Renderer",
    Description = "Renders animated ocean waves with SVG",
    Icon = "🖼️",
    Order = 3)]
public partial class OceanWaveRendererNode : FlowNodeBase
{
    [Parameter]
    public bool IsPlaying { get; set; } = true;

    [Parameter]
    public string RenderMode { get; set; } = "fill";

    private WaveConfig? currentWave;
    private GradientConfig? currentGradient;

    protected override async Task OnParametersSetAsync()
    {
        await base.OnParametersSetAsync();
    }

    private void ToggleAnimation()
    {
        IsPlaying = !IsPlaying;
        StateHasChanged();
    }

    private void ResetWave()
    {
        IsPlaying = false;
        StateHasChanged();
        
        Task.Delay(10).ContinueWith(_ =>
        {
            IsPlaying = true;
            InvokeAsync(StateHasChanged);
        });
    }

    private string GeneratePreviewPath()
    {
        var wave = currentWave ?? new WaveConfig { Amplitude = 50, Frequency = 0.02f, WaveCount = 3 };
        var sb = new StringBuilder();
        
        sb.Append("M 0 60 L 0 ");
        
        // Generate wave points
        for (int x = 0; x <= 140; x++)
        {
            float y = 30; // Center line
            
            for (int i = 0; i < wave.WaveCount; i++)
            {
                float amplitude = (wave.Amplitude * 0.2f) / (i + 1);
                float frequency = wave.Frequency * 2 * (i + 1);
                float phase = i * (float)Math.PI / 4;
                
                y += (float)Math.Sin(x * frequency + phase) * amplitude;
            }
            
            if (x == 0)
                sb.Append($"{y:F2}");
            else
                sb.Append($" L {x} {y:F2}");
        }
        
        sb.Append(" L 140 60 Z");
        
        return sb.ToString();
    }

    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        // Get input data from connected nodes
        var wave = context.GetInputSocketData<WaveConfig>("WaveConfig");
        if (wave != null)
        {
            currentWave = wave;
        }
        
        var gradient = context.GetInputSocketData<GradientConfig>("GradientConfig");
        if (gradient != null)
        {
            currentGradient = gradient;
        }
        
        // Trigger UI update
        await InvokeAsync(StateHasChanged);
        
        await ValueTask.CompletedTask;
    }
}

