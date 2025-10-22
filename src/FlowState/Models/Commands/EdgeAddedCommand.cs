using FlowState.Models.Commands;

namespace FlowState.Models;

/// <summary>
/// Command to add an edge to the graph
/// </summary>
public class EdgeAddedCommand : ICommand
{

    /// <summary>
    /// The ID of the edge that was added
    /// </summary>
    public string EdgeId { get; private set; }

    /// <summary>
    /// The ID of the source node
    /// </summary>
    public string FromNodeId { get; }

    /// <summary>
    /// The ID of the destination node
    /// </summary>
    public string ToNodeId { get; }

    /// <summary>
    /// The name of the source socket
    /// </summary>
    public string FromSocketName { get; }

    /// <summary>
    /// The name of the destination socket
    /// </summary>
    public string ToSocketName { get; }

    /// <summary>
    /// The graph that the command is being executed on
    /// </summary>
    public FlowGraph FlowGraph { get; }

    /// <summary>
    /// Initializes a new instance of the EdgeAddedCommand class
    /// </summary>
    /// <param name="edgeId">The ID of the edge that was added</param>
    /// <param name="fromNodeId">The ID of the source node</param>
    /// <param name="toNodeId">The ID of the destination node</param>
    /// <param name="fromSocketName">The name of the source socket</param>
    /// <param name="toSocketName">The name of the destination socket</param>
    /// <param name="flowGraph">The graph that the command is being executed on</param>

    public EdgeAddedCommand(string edgeId, string fromNodeId, string toNodeId, string fromSocketName, string toSocketName, FlowGraph flowGraph)
    {
        EdgeId = edgeId;
        FromNodeId = fromNodeId;
        ToNodeId = toNodeId;
        FromSocketName = fromSocketName;
        ToSocketName = toSocketName;
        FlowGraph = flowGraph;
    }

    /// <inheritdoc/>
    public async ValueTask ExecuteAsync()
    {
        var result = await FlowGraph.ConnectAsync(FromNodeId, ToNodeId, FromSocketName, ToSocketName, suppressAddingToCommandStack: true);
        if (result.Edge != null)
            EdgeId = result.Edge.Id;    }

    /// <inheritdoc/>
    public ValueTask UndoAsync()
    {
        return FlowGraph.RemoveEdgeAsync(EdgeId,suppressAddingToCommandStack:true);
    }
}
