using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Rendering;
using Microsoft.JSInterop;

namespace FlowState.Components;

public abstract class FlowNodeBase : ComponentBase, IDisposable
{
    [Parameter]
    public int X { get; set; }

    [Parameter]
    public int Y { get; set; }

    public string Id { get; } = Guid.NewGuid().ToString();
    public abstract ValueTask ExecuteAsync();

    [CascadingParameter]
    public FlowNode? FlowNode { get; set; }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        await base.OnAfterRenderAsync(firstRender);

        Console.WriteLine(FlowNode==null);
    }
    public void Dispose()
    {

    }
}