using FlowState.Models.Dom;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using FlowState.Models;

namespace FlowState.Components
{
    /// <summary>
    /// Represents the DOM wrapper for a flow node in the canvas
    /// </summary>
    public partial class FlowNode : IAsyncDisposable
    {
        // Properties

        /// <summary>
        /// Current FlowCanvas context 
        /// </summary>
        [CascadingParameter]
        public FlowCanvas? Canvas { get; set; }

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


        /// <summary>
        /// Gets or sets the kind of node
        /// </summary>
        [Parameter]
        public NodeKind Kind { get; set; } = NodeKind.Regular;

        /// <summary>
        /// Gets or sets the class of the node
        /// </summary>
        [Parameter]
        public string Class { get; set; } = string.Empty;


        internal ElementReference nodeRef;


        // Lifecycle Methods


        /// <summary>
        /// Performs initialization after the component has rendered
        /// </summary>
        /// <param name="firstRender">Whether this is the first time the component has rendered</param>
        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
             // on web assembly it takes many render calls before parameters are set
            if(OperatingSystem.IsBrowser() && Node!=null && Node.DomElement==null)
                await InitAsync();

            if (!firstRender)
                return;

            await InitAsync();
            
        }

        private async ValueTask InitAsync()
        {
            if (Node != null && Node.Graph != null)
            {
                Node.DomElement = this;
                await MoveNodeAsync(Node.X, Node.Y);

                var nodeInfo = Node.Graph.GetNodeInfoById(Node.Id);

                //clear parameters to fix serialization issues on multple canvas renders
                if (nodeInfo != null)
                    nodeInfo.Parameters.Clear();

                Node.IsRendered = true;

                Node.renderCompletionSource.TrySetResult();

                await Node.OnRenderedAsync();
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
            if (Node != null && Node.Graph != null && Canvas != null && Canvas.JsModule != null)
                return Canvas.JsModule.InvokeVoidAsync("moveNode", nodeRef, x, y);

            return ValueTask.CompletedTask;
        }

        /// <summary>
        /// Gets the current transform position of the node
        /// </summary>
        /// <returns>The current position as a DomPoint</returns>
        public ValueTask<DomPoint> GetTransformPositionAsync()
        {
            if (Node != null && Node.Graph != null && Canvas != null && Canvas.JsModule != null)
            {
                return Canvas.JsModule.InvokeAsync<DomPoint>("getTransformPosition", nodeRef);
            }

            return ValueTask.FromResult(new DomPoint());
        }

        /// <summary>
        /// Updates the edges of the node , useful when node is resized externally
        /// </summary>
        /// <returns>A task representing the asynchronous operation</returns>
        public ValueTask UpdateEdgesAsync()
        {
            if (Node != null && Node.Graph != null && Canvas != null && Canvas.JsModule != null)
            {
                return Canvas.JsModule.InvokeVoidAsync("updateEdge", nodeRef);
            }

            return ValueTask.CompletedTask;
        }

        /// <summary>
        /// Cleanup when the node is removed
        /// </summary>
        public ValueTask DisposeAsync()
        {
            if (Node != null)
            {
                Node.DomElement = null;
            }
            return ValueTask.CompletedTask;
        }
    }
}
