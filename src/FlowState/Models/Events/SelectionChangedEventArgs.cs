namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for selection changed events
/// </summary>
public class SelectionChangedEventArgs : EventArgs
{
    public required string[] SelectedNodeIds { get; init; }
    
    /// <summary>
    /// Gets the number of selected nodes
    /// </summary>
    public int Count => SelectedNodeIds.Length;
    
    /// <summary>
    /// Returns true if any nodes are selected
    /// </summary>
    public bool HasSelection => SelectedNodeIds.Length > 0;
}

