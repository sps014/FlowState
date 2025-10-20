namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for edge removed events
/// </summary>
public class EdgeRemovedEventArgs : EventArgs
{
    /// <summary>
    /// Gets the ID of the edge that was removed
    /// </summary>
    public required string EdgeId { get; init; }
}

