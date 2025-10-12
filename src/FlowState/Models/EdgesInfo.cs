using FlowState.Components;
using Microsoft.AspNetCore.Components;

namespace FlowState.Models;


public record EdgeInfo
{
    public required string Id { get; init; }
    public DynamicComponent? Component { get; set; }

    public FlowEdge? Instance
    {
        get
        {
            if(Component!=null && Component.Instance is FlowEdge fn)
            {
                return fn;
            }
            return null;
        }
    }

    public Dictionary<string, object> Parameters { get; init; } = new Dictionary<string, object>();
}