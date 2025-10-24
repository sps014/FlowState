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
        /// Gets or sets the CSS class for the socket container
        /// </summary>
        [Parameter]
        public string? Class { get; set; }

        /// <summary>
        /// Gets or sets the CSS class for the socket anchor element
        /// </summary>
        [Parameter]
        public string? AnchorClass { get; set; }

        /// <summary>
        /// Gets the number of connections to this socket
        /// </summary>
        public List<FlowEdge> Connections { get; set; } = new();


        /// <summary>
        /// Gets or sets whether to override the previous name of the socket
        /// </summary>
        [Parameter]
        public bool OverridePreviousName { get; set; } = false;

        private string? innerSocketColorCopy;
        
        /// <summary>
        /// Copy of outer socket color for internal use
        /// </summary>
        protected string? outerSocketColorCopy;
        
        // Current colors (internal state that can differ from Parameters)
        private string? currentInnerColor;
        private string? currentOuterColor;

        private string ComputedAnchorClass => string.IsNullOrEmpty(AnchorClass) ? "socket-default" : AnchorClass;
        private string LayoutClass => "socket-container";
        private string SocketStyle => AnchorClass==null?
            $"width:{Size}px; height:{Size}px; background-color:{currentInnerColor ?? InnerColor}; border:2px solid {currentOuterColor ?? OuterColor};":string.Empty;

        // Lifecycle Methods

        /// <summary>
        /// Performs initialization after the component has rendered
        /// </summary>
        /// <param name="firstRender">Whether this is the first time the component has rendered</param>
        protected override void OnAfterRender(bool firstRender)
        {
            base.OnAfterRender(firstRender);

            if (!firstRender)
                return;

            if (FlowNode != null)
                FlowNode.AddSocket(this, OverridePreviousName);

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
            currentInnerColor = innerColor;
            currentOuterColor = outerColor;
            StateHasChanged();
        }

        /// <summary>
        /// Resets the socket colors to their original values
        /// </summary>
        public void ResetColor()
        {
            currentInnerColor = null;
            currentOuterColor = null;
            StateHasChanged();
        }
    }
}
