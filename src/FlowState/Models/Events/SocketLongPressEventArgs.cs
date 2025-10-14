namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for socket long press events
/// </summary>
public class SocketLongPressEventArgs : EventArgs
{
    public required FlowState.Components.FlowSocket Socket { get; init; }
}

