namespace FlowState.Models
{
    /// <summary>
    /// Defines the interaction mode for the canvas
    /// </summary>
    public enum CanvasMode
    {
        /// <summary>
        /// Default mode - allows node selection, dragging, and rectangle selection
        /// </summary>
        Select = 0,
        
        /// <summary>
        /// Pan mode - canvas panning without requiring modifier key press
        /// </summary>
        Pan = 1
    }
}

