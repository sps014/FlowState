namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for node execution events
/// </summary>
public class NodeExecutionEventArgs : ExecutionEventArgs
{
    /// <summary>
    /// Gets the ID of the node that was executed
    /// </summary>
    public required string NodeId { get; init; }
}

