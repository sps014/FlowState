namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for node deselection events
/// </summary>
public class NodeDeselectedEventArgs : EventArgs
{
    public required string NodeId { get; init; }
}

