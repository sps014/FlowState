namespace FlowState.Models.Serializable;

/// <summary>
/// Represents serializable canvas properties
/// </summary>
public class CanvasProperties
{
    /// <summary>
    /// Gets or sets the X offset of the canvas viewport
    /// </summary>
    public double OffsetX { get; set; }
    
    /// <summary>
    /// Gets or sets the Y offset of the canvas viewport
    /// </summary>
    public double OffsetY { get; set; }
    
    /// <summary>
    /// Gets or sets the zoom level
    /// </summary>
    public double Zoom { get; set; } = 1.0;
    
    /// <summary>
    /// Gets or sets the minimum allowed zoom level
    /// </summary>
    public double MinZoom { get; set; } = 0.2;
    
    /// <summary>
    /// Gets or sets the maximum allowed zoom level
    /// </summary>
    public double MaxZoom { get; set; } = 2.0;

    /// <summary>
    /// Gets or sets whether the canvas is in read-only mode
    /// </summary>
    public bool IsReadOnly { get; set; } = false;
}