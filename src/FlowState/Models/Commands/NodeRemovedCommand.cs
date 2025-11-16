
using System.Security.Cryptography.X509Certificates;
using FlowState.Models.Serializable;

namespace FlowState.Models.Commands;

/// <summary>
/// Command to remove a node from the graph
/// </summary>
public class NodeRemovedCommand : ICommand
{

    /// <summary>
    /// The properties of the node that was removed
    /// </summary>
    public NodeProperties NodeProperties { get; private set; }

    /// <summary>
    /// The edges that were removed
    /// </summary>

    /// <summary>
    /// The graph that the command is being executed on
    /// </summary>
    public IReadOnlyList<EdgeProperties> Edges {get;private set;}

    /// <summary>
    /// The graph that the command is being executed on
    /// </summary>
    public FlowGraph Graph { get; private set; }

    /// <summary>
    /// Initializes a new instance of the NodeRemovedCommand class
    /// </summary>
    /// <param name="nodeProperties">The properties of the node that was removed</param>
    /// <param name="edges">The edges that were removed</param>
    /// <param name="graph">The graph that the command is being executed on</param>
    public NodeRemovedCommand(NodeProperties nodeProperties,IReadOnlyList<EdgeProperties> edges, FlowGraph graph)
    {
        NodeProperties = nodeProperties;
        Edges = edges;
        Graph = graph;
    }

    /// <inheritdoc/>
    public ValueTask ExecuteAsync()
    {
        return Graph.RemoveNodeAsync(NodeProperties.Id);
    }

    /// <inheritdoc/>
    public async ValueTask UndoAsync()
    {

        var dict = new Dictionary<string, object?>();
        foreach (var d in NodeProperties.Data)
        {
            dict.Add(d.Key, d.Value.GetValue());
        }

        await Graph.CreateNodeAsync(NodeProperties.Name, NodeProperties.X, NodeProperties.Y, dict, suppressAddingToCommandStack: true);


        await Task.Delay(50);
        foreach(var e in Edges)
        {
            await Graph.ConnectAsync(e.FromNodeId, e.ToNodeId, e.FromSocketName, e.ToSocketName, suppressAddingToCommandStack: false);
        }
    }

}