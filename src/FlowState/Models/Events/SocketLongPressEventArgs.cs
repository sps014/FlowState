using FlowState.Components;

namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for socket long press events
/// </summary>
public class SocketLongPressEventArgs : EventArgs
{
    public required FlowSocket Socket { get; init; }
    public required double X { get; init; }
    public required double Y { get; init; }
}

