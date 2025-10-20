namespace FlowState.Models.Serializable;

/// <summary>
/// Represents serializable graph data including canvas, nodes, and edges
/// </summary>
public class GraphData
{
    /// <summary>
    /// Gets or sets the canvas properties
    /// </summary>
    public CanvasProperties Canvas { get; set; } = new();
    
    /// <summary>
    /// Gets or sets the list of node properties
    /// </summary>
    public List<NodeProperties> Nodes { get; set; } = new();
    
    /// <summary>
    /// Gets or sets the list of edge properties
    /// </summary>
    public List<EdgeProperties> Edges { get; set; } = new();
}