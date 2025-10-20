namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for edge added events
/// </summary>
public class EdgeAddedEventArgs : EventArgs
{
    /// <summary>
    /// Gets the ID of the edge that was added
    /// </summary>
    public required string EdgeId { get; init; }
    
    /// <summary>
    /// Gets the ID of the source node
    /// </summary>
    public required string FromNodeId { get; init; }
    
    /// <summary>
    /// Gets the ID of the destination node
    /// </summary>
    public required string ToNodeId { get; init; }
    
    /// <summary>
    /// Gets the name of the source socket
    /// </summary>
    public required string FromSocketName { get; init; }
    
    /// <summary>
    /// Gets the name of the destination socket
    /// </summary>
    public required string ToSocketName { get; init; }
}

