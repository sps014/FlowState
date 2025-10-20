namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for execution completion
/// </summary>
public class ExecutionCompletedEventArgs : ExecutionEventArgs
{
    /// <summary>
    /// Gets the number of nodes that were executed
    /// </summary>
    public int ExecutedNodes { get; init; }
    
    /// <summary>
    /// Gets the total number of nodes in the execution
    /// </summary>
    public int TotalNodes { get; init; }
    
    /// <summary>
    /// Gets the error that occurred during execution, if any
    /// </summary>
    public Exception? Error { get; init; }
}

