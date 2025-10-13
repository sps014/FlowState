namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for execution completion
/// </summary>
public class ExecutionCompletedEventArgs : ExecutionEventArgs
{
    public int ExecutedNodes { get; init; }
    public int TotalNodes { get; init; }
    public Exception? Error { get; init; }
}

