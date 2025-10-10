namespace FlowState.Models.Events
{
    /// <summary>
    /// Provides data for pan events.
    /// </summary>
    public class PanEventArgs : EventArgs
    {
        public PanEventArgs(double x ,double y)
        {
            X = x;
            Y = y;
        }

        public double X { get; }
        public double Y { get; }
    }
}