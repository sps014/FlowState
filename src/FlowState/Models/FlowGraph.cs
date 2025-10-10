using System.Collections.ObjectModel;
using FlowState.Components;
using Microsoft.AspNetCore.Components;

namespace FlowState.Models;

public class FlowGraph
{
    public FlowNodeRegistry nodeRegistry { get; } = new FlowNodeRegistry();
    internal List<NodeInfo> NodesInfo { get; } = new List<NodeInfo>();
    public IReadOnlyList<FlowNodeBase> Nodes => NodesInfo.Where(n => n.Instance!=null).Select(ny=> ny.Instance!).ToList();
    
    public FlowCanvas? Canvas { get; set; }

    public void RegisterNode<T>() where T : FlowNodeBase
    {
        nodeRegistry.Register<T>();
    }

    public void CreateNode<T>() where T : FlowNodeBase
    {
        NodesInfo.Add(new NodeInfo { NodeType = typeof(T), Component = null, Parameters = { ["Graph"] = this } });
        NodeAdded?.Invoke(this, EventArgs.Empty);
    }
    
    public FlowNodeBase? GetNodeById(string id)
    {
        return Nodes.FirstOrDefault(n => n.Id == id);
    }

    public EventHandler? NodeAdded;
}

internal record NodeInfo
{
    public required Type NodeType { get; init; }
    public DynamicComponent? Component { get; set; }

    public FlowNodeBase? Instance
    {
        get
        {
            if(Component!=null && Component.Instance is FlowNodeBase fn)
            {
                return fn;
            }
            return null;
        }
    }

    public Dictionary<string, object> Parameters { get; init; } = new Dictionary<string, object>();
}