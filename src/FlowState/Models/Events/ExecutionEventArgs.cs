namespace FlowState.Models.Events;

/// <summary>
/// Base event arguments for execution events
/// </summary>
public class ExecutionEventArgs : EventArgs
{
    /// <summary>
    /// Gets the timestamp when the event occurred
    /// </summary>
    public DateTime Timestamp { get; init; }
}

