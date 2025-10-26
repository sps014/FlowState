namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for zoom events
/// </summary>
public class ZoomEventArgs : EventArgs
{
    /// <summary>
    /// Gets the current zoom level
    /// </summary>
    public double Zoom { get; init; }
}

