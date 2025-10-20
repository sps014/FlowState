namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for node selection events
/// </summary>
public class NodeSelectedEventArgs : EventArgs
{
    /// <summary>
    /// Gets the ID of the node that was selected
    /// </summary>
    public required string NodeId { get; init; }
}

