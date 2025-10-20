namespace FlowState.Models.Dom;

/// <summary>
/// Represents a rectangle in the DOM coordinate system
/// </summary>
public class DOMRect
{
    /// <summary>
    /// Gets or sets the left coordinate
    /// </summary>
    public double Left { get; set; }
    
    /// <summary>
    /// Gets or sets the top coordinate
    /// </summary>
    public double Top { get; set; }
    
    /// <summary>
    /// Gets or sets the right coordinate
    /// </summary>
    public double Right { get; set; }
    
    /// <summary>
    /// Gets or sets the bottom coordinate
    /// </summary>
    public double Bottom { get; set; }
    
    /// <summary>
    /// Gets or sets the width
    /// </summary>
    public double Width { get; set; }
    
    /// <summary>
    /// Gets or sets the height
    /// </summary>
    public double Height { get; set; }
}
