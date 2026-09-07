using FlowState.Components;

namespace FlowState.Models.Commands;

/// <summary>
/// Command that records a batch of node position changes.
/// </summary>
public class NodesMovedCommand : ICommand
{
    /// <summary>IDs of the moved nodes.</summary>
    public string[] NodeIds { get; }

    /// <summary>X positions before the move.</summary>
    public double[] OldXs { get; }

    /// <summary>Y positions before the move.</summary>
    public double[] OldYs { get; }

    /// <summary>X positions after the move.</summary>
    public double[] NewXs { get; }

    /// <summary>Y positions after the move.</summary>
    public double[] NewYs { get; }

    /// <summary>Graph the nodes belong to.</summary>
    public FlowGraph Graph { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="NodesMovedCommand"/> class.
    /// </summary>
    public NodesMovedCommand(string[] nodeIds, double[] oldXs, double[] oldYs, double[] newXs, double[] newYs, FlowGraph graph)
    {
        NodeIds = nodeIds;
        OldXs = oldXs;
        OldYs = oldYs;
        NewXs = newXs;
        NewYs = newYs;
        Graph = graph;
    }

    /// <inheritdoc/>
    public ValueTask ExecuteAsync() => ApplyAsync(NewXs, NewYs);

    /// <inheritdoc/>
    public ValueTask UndoAsync() => ApplyAsync(OldXs, OldYs);

    private async ValueTask ApplyAsync(double[] xs, double[] ys)
    {
        for (int i = 0; i < NodeIds.Length; i++)
        {
            var node = Graph.GetNodeById(NodeIds[i]);
            if (node == null)
                continue;

            if (node.DomElement != null)
            {
                await node.DomElement.MoveNodeAsync(xs[i], ys[i]);
                await node.DomElement.UpdateEdgesAsync();
            }
        }
    }
}
