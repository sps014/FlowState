namespace FlowState.Models.Events
{
    /// <summary>
    /// Provides data for pan events.
    /// </summary>
    public class PanEventArgs : EventArgs
    {
        public PanEventArgs(int x ,int y)
        {
            X = x;
            Y = y;
        }

        public int X { get; }
        public int Y { get; }
    }
}