using FlowState.Components;

namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for socket long press events
/// </summary>
public class SocketLongPressEventArgs : EventArgs
{
    /// <summary>
    /// Gets the socket that was long pressed
    /// </summary>
    public required FlowSocket Socket { get; init; }
    
    /// <summary>
    /// Gets the X coordinate of the long press
    /// </summary>
    public required double X { get; init; }
    
    /// <summary>
    /// Gets the Y coordinate of the long press
    /// </summary>
    public required double Y { get; init; }
}

