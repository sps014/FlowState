namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for zoom events
/// </summary>
public class ZoomEventArgs : EventArgs
{
    public double Zoom { get; init; }
    
    /// <summary>
    /// Gets the zoom level as a percentage
    /// </summary>
    public double ZoomPercentage => Zoom * 100;
}

