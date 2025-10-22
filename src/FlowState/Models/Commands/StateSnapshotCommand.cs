using FlowState.Models.Commands;
using FlowState.Models.Serializable;

namespace FlowState.Models;

/// <summary>
/// Command to snapshot the current state of the graph
/// </summary>
public class StateSnapshotCommand : ICommand
{
    /// <summary>
    /// The current state of the graph
    /// </summary>
    public GraphData CurrentState { get; }

    /// <summary>
    /// The old state of the graph
    /// </summary>
    public GraphData OldState { get; }

    /// <summary>
    /// The graph that the command is being executed on
    /// </summary>
    public FlowGraph FlowGraph { get; }

    /// <summary>
    /// Initializes a new instance of the StateSnapshotCommand class
    /// </summary>
    /// <param name="currentState">The current state of the graph</param>
    /// <param name="oldState">The old state of the graph</param>
    /// <param name="flowGraph">The graph that the command is being executed on</param>

    public StateSnapshotCommand(GraphData currentState, GraphData oldState, FlowGraph flowGraph)
    {
        CurrentState = currentState;
        OldState = oldState;
        FlowGraph = flowGraph;
    }

    /// <inheritdoc/>
    public ValueTask ExecuteAsync()
    {
        return FlowGraph.DeserializeAsync(CurrentState);
    }

    /// <inheritdoc/>
    public ValueTask UndoAsync()
    {
        return FlowGraph.DeserializeAsync(OldState);
    }
}
