namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for canvas loaded events
/// </summary>
public class CanvasLoadedEventArgs : EventArgs
{
    /// <summary>
    /// Gets the current zoom level
    /// </summary>
    public double Zoom { get; init; }
    
    /// <summary>
    /// Gets the minimum allowed zoom level
    /// </summary>
    public double MinZoom { get; init; }
    
    /// <summary>
    /// Gets the maximum allowed zoom level
    /// </summary>
    public double MaxZoom { get; init; }
}

