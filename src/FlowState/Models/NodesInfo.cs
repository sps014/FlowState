using FlowState.Components;
using Microsoft.AspNetCore.Components;

namespace FlowState.Models;

/// <summary>
/// Contains information about a node in the flow graph
/// </summary>
public record NodeInfo
{
    /// <summary>
    /// Gets the unique identifier for the node
    /// </summary>
    public required string Id { get; init; }
    
    /// <summary>
    /// Gets the type of the node
    /// </summary>
    public required Type NodeType { get; init; }
    
    /// <summary>
    /// Gets or sets the dynamic component representing the node
    /// </summary>
    public DynamicComponent? Component { get; set; }

    /// <summary>
    /// Gets the FlowNodeBase instance from the component
    /// </summary>
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

    /// <summary>
    /// Gets the parameters for the node component
    /// </summary>
    public Dictionary<string, object?> Parameters { get; init; } = new();
}