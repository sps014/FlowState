namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for node moved events
/// </summary>
public class NodeMovedArgs : EventArgs
{
    /// <summary>
    /// Gets the ID of the node that was moved
    /// </summary>
    public string NodeId { get; init; }
    
    /// <summary>
    /// Gets the new X coordinate of the node
    /// </summary>
    public double X { get; init; }
    
    /// <summary>
    /// Gets the new Y coordinate of the node
    /// </summary>
    public double Y { get; init; }

    /// <summary>
    /// Initializes a new instance of the NodeMovedArgs class
    /// </summary>
    /// <param name="nodeId">The ID of the node that was moved</param>
    /// <param name="x">The new X coordinate</param>
    /// <param name="y">The new Y coordinate</param>
    public NodeMovedArgs(string nodeId, double x, double y)
    {
        NodeId = nodeId;
        X = x;
        Y = y;
    }
}