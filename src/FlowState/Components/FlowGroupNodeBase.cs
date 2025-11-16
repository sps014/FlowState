using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace FlowState.Components;


/// <summary>
/// Represents the base class for a group node
/// </summary>
public abstract class FlowGroupNodeBase: FlowNodeBase
{


    /// <summary>
    /// Gets or sets the width of the node
    /// </summary>
    [Parameter]
    public double Width { get; set; } = 300;

    /// <summary>
    /// Gets or sets the height of the node
    /// </summary>
    [Parameter]
    public double Height { get; set; } = 300;


    /// <summary>
    /// Gets the nodes in the current node group
    /// </summary>
    /// <returns>An array of node IDs</returns>
    public ValueTask<string[]> GetNodesInGroupAsync()
    {
        if (Graph == null || Canvas == null || Canvas.JsModule == null || DomElement == null)
            return ValueTask.FromResult(Array.Empty<string>());

        return Canvas.JsModule.InvokeAsync<string[]>("getNodesInGroup", DomElement.nodeRef);
    }


    /// <summary>
    /// Triggered when the node is resized
    /// </summary>
    /// <param name="width">The new width in px of the node</param>
    /// <param name="height">The new height in px of the node</param>
    public virtual void OnResized(double width, double height)
    {
        Width = width;
        Height = height;

        StateHasChanged();
    }

    /// <summary>
    /// Sets the size of the node when the component is rendered
    /// </summary>
    /// <returns>A task representing the asynchronous operation</returns>
    public override async ValueTask OnRenderedAsync()
    {
        await base.OnRenderedAsync();
        await SetSizeAsync(Width, Height);

    }
    
    /// <summary>
    /// Sets the size of the node
    /// </summary>
    /// <param name="width">The new width in px of the node</param>
    /// <param name="height">The new height in px of the node</param>
    /// <returns>A task representing the asynchronous operation</returns>
    public ValueTask SetSizeAsync(double width, double height)
    {
        if (Graph == null || Canvas == null || Canvas.JsModule == null || DomElement == null)
            return ValueTask.CompletedTask;

        Width = width;
        Height = height;

        return Canvas.JsModule.InvokeVoidAsync("setGroupNodeSize", DomElement.nodeRef, width, height);
    }


}