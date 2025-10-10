namespace FlowState.Models.Events;

public class NodeMovedArgs : EventArgs
{
    public string NodeId { get; init; }
    public double X { get; init; }
    public double Y { get; init; }

    public NodeMovedArgs(string nodeId, double x, double y)
    {
        NodeId = nodeId;
        X = x;
        Y = y;
    }
}