namespace FlowState.Models.Events
{
    /// <summary>
    /// Provides data for pan events.
    /// </summary>
    public class PanEventArgs : EventArgs
    {
        /// <summary>
        /// Initializes a new instance of the PanEventArgs class
        /// </summary>
        /// <param name="x">The X offset</param>
        /// <param name="y">The Y offset</param>
        public PanEventArgs(double x ,double y)
        {
            X = x;
            Y = y;
        }

        /// <summary>
        /// Gets the X offset
        /// </summary>
        public double X { get; }
        
        /// <summary>
        /// Gets the Y offset
        /// </summary>
        public double Y { get; }
    }
}