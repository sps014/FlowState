namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for node execution errors
/// </summary>
public class NodeExecutionErrorEventArgs : NodeExecutionEventArgs
{
    public required Exception Error { get; init; }
}

