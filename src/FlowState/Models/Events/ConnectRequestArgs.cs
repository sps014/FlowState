using FlowState.Components;

namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for edge connection requests
/// </summary>
public class ConnectRequestArgs
{
    /// <summary>
    /// Gets the ID of the source node
    /// </summary>
    public string FromNodeId { get; init; }
    
    /// <summary>
    /// Gets the ID of the destination node
    /// </summary>
    public string ToNodeId { get; init; }
    
    /// <summary>
    /// Gets the name of the source socket
    /// </summary>
    public string FromSocketName { get; init; }
    
    /// <summary>
    /// Gets the name of the destination socket
    /// </summary>
    public string ToSocketName { get; init; }

    /// <summary>
    /// Gets the destination node
    /// </summary>
    public FlowNodeBase ToNode => Graph.GetNodeById(ToNodeId)!;
    
    /// <summary>
    /// Gets the source node
    /// </summary>
    public FlowNodeBase FromNode => Graph.GetNodeById(FromNodeId)!;

    /// <summary>
    /// Gets the destination socket
    /// </summary>
    public FlowSocket ToSocket => ToNode.GetSocketByName(ToSocketName,SocketType.Input)!;
    
    /// <summary>
    /// Gets the source socket
    /// </summary>
    public FlowSocket FromSocket => FromNode.GetSocketByName(FromSocketName,SocketType.Output)!;

    /// <summary>
    /// Gets the flow graph
    /// </summary>
    public FlowGraph Graph { get; }

    /// <summary>
    /// Gets or sets whether the connection request has been handled
    /// </summary>
    public bool Handled { get; set; }

    /// <summary>
    /// Initializes a new instance of the ConnectRequestArgs class
    /// </summary>
    /// <param name="fromNodeId">The ID of the source node</param>
    /// <param name="toNodeId">The ID of the destination node</param>
    /// <param name="fromSocketName">The name of the source socket</param>
    /// <param name="toSocketName">The name of the destination socket</param>
    /// <param name="graph">The flow graph</param>
    public ConnectRequestArgs(string fromNodeId, string toNodeId, string fromSocketName, string toSocketName,FlowGraph graph)
    {
        FromNodeId = fromNodeId;
        ToNodeId = toNodeId;
        FromSocketName = fromSocketName;
        ToSocketName = toSocketName;
        Graph = graph;
    }
}
