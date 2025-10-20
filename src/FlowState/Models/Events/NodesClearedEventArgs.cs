namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for nodes cleared events
/// </summary>
public class NodesClearedEventArgs : EventArgs
{
    /// <summary>
    /// Gets the number of nodes that were cleared
    /// </summary>
    public int ClearedCount { get; init; }
}

