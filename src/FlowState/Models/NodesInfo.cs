using FlowState.Components;
using Microsoft.AspNetCore.Components;

namespace FlowState.Models;


public record NodeInfo
{
    public required string Id { get; init; }
    public required Type NodeType { get; init; }
    public DynamicComponent? Component { get; set; }

    public FlowNodeBase? Instance
    {
        get
        {
            if(Component!=null && Component.Instance is FlowNodeBase fn)
            {
                return fn;
            }
            return null;
        }
    }

    public Dictionary<string, object> Parameters { get; init; } = new Dictionary<string, object>();
}