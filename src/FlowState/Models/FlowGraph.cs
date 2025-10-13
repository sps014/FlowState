using System.Collections.ObjectModel;
using Newtonsoft.Json;
using FlowState.Components;
using FlowState.Models.Serializable;
using FlowState.Models.Events;
using Microsoft.AspNetCore.Components;

namespace FlowState.Models;

public class FlowGraph : ISerializable<GraphData>
{
    public FlowNodeRegistry NodeRegistry { get; } = new FlowNodeRegistry();
    public TypeCompatibiltyRegistry TypeCompatibiltyRegistry { get; } = new TypeCompatibiltyRegistry();
    internal Dictionary<string, NodeInfo> NodesInfo { get; } = new();
    internal Dictionary<string, EdgeInfo> EdgesInfo { get; } = new();

    public IReadOnlyList<FlowNodeBase> Nodes => NodesInfo.Values.Where(n => n.Instance != null).Select(ny => ny.Instance!).ToList();
    public IReadOnlyList<FlowEdge> Edges => EdgesInfo.Values.Where(n => n.Instance != null).Select(ny => ny.Instance!).ToList();


    public FlowCanvas? Canvas { get; set; }

    public void RegisterNode<T>() where T : FlowNodeBase
    {
        NodeRegistry.Register<T>();
    }

    public NodeInfo CreateNode(Type type, double x, double y, Dictionary<string, object?> data,bool supressEvent=false)
    {
        var id = Guid.CreateVersion7().ToString();

        data[nameof(FlowNodeBase.Graph)] = this;

        if (!data.ContainsKey(nameof(FlowNodeBase.Id)))
            data[nameof(FlowNodeBase.Id)] = id;

        id = data[nameof(FlowNodeBase.Id)]!.ToString()!;

        data[nameof(FlowNodeBase.X)] = x;
        data[nameof(FlowNodeBase.Y)] = y;

        NodesInfo.Add(id, new NodeInfo { Id = id, NodeType = type, Component = null, Parameters = data });

        if(!supressEvent)
            NodeAdded?.Invoke(this, new NodeAddedEventArgs 
            { 
                NodeId = id, 
                NodeType = type, 
                X = x, 
                Y = y 
            });

        return NodesInfo[id];
    }

    public NodeInfo CreateNode(string type, double x, double y, Dictionary<string, object?> data,bool supressEvent=false)
    {
        var parsedType = Type.GetType(type);
        if(parsedType==null)
            throw new Exception("Invalid type: " + type);
            
        return CreateNode(parsedType, x, y, data,supressEvent);
    }

    public NodeInfo CreateNode<T>(double x, double y, Dictionary<string, object?> data,bool supressEvent=false) where T : FlowNodeBase
    {
        return CreateNode(typeof(T), x, y, data,supressEvent);
    }

    public void RemoveNode(string id)
    {
        var node = GetNodeById(id);

        if (node == null)
            return;

        var edges = EdgesInfo.Where(x => x.Value.Instance != null
            && (x.Value.Instance.ToSocket?.FlowNode == node
            || x.Value.Instance.FromSocket?.FlowNode == node));

        foreach(var edge in edges)
        {
            RemoveEdge(edge.Key);
        }

        NodesInfo.Remove(id);
        NodeRemoved?.Invoke(this, new NodeRemovedEventArgs { NodeId = id });
    }
    public void RemoveEdge(string id)
    {
        if (!EdgesInfo.ContainsKey(id))
            return;
            
        EdgesInfo.Remove(id);
        EdgeRemoved?.Invoke(this, new EdgeRemovedEventArgs { EdgeId = id });
    }

    public void RemoveAllEdges()
    {
        if (EdgesInfo.Count == 0)
            return;
            
        var edgeIds = new string[EdgesInfo.Count];
        EdgesInfo.Keys.CopyTo(edgeIds, 0);
        
        EdgesInfo.Clear();
        
        AllEdgesCleared?.Invoke(this, EventArgs.Empty);
    }
    
    public void RemoveAllNodes()
    {
        if (NodesInfo.Count == 0)
            return;
            
        var nodeIds = new string[NodesInfo.Count];
        NodesInfo.Keys.CopyTo(nodeIds, 0);
        
        NodesInfo.Clear();
        
        AllNodesCleared?.Invoke(this, EventArgs.Empty);
    }

    public (EdgeInfo? Edge, string? Error) Connect(FlowSocket from, FlowSocket to,bool checkDataType = false)
    {
        return Connect(from.FlowNode!.Id,to.FlowNode!.Id,from.Name,to.Name);
    }


    public (EdgeInfo? Edge, string? Error) Connect(string fromNodeId, string toNodeId, string fromSocketName, string toSocketName, bool checkDataType = false)
    {

        if (Edges.Any(x => x.FromSocket?.Name == fromSocketName && x.ToSocket?.Name == toSocketName
            && x.FromSocket.FlowNode!.Id == fromNodeId && x.ToSocket.FlowNode!.Id == toNodeId))

            return (null, "Link already Exists");


        var fromNode = GetNodeById(fromNodeId);
        var toNode = GetNodeById(toNodeId);

        if (fromNode == null)
            return (null, "supplied fromNodeId didn't exist: " + fromNodeId);
        if (toNode == null)
            return (null, "supplied toNodeId didn't exist: " + toNodeId);

        var fromSocket = fromNode.OutputSockets.GetValueOrDefault(fromSocketName);
        var toSocket = toNode.InputSockets.GetValueOrDefault(toSocketName);

        if (fromSocket == null)
            return (null, "supplied from socket name didn't exist: " + fromSocketName);

        if (toSocket == null)
            return (null, "supplied to socket name didn't exist: " + toSocketName);

        if (fromSocket.Type == toSocket.Type)
            return (null, "can't connect sockets of same type");

        if (checkDataType && !IsDataTypeCompatibile(fromSocket, toSocket))
            return (null, $"Incompatible Data Types {fromSocket.T}->{toSocket.T}");


        var id = Guid.NewGuid().ToString();
        Dictionary<string, object> data = new();

        data[nameof(FlowEdge.Graph)] = this;
        data[nameof(FlowEdge.Id)] = id;
        data[nameof(FlowEdge.FromSocket)] = fromSocket;
        data[nameof(FlowEdge.ToSocket)] = toSocket;

        EdgesInfo.Add(id, new EdgeInfo { Id = id, Component = null, Parameters = data });
        EdgeAdded?.Invoke(this, new EdgeAddedEventArgs 
        { 
            EdgeId = id, 
            FromNodeId = fromNodeId, 
            ToNodeId = toNodeId,
            FromSocketName = fromSocketName,
            ToSocketName = toSocketName
        });

        return (EdgesInfo[id], null);
    }
    
    private bool IsDataTypeCompatibile(FlowSocket fromSocket,FlowSocket toSocket)
    {
        if (toSocket.T == typeof(object))
            return true;

        if(TypeCompatibiltyRegistry.IsCompatible(fromSocket.T,toSocket.T))
            return true;

        return toSocket.T == fromSocket.T;
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

    public async ValueTask<GraphData> GetSerializableObjectAsync()
    {
        if(Canvas==null)
            throw new Exception("Canvas is not set");
        var canvas = await Canvas.GetViewportPropertiesAsync();

        var nodesProperties = new List<NodeProperties>();
        var edgesProperties = new List<EdgeProperties>();

        foreach(var node in Nodes)
        {
            var nodeProperties = await node.GetSerializableObjectAsync();
            nodesProperties.Add(nodeProperties);
        }

        foreach(var edge in Edges)
        {
            var edgeProperties = await edge.GetSerializableObjectAsync();
            edgesProperties.Add(edgeProperties);
        }
        return new GraphData { Canvas = canvas, Nodes = nodesProperties, Edges = edgesProperties };
    }

    public async ValueTask<string> SerializeAsync()
    {
        var data = await GetSerializableObjectAsync();
        return JsonConvert.SerializeObject(data);
    }

    public ValueTask DeserializeAsync(string data)
    {
        var graphData = JsonConvert.DeserializeObject<GraphData>(data);
        if(graphData==null)
            throw new Exception("Invalid graph data");
        return DeserializeAsync(graphData);
    }

    public async ValueTask DeserializeAsync(GraphData graphData)
    {
        if (Canvas == null)
            throw new Exception("Canvas is not set");

        await ClearAsync();

        await Canvas.SetViewportPropertiesAsync(graphData.Canvas);

        foreach (var node in graphData.Nodes)
        {
            var type = Type.GetType(node.Type)!;
            _ = CreateNode(type, node.X, node.Y, node.Data ?? []);
        }

        ForcedRequestDomStateChanged?.Invoke(this,EventArgs.Empty);


        await Task.Delay(100); // wait for the nodes to be created

        foreach (var edge in graphData.Edges)
        {
            _ = Connect(edge.FromNodeId, edge.ToNodeId, edge.FromSocketName, edge.ToSocketName);
        }

        OnDeserialzed?.Invoke(this, EventArgs.Empty);

    }

    public ValueTask<string[]> GetSelectedNodesAsync()
    {
        if (Canvas == null)
            throw new Exception("Canvas is not set");
        return Canvas.GetSelectedNodesAsync();
    }

    public ValueTask ClearAsync()
    {
        if (Canvas == null)
            throw new Exception("Canvas is not set");
        return Canvas.ClearAsync();
    }
    

    public event EventHandler<NodeAddedEventArgs>? NodeAdded;
    public event EventHandler<EdgeAddedEventArgs>? EdgeAdded;
    public event EventHandler<NodeRemovedEventArgs>? NodeRemoved;
    public event EventHandler<EdgeRemovedEventArgs>? EdgeRemoved;
    public event EventHandler? AllNodesCleared;
    public event EventHandler? AllEdgesCleared;
    public event EventHandler? ForcedRequestDomStateChanged;
    public event EventHandler? OnDeserialzed;

}
