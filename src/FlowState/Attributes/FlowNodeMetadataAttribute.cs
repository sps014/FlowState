namespace FlowState.Attributes;

/// <summary>
/// Attribute for defining metadata for flow nodes
/// </summary>
[AttributeUsage(AttributeTargets.Class, Inherited = false, AllowMultiple = false)]
public sealed class FlowNodeMetadataAttribute : Attribute
{
    /// <summary>
    /// Gets or sets the category of the node
    /// </summary>
    public string? Category { get; set; }
    
    /// <summary>
    /// Gets or sets the display title of the node
    /// </summary>
    public string? Title { get; set; }
    
    /// <summary>
    /// Gets or sets the description of the node
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Gets or sets the icon (emoji or text) for the node
    /// </summary>
    public string? Icon { get; set; }
    
    /// <summary>
    /// Gets or sets the display order within the category
    /// </summary>
    public int Order { get; set; } = 0;
}