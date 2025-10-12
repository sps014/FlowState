using FlowState.Components;

namespace FlowState.Models.Events;

public class ConnectRequestArgs
{
    public string FromNodeId { get; init; }
    public string ToNodeId { get; init; }
    public string FromSocketName { get; init; }
    public string ToSocketName { get; init; }

    public FlowNodeBase ToNode => Graph.GetNodeById(ToNodeId)!;
    public FlowNodeBase FromNode => Graph.GetNodeById(FromNodeId)!;

    public FlowSocket ToSocket => ToNode.GetSocketByName(ToSocketName,SocketType.Input)!;
    public FlowSocket FromSocket => FromNode.GetSocketByName(FromSocketName,SocketType.Output)!;



    public FlowGraph Graph { get; }

    public bool Handled { get; set; }

    public ConnectRequestArgs(string fromNodeId, string toNodeId, string fromSocketName, string toSocketName,FlowGraph graph)
    {
        FromNodeId = fromNodeId;
        ToNodeId = toNodeId;
        FromSocketName = fromSocketName;
        ToSocketName = toSocketName;
        Graph = graph;
    }
}
