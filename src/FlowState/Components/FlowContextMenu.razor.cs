using FlowState.Attributes;
using FlowState.Models;
using FlowState.Models.Events;
using Microsoft.AspNetCore.Components;
using System.Reflection;

namespace FlowState.Components;

/// <summary>
/// A context menu component for adding nodes to the flow graph
/// </summary>
public partial class FlowContextMenu : ComponentBase
{
    /// <summary>
    /// Gets or sets the flow graph reference
    /// </summary>
    [Parameter]
    public FlowGraph? Graph { get; set; }
    
    // Display options
    
    /// <summary>
    /// Gets or sets whether to show the header
    /// </summary>
    [Parameter]
    public bool ShowHeader { get; set; } = true;
    
    /// <summary>
    /// Gets or sets whether to show the search input
    /// </summary>
    [Parameter]
    public bool ShowSearch { get; set; } = true;
    
    /// <summary>
    /// Gets or sets whether to show node descriptions
    /// </summary>
    [Parameter]
    public bool ShowDescriptions { get; set; } = true;
    
    /// <summary>
    /// Gets or sets whether to show node type names
    /// </summary>
    [Parameter]
    public bool ShowNodeType { get; set; } = true;
    
    /// <summary>
    /// Gets or sets the header content text
    /// </summary>
    [Parameter]
    public string HeaderContent { get; set; } = "Add Node";
    
    /// <summary>
    /// Gets or sets the search input placeholder
    /// </summary>
    [Parameter]
    public string SearchPlaceholder { get; set; } = "Search nodes...";
    
    /// <summary>
    /// Gets or sets the empty message when no nodes are found
    /// </summary>
    [Parameter]
    public string EmptyMessage { get; set; } = "No nodes found";
    
    // Style customization
    
    /// <summary>
    /// Gets or sets additional CSS classes for the overlay
    /// </summary>
    [Parameter]
    public string? OverlayClass { get; set; }
    
    /// <summary>
    /// Gets or sets inline styles for the overlay
    /// </summary>
    [Parameter]
    public string? OverlayStyle { get; set; }
    
    /// <summary>
    /// Gets or sets additional CSS classes for the menu
    /// </summary>
    [Parameter]
    public string? MenuClass { get; set; }
    
    /// <summary>
    /// Gets or sets inline styles for the menu
    /// </summary>
    [Parameter]
    public string? MenuStyle { get; set; }
    
    /// <summary>
    /// Gets or sets additional CSS classes for the header
    /// </summary>
    [Parameter]
    public string? HeaderClass { get; set; }
    
    /// <summary>
    /// Gets or sets inline styles for the header
    /// </summary>
    [Parameter]
    public string? HeaderStyle { get; set; }
    
    // Private fields
    
    private bool Visible { get; set; }
    private double CanvasX { get; set; }
    private double CanvasY { get; set; }
    private string SearchTerm { get; set; } = string.Empty;
    private List<NodeDefinition> NodeDefinitions { get; set; } = new();
    
    /// <summary>
    /// Shows the context menu at the specified canvas position
    /// </summary>
    /// <param name="x">Canvas X coordinate</param>
    /// <param name="y">Canvas Y coordinate</param>
    public void Show(double x, double y)
    {
        CanvasX = x;
        CanvasY = y;
        Visible = true;
        SearchTerm = string.Empty;
        LoadNodeDefinitions();
        StateHasChanged();
    }
    
    /// <summary>
    /// Hides the context menu
    /// </summary>
    public void Hide()
    {
        Visible = false;
        StateHasChanged();
    }
    
    private void LoadNodeDefinitions()
    {
        if (Graph?.NodeRegistry == null)
        {
            NodeDefinitions = new();
            return;
        }
        
        NodeDefinitions = Graph.NodeRegistry.RegisteredNodes
            .Select(nodeType => CreateNodeDefinition(nodeType))
            .OrderBy(n => n.Category)
            .ThenBy(n => n.Order)
            .ThenBy(n => n.Title)
            .ToList();
    }
    
    private NodeDefinition CreateNodeDefinition(Type nodeType)
    {
        var metadata = nodeType.GetCustomAttribute<FlowNodeMetadataAttribute>();
        var name = nodeType.Name;
        
        return new NodeDefinition
        {
            NodeType = nodeType,
            Name = name,
            Title = metadata?.Title ?? name,
            Description = metadata?.Description ?? string.Empty,
            Category = metadata?.Category ?? "General",
            Icon = metadata?.Icon ?? "⚙️",
            Order = metadata?.Order ?? 0
        };
    }
    
    private Dictionary<string, List<NodeDefinition>> GetGroupedNodes()
    {
        var filtered = NodeDefinitions
            .Where(n => string.IsNullOrEmpty(SearchTerm) || 
                       n.Title.Contains(SearchTerm, StringComparison.OrdinalIgnoreCase) ||
                       n.Description.Contains(SearchTerm, StringComparison.OrdinalIgnoreCase) ||
                       n.Category.Contains(SearchTerm, StringComparison.OrdinalIgnoreCase) ||
                       n.Name.Contains(SearchTerm, StringComparison.OrdinalIgnoreCase))
            .ToList();
            
        return filtered
            .GroupBy(n => n.Category)
            .OrderBy(g => g.Key)
            .ToDictionary(g => g.Key, g => g.ToList());
    }
    
    private void HandleNodeClick(NodeDefinition nodeDef)
    {
        // Create the node directly
        Graph?.CreateNode(nodeDef.NodeType, CanvasX, CanvasY, new Dictionary<string, object?>());
        Hide();
    }
}

