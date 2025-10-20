using FlowState.Components;

namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for node added events
/// </summary>
public class NodeAddedEventArgs : EventArgs
{
    /// <summary>
    /// Gets the ID of the node that was added
    /// </summary>
    public required string NodeId { get; init; }
    
    /// <summary>
    /// Gets the type of the node that was added
    /// </summary>
    public required Type NodeType { get; init; }
    
    /// <summary>
    /// Gets the X coordinate of the node
    /// </summary>
    public double X { get; init; }
    
    /// <summary>
    /// Gets the Y coordinate of the node
    /// </summary>
    public double Y { get; init; }
}

