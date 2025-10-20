namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for node deselection events
/// </summary>
public class NodeDeselectedEventArgs : EventArgs
{
    /// <summary>
    /// Gets the ID of the node that was deselected
    /// </summary>
    public required string NodeId { get; init; }
}

