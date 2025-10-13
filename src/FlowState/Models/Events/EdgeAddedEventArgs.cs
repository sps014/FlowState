namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for edge added events
/// </summary>
public class EdgeAddedEventArgs : EventArgs
{
    public required string EdgeId { get; init; }
    public required string FromNodeId { get; init; }
    public required string ToNodeId { get; init; }
    public required string FromSocketName { get; init; }
    public required string ToSocketName { get; init; }
}

