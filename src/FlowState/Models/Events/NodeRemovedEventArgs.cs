namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for node removed events
/// </summary>
public class NodeRemovedEventArgs : EventArgs
{
    public required string NodeId { get; init; }
}

