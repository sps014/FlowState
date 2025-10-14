namespace FlowState.Models.Serializable;

public class CanvasProperties
{
    public double OffsetX { get; set; }
    public double OffsetY { get; set; }
    public double Zoom { get; set; } = 1.0;
    public double MinZoom { get; set; } = 0.2;
    public double MaxZoom { get; set; } = 2.0;

    public bool IsReadOnly { get; set; } = false;
}