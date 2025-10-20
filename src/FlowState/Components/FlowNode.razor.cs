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

        /// <summary>
        /// Initializes the node component
        /// </summary>
        protected override void OnInitialized()
        {
            base.OnInitialized();
        }

        /// <summary>
        /// Performs initialization after the component has rendered
        /// </summary>
        /// <param name="firstRender">Whether this is the first time the component has rendered</param>
        protected override async Task OnAfterRenderAsync(bool firstRender)
        {

            if(OperatingSystem.IsBrowser() && Node!=null && Node.DomElement==null)
                await InitAsync();

            if (!firstRender)
                return;

            await InitAsync();
            
        }

        private ValueTask InitAsync()
        {
            if (Node != null && Node.Graph != null)
            {
                Node.DomElement = this;
                return MoveNodeAsync(Node.X, Node.Y);
            }
            return ValueTask.CompletedTask;
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
