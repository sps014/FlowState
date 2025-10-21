using FlowState.Attributes;
using FlowState.Models;
using FlowState.Models.Events;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;
using System.Diagnostics;
using System.Reflection;

namespace FlowState.Components;

/// <summary>
/// A context menu component for adding nodes to the flow graph
/// </summary>
public partial class FlowContextMenu : ComponentBase, IAsyncDisposable
{
    [Inject] private IJSRuntime JS { get; set; } = default!;
    
    private ElementReference menuRef;
    private DotNetObjectReference<FlowContextMenu>? dotNetRef;
    
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
    private double ScreenX { get; set; }
    private double ScreenY { get; set; }
    private double CanvasX { get; set; }
    private double CanvasY { get; set; }
    private string SearchTerm { get; set; } = string.Empty;
    private List<NodeDefinition> NodeDefinitions { get; set; } = new();
    
    /// <summary>
    /// Shows the context menu at the specified position
    /// </summary>
    /// <param name="screenX">Screen X coordinate (for menu positioning)</param>
    /// <param name="screenY">Screen Y coordinate (for menu positioning)</param>
    /// <param name="canvasX">Canvas X coordinate (for node creation)</param>
    /// <param name="canvasY">Canvas Y coordinate (for node creation)</param>
    public async Task ShowAsync(double screenX, double screenY, double canvasX, double canvasY)
    {
        ScreenX = screenX;
        ScreenY = screenY;
        CanvasX = canvasX;
        CanvasY = canvasY;
        Visible = true;
        SearchTerm = string.Empty;
        LoadNodeDefinitions();
        StateHasChanged();
        
        // Setup click-outside listener after rendering
        await Task.Delay(10);
        dotNetRef ??= DotNetObjectReference.Create(this);
        await JS.InvokeVoidAsync("flowContextMenuSetup", menuRef, dotNetRef);
    }

    /// <summary>
    /// Hides the context menu
    /// </summary>
    [JSInvokable]
    public async Task HideAsync()
    {
        Visible = false;
        StateHasChanged();

        // Cleanup click-outside listener
        if (dotNetRef != null)
        {
            await JS.InvokeVoidAsync("flowContextMenuCleanup");
        }
    }
    
    /// <summary>
    /// Dispose Async
    /// </summary>
    /// <returns></returns>
    public async ValueTask DisposeAsync()
    {
        if (dotNetRef != null)
        {
            try
            {
                await JS.InvokeVoidAsync("flowContextMenuCleanup");
                dotNetRef.Dispose();
            }catch{
                Debug.WriteLine("failed to dispose flowContext");
            }
        }
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
    
    private async Task HandleNodeClick(NodeDefinition nodeDef)
    {
        // Create the node directly

        if (Graph == null)
            return;
            
        await Graph.CreateNodeAsync(nodeDef.NodeType, CanvasX, CanvasY, new Dictionary<string, object?>());
        await HideAsync();
    }
}

