namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for node removed events
/// </summary>
public class NodeRemovedEventArgs : EventArgs
{
    /// <summary>
    /// Gets the ID of the node that was removed
    /// </summary>
    public required string NodeId { get; init; }
}

