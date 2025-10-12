using System.Collections.ObjectModel;
using FlowState.Components;
using Microsoft.AspNetCore.Components;

namespace FlowState.Models;

public class FlowGraph
{
    public FlowNodeRegistry nodeRegistry { get; } = new FlowNodeRegistry();
    internal Dictionary<string, NodeInfo> NodesInfo { get; } = new();
    internal Dictionary<string, EdgeInfo> EdgesInfo { get; } = new();

    public IReadOnlyList<FlowNodeBase> Nodes => NodesInfo.Values.Where(n => n.Instance != null).Select(ny => ny.Instance!).ToList();
    public IReadOnlyList<FlowEdge> Edges => EdgesInfo.Values.Where(n => n.Instance != null).Select(ny => ny.Instance!).ToList();


    public FlowCanvas? Canvas { get; set; }

    public void RegisterNode<T>() where T : FlowNodeBase
    {
        nodeRegistry.Register<T>();
    }

    public NodeInfo CreateNode(Type type, double x, double y, Dictionary<string, object> data)
    {
        var id = Guid.NewGuid().ToString();

        data[nameof(FlowNodeBase.Graph)] = this;
        
        if (!data.ContainsKey(nameof(FlowNodeBase.Id)))
            data[nameof(FlowNodeBase.Id)] = id;

        data[nameof(FlowNodeBase.X)] = x;
        data[nameof(FlowNodeBase.Y)] = y;

        NodesInfo.Add(id, new NodeInfo { Id = id, NodeType = type, Component = null, Parameters = data });
        NodeAdded?.Invoke(this, EventArgs.Empty);

        return NodesInfo[id];
    }

    public NodeInfo CreateNode<T>(double x, double y, Dictionary<string, object> data) where T : FlowNodeBase
    {
        return CreateNode(typeof(T), x, y, data);
    }

    public (EdgeInfo? Edge, string? Error) Connect(FlowSocket from, FlowSocket to)
    {
        return Connect(from.FlowNode!.Id,to.FlowNode!.Id,from.Name,to.Name);
    }


    public (EdgeInfo? Edge, string? Error) Connect(string fromNodeId, string toNodeId, string fromSocketName, string toSocketName)
    {

        if (Edges.Any(x => x.FromSocket.Name == fromSocketName && x.ToSocket.Name == toSocketName
            && x.FromSocket.FlowNode!.Id == fromNodeId && x.ToSocket.FlowNode!.Id == toNodeId))

            return (null, "Already Exists Link");


        var fromNode = GetNodeById(fromNodeId);
        var toNode = GetNodeById(toNodeId);

        if (fromNode == null)
            return (null,"supplied fromNodeId didn't exist: " + fromNodeId);
        if (toNode == null)
            return (null,"supplied toNodeId didn't exist: " + toNodeId);

        var fromSocket = fromNode.OutputSockets.GetValueOrDefault(fromSocketName);
        var toSocket = toNode.InputSockets.GetValueOrDefault(toSocketName);

        if (fromSocket == null)
            return (null,"supplied from socket name didn't exist: " + fromSocketName);

        if (toSocket == null)
            return (null,"supplied to socket name didn't exist: " + toSocketName);

        if (fromSocket.Type == toSocket.Type)
            return(null,"can't connect sockets of same type");


        var id = Guid.NewGuid().ToString();
        Dictionary<string, object> data = new();

        data[nameof(FlowEdge.Graph)] = this;
        data[nameof(FlowEdge.Id)] = id;
        data[nameof(FlowEdge.FromSocket)] = fromSocket;
        data[nameof(FlowEdge.ToSocket)] = toSocket;

        EdgesInfo.Add(id, new EdgeInfo { Id = id, Component = null, Parameters = data });
        EdgeAdded?.Invoke(this, EventArgs.Empty);

        return (EdgesInfo[id],null);
    }

    public FlowNodeBase? GetNodeById(string id)
    {
        if (NodesInfo.ContainsKey(id))
            return NodesInfo[id].Instance;
        return null;
    }

    public ValueTask SelectNodesAsync(params string[] nodeIds)
    {
        if (Canvas == null)
            return ValueTask.CompletedTask;
        return Canvas.SelectNodesAsync(nodeIds);
    }


    public ValueTask ClearNodeSelectionAsync()
    {
        if (Canvas == null)
            return ValueTask.CompletedTask;
        return Canvas.ClearNodeSelectionAsync();
    }



    public EventHandler? NodeAdded;
    public EventHandler? EdgeAdded;

}
