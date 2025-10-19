namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for canvas context menu events
/// </summary>
public class CanvasContextMenuEventArgs : EventArgs
{
    /// <summary>
    /// X coordinate of the context menu click (in canvas space)
    /// </summary>
    public required double X { get; init; }
    
    /// <summary>
    /// Y coordinate of the context menu click (in canvas space)
    /// </summary>
    public required double Y { get; init; }
    
    /// <summary>
    /// X coordinate of the context menu click (in screen/client space)
    /// </summary>
    public required double ClientX { get; init; }
    
    /// <summary>
    /// Y coordinate of the context menu click (in screen/client space)
    /// </summary>
    public required double ClientY { get; init; }
}

