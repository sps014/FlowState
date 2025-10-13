namespace FlowState.Models.Events;

/// <summary>
/// Base event arguments for execution events
/// </summary>
public class ExecutionEventArgs : EventArgs
{
    public DateTime Timestamp { get; init; }
}

