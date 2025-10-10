using System.Collections.ObjectModel;
using FlowState.Components;
using Microsoft.AspNetCore.Components;

namespace FlowState.Models;

public class FlowGraph
{
    public FlowNodeRegistry nodeRegistry { get; } = new FlowNodeRegistry();
    internal List<NodeInfo> NodesInfo { get; } = new List<NodeInfo>();
    public IReadOnlyList<FlowNodeBase> Nodes => NodesInfo.Where(n => n.Component != null && n.Component.Instance!=null).Select(n => (n.Component!.Instance as FlowNodeBase)!).ToList();

    public void RegisterNode<T>() where T : FlowNodeBase
    {
        nodeRegistry.Register<T>();
    }

    public void CreateNode<T>() where T : FlowNodeBase
    {
        NodesInfo.Add(new NodeInfo { NodeType = typeof(T), Component = null});
        NodeAdded?.Invoke(this, EventArgs.Empty);
    }

    public EventHandler? NodeAdded;
}

internal record NodeInfo
{
    public required Type NodeType { get; init; }
    public DynamicComponent? Component { get; set; }
}