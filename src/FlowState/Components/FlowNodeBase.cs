using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace FlowState.Components;

public abstract class FlowNodeBase : ComponentBase, IDisposable
{
    public abstract ValueTask ExecuteAsync();

    public void Dispose()
    {
        
    }
}