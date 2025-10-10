namespace FlowState.Models.Events;

public class NodeMovedArg : EventArgs
{
    public string NodeId { get; init; }
    public double X { get; init; }
    public double Y { get; init; }

    public NodeMovedArg(string nodeId, double x, double y)
    {
        NodeId = nodeId;
        X = x;
        Y = y;
    }
}