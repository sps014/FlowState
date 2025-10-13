using FlowState.Models;
using Microsoft.AspNetCore.Components;

namespace FlowState.Components
{
    /// <summary>
    /// Represents a connection point (input or output) on a flow node
    /// </summary>
    public partial class FlowSocket
    {
        internal ElementReference anchorRef;

        // Properties

        /// <summary>
        /// Gets or sets the data type that this socket can handle
        /// </summary>
        [Parameter]
        public Type T { get; set; } = typeof(object);

        /// <summary>
        /// Gets or sets whether this is an input or output socket
        /// </summary>
        [Parameter]
        public SocketType Type { get; set; } = SocketType.Input;

        /// <summary>
        /// Gets or sets custom content for the socket
        /// </summary>
        [Parameter]
        public RenderFragment? ChildContent { get; set; }

        /// <summary>
        /// Gets or sets the unique name of this socket within its node
        /// </summary>
        [EditorRequired]
        [Parameter]
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the display label for this socket
        /// </summary>
        [Parameter]
        public string? Label { get; set; }

        /// <summary>
        /// Gets or sets the inner color of the socket
        /// </summary>
        [Parameter]
        public string InnerColor { get; set; } = "#10b981";

        /// <summary>
        /// Gets or sets the outer border color of the socket
        /// </summary>
        [Parameter]
        public string OuterColor { get; set; } = "#065f46";

        /// <summary>
        /// Gets or sets the parent flow node
        /// </summary>
        [CascadingParameter]
        public FlowNodeBase? FlowNode { get; set; }

        /// <summary>
        /// Gets or sets the size (width and height) of the socket in pixels
        /// </summary>
        [Parameter]
        public int Size { get; set; } = 14;

        /// <summary>
        /// Gets the number of connections to this socket
        /// </summary>
        public int Connections { get; set; } = 0;

        private string? innerSocketColorCopy;
        protected string? outerSocketColorCopy;

        private string Class => ChildContent == null ? "socket-default" : string.Empty;
        private string LayoutClass => ChildContent == null ? "socket-container" : string.Empty;
        private string SocketStyle =>
            $"width:{Size}px; height:{Size}px; background-color:{InnerColor}; border:3px solid {OuterColor};";

        // Lifecycle Methods

        protected override void OnAfterRender(bool firstRender)
        {
            base.OnAfterRender(firstRender);

            if (!firstRender)
                return;

            if (FlowNode != null)
                FlowNode.AddSocket(this);

            innerSocketColorCopy = InnerColor;
            outerSocketColorCopy = OuterColor;
        }

        // Public Methods

        /// <summary>
        /// Updates the socket colors automatically
        /// </summary>
        /// <param name="innerColor">The new inner color</param>
        /// <param name="outerColor">The new outer color</param>
        public void AutoUpdateSocketColor(string innerColor, string outerColor)
        {
            InnerColor = innerColor;
            OuterColor = outerColor;
            StateHasChanged();
        }

        /// <summary>
        /// Resets the socket colors to their original values
        /// </summary>
        public void ResetColor()
        {
            if (innerSocketColorCopy != null && outerSocketColorCopy != null)
            {
                InnerColor = innerSocketColorCopy;
                OuterColor = outerSocketColorCopy;
                StateHasChanged();
            }
        }
    }
}
