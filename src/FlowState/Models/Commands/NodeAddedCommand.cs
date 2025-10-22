using System.Data.Common;
using FlowState.Components;

namespace FlowState.Models.Commands;


/// <summary>
/// Command to add a node to the graph
/// </summary>
public class NodeAddedCommand: ICommand
{

    /// <summary>
    /// Creates a new instance of the NodeAddedCommand class
    /// </summary>
    /// <param name="type">The type of the node that was added</param>
    /// <param name="nodeId">The ID of the node that was added</param>
    /// <param name="x">The X coordinate of the node</param>
    /// <param name="y">The Y coordinate of the node</param>
    /// <param name="data">The data of the node</param>
    /// <param name="graph">The graph on which the node was added</param>
    /// <returns>A new instance of the NodeAddedCommand class</returns>
    public NodeAddedCommand(Type type,string nodeId,double x,double y, Dictionary<string, object?> data, FlowGraph graph)
    {
        NodeId = nodeId;
        X = x;
        Y = y;
        Data = data;
        Graph = graph;
        Type = type;
    }

    /// <inheritdoc/>
    public async ValueTask ExecuteAsync()
    {
        Data[nameof(FlowNodeBase.Id)] = NodeId;
        await Graph.CreateNodeAsync(Type, X, Y, Data, suppressAddingToCommandStack: true);
    }
    /// <inheritdoc/>
    public ValueTask UndoAsync()
    {
        return Graph.RemoveNodeAsync(NodeId, suppressAddingToCommandStack: true);
    }

    /// <summary>
    /// Gets the type of the node that was added
    /// </summary>
    public Type Type { get; }
    
    /// <summary>
    /// Gets the ID of the node that was added
    /// </summary>
    public string NodeId { get; }
    /// <summary>
    /// Gets the X coordinate of the node
    /// </summary>
    public double X { get; }
    /// <summary>
    /// Gets the Y coordinate of the node
    /// </summary>
    public double Y { get; }
    /// <summary>
    /// Gets the data of the node
    /// </summary>
    public Dictionary<string, object?> Data { get; }

    /// <summary>
    /// FlowGraph on which node exists
    /// </summary>
    public FlowGraph Graph { get; }
}