namespace FlowState.Models;

/// <summary>
/// Represents a node definition with metadata for display in context menus
/// </summary>
public class NodeDefinition
{
    /// <summary>
    /// Gets or sets the type of the node
    /// </summary>
    public required Type NodeType { get; set; }
    
    /// <summary>
    /// Gets or sets the name of the node
    /// </summary>
    public required string Name { get; set; }
    
    /// <summary>
    /// Gets or sets the display title of the node
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Gets or sets the description of the node
    /// </summary>
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Gets or sets the category of the node
    /// </summary>
    public string Category { get; set; } = "General";
    
    /// <summary>
    /// Gets or sets the icon for the node
    /// </summary>
    public string Icon { get; set; } = "⚙️";
    
    /// <summary>
    /// Gets or sets the display order within the category
    /// </summary>
    public int Order { get; set; }
}

