using FlowState.Components;
using Microsoft.AspNetCore.Components;

namespace FlowState.Models;

/// <summary>
/// Contains information about an edge in the flow graph
/// </summary>
public record EdgeInfo
{
    /// <summary>
    /// Gets the unique identifier for the edge
    /// </summary>
    public required string Id { get; init; }
    
    /// <summary>
    /// Gets or sets the dynamic component representing the edge
    /// </summary>
    public DynamicComponent? Component { get; set; }

    /// <summary>
    /// Gets the FlowEdge instance from the component
    /// </summary>
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

    /// <summary>
    /// Gets the parameters for the edge component
    /// </summary>
    public Dictionary<string, object> Parameters { get; init; } = new Dictionary<string, object>();
}