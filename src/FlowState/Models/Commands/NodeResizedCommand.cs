using FlowState.Components;

namespace FlowState.Models.Commands;

/// <summary>
/// Command that records a group node resize.
/// </summary>
public class NodeResizedCommand : ICommand
{
    /// <summary>ID of the resized node.</summary>
    public string NodeId { get; }

    /// <summary>Width before the resize.</summary>
    public double OldWidth { get; }

    /// <summary>Height before the resize.</summary>
    public double OldHeight { get; }

    /// <summary>Width after the resize.</summary>
    public double NewWidth { get; }

    /// <summary>Height after the resize.</summary>
    public double NewHeight { get; }

    /// <summary>Graph the node belongs to.</summary>
    public FlowGraph Graph { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="NodeResizedCommand"/> class.
    /// </summary>
    public NodeResizedCommand(string nodeId, double oldWidth, double oldHeight, double newWidth, double newHeight, FlowGraph graph)
    {
        NodeId = nodeId;
        OldWidth = oldWidth;
        OldHeight = oldHeight;
        NewWidth = newWidth;
        NewHeight = newHeight;
        Graph = graph;
    }

    /// <inheritdoc/>
    public ValueTask ExecuteAsync() => ApplyAsync(NewWidth, NewHeight);

    /// <inheritdoc/>
    public ValueTask UndoAsync() => ApplyAsync(OldWidth, OldHeight);

    private ValueTask ApplyAsync(double width, double height)
    {
        var node = Graph.GetNodeById(NodeId);
        if (node is not FlowGroupNodeBase group)
            return ValueTask.CompletedTask;

        return group.SetSizeAsync(width, height);
    }
}
