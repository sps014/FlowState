using FlowState.Models;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Rendering;
using Microsoft.JSInterop;

namespace FlowState.Components;

public abstract class FlowNodeBase : ComponentBase, IDisposable
{
    [Parameter]
    public double X { get; set; }

    [Parameter]
    public double Y { get; set; }

    public string Id { get; } = Guid.NewGuid().ToString();
    public abstract ValueTask ExecuteAsync();

    [Parameter]
    public FlowGraph? Graph { get; set; }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        await base.OnAfterRenderAsync(firstRender);
    }
    public void Dispose()
    {

    }
}