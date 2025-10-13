namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for canvas loaded events
/// </summary>
public class CanvasLoadedEventArgs : EventArgs
{
    public double Zoom { get; init; }
    public double MinZoom { get; init; }
    public double MaxZoom { get; init; }
}

