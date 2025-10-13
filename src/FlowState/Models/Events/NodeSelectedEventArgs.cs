namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for node selection events
/// </summary>
public class NodeSelectedEventArgs : EventArgs
{
    public required string NodeId { get; init; }
}

