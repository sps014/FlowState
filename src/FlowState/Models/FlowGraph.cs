using System.Collections.ObjectModel;
using FlowState.Components;
using Microsoft.AspNetCore.Components;

namespace FlowState.Models;

public class FlowGraph
{
    public FlowNodeRegistry nodeRegistry { get; } = new FlowNodeRegistry();
    internal Dictionary<string,NodeInfo> NodesInfo { get; } = new ();
    public IReadOnlyList<FlowNodeBase> Nodes => NodesInfo.Values.Where(n => n.Instance!=null).Select(ny=> ny.Instance!).ToList();
    
    public FlowCanvas? Canvas { get; set; }

    public void RegisterNode<T>() where T : FlowNodeBase
    {
        nodeRegistry.Register<T>();
    }

    public NodeInfo CreateNode(Type type,double x,double y,Dictionary<string,object> data)
    {
        var id = Guid.NewGuid().ToString();

        data["Graph"] = this;

        if (!data.ContainsKey("Id"))
            data["Id"] = id;

        data["X"] = x;
        data["Y"] = y;

        NodesInfo.Add(id,new NodeInfo { Id=id, NodeType = type, Component = null, Parameters = data });
        NodeAdded?.Invoke(this, EventArgs.Empty);

        return NodesInfo[id];  
    }

    public NodeInfo CreateNode<T>(double x,double y,Dictionary<string,object> data) where T : FlowNodeBase
    {
        return CreateNode(typeof(T), x, y, data);
    }
    
    public FlowNodeBase? GetNodeById(string id)
    {
        if (NodesInfo.ContainsKey(id))
            return NodesInfo[id].Instance;
        return null;
    }

    public EventHandler? NodeAdded;
}
