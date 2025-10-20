namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for node execution errors
/// </summary>
public class NodeExecutionErrorEventArgs : NodeExecutionEventArgs
{
    /// <summary>
    /// Gets the error that occurred during node execution
    /// </summary>
    public required Exception Error { get; init; }
}

