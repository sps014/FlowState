namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for edge removed events
/// </summary>
public class EdgeRemovedEventArgs : EventArgs
{
    public required string EdgeId { get; init; }
}

