namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for node execution events
/// </summary>
public class NodeExecutionEventArgs : ExecutionEventArgs
{
    public required string NodeId { get; init; }
}

