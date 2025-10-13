using FlowState.Models.Dom;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace FlowState.Components
{
    /// <summary>
    /// Represents the DOM wrapper for a flow node in the canvas
    /// </summary>
    public partial class FlowNode
    {
        // Properties

        /// <summary>
        /// Gets or sets the content to render inside the node
        /// </summary>
        [Parameter]
        public RenderFragment? ChildContent { get; set; }

        /// <summary>
        /// Gets or sets the parent flow node base instance
        /// </summary>
        [CascadingParameter]
        public FlowNodeBase? Node { get; set; }

        internal ElementReference nodeRef;

        // Lifecycle Methods

        protected override void OnInitialized()
        {
            base.OnInitialized();
        }

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            await base.OnAfterRenderAsync(firstRender);

            if (!firstRender)
                return;

            if (Node != null && Node.Graph != null)
            {
                Node.DomElement = this;
                await MoveNodeAsync(Node.X, Node.Y);
            }
            else
            {
                throw new Exception("Error rendering the node");
            }
        }

        // Public Methods

        /// <summary>
        /// Moves the node to the specified position
        /// </summary>
        /// <param name="x">The X coordinate</param>
        /// <param name="y">The Y coordinate</param>
        /// <returns>A task representing the asynchronous operation</returns>
        public ValueTask MoveNodeAsync(double x, double y)
        {
            if (Node != null && Node.Graph != null && Node.Graph.Canvas != null && Node.Graph.Canvas.JsModule != null)
                return Node.Graph.Canvas.JsModule.InvokeVoidAsync("moveNode", nodeRef, x, y);

            return ValueTask.CompletedTask;
        }

        /// <summary>
        /// Gets the current transform position of the node
        /// </summary>
        /// <returns>The current position as a DomPoint</returns>
        public ValueTask<DomPoint> GetTransformPositionAsync()
        {
            if (Node != null && Node.Graph != null && Node.Graph.Canvas != null && Node.Graph.Canvas.JsModule != null)
            {
                return Node.Graph.Canvas.JsModule.InvokeAsync<DomPoint>("getTransformPosition", nodeRef);
            }

            return ValueTask.FromResult(new DomPoint());
        }
    }
}
