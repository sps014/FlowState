namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for nodes cleared events
/// </summary>
public class NodesClearedEventArgs : EventArgs
{
    public int ClearedCount { get; init; }
}

