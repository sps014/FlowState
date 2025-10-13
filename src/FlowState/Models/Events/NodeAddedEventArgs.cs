using FlowState.Components;

namespace FlowState.Models.Events;

/// <summary>
/// Event arguments for node added events
/// </summary>
public class NodeAddedEventArgs : EventArgs
{
    public required string NodeId { get; init; }
    public required Type NodeType { get; init; }
    public double X { get; init; }
    public double Y { get; init; }
}

