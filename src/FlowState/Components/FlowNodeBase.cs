using Microsoft.AspNetCore.Components;
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

    public void Dispose()
    {

    }
}