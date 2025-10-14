using System.Collections.ObjectModel;
using FlowState.Components;
using FlowState.Models.Serializable;
using FlowState.Models.Events;
using Microsoft.AspNetCore.Components;
using FlowState.Models.Execution;
using System.Text.Json;

namespace FlowState.Models;

/// <summary>
/// Represents a flow-based node graph with nodes and edges
/// </summary>
public class FlowGraph : ISerializable<GraphData>
{
    // Properties
    
    /// <summary>
    /// Registry for managing node types
    /// </summary>
    public FlowNodeRegistry NodeRegistry { get; } = new FlowNodeRegistry();
    
    /// <summary>
    /// Registry for managing type compatibility between sockets
    /// </summary>
    public TypeCompatibiltyRegistry TypeCompatibiltyRegistry { get; } = new TypeCompatibiltyRegistry();
    
    /// <summary>
    /// Gets the collection of nodes in the graph
    /// </summary>
    public IReadOnlyList<FlowNodeBase> Nodes => NodesInfo.Values.Where(n => n.Instance != null).Select(ny => ny.Instance!).ToList();
    
    /// <summary>
    /// Gets the collection of edges in the graph
    /// </summary>
    public IReadOnlyList<FlowEdge> Edges => EdgesInfo.Values.Where(n => n.Instance != null).Select(ny => ny.Instance!).ToList();

    /// <summary>
    /// Gets or sets the canvas associated with this graph
    /// </summary>
    public FlowCanvas? Canvas { get; set; }

    internal Dictionary<string, NodeInfo> NodesInfo { get; } = new();
    internal Dictionary<string, EdgeInfo> EdgesInfo { get; } = new();


    private FlowGraphExecution executionFlow;

    public FlowGraph()
    {
        executionFlow = new FlowGraphExecution(this);
    }

    // Node Management Methods

    /// <summary>
    /// Registers a node type for use in the graph
    /// </summary>
    /// <typeparam name="T">The node type to register</typeparam>
    public void RegisterNode<T>() where T : FlowNodeBase
    {
        NodeRegistry.Register<T>();
    }

    /// <summary>
    /// Creates a new node in the graph at the specified position
    /// </summary>
    /// <param name="type">The type of node to create</param>
    /// <param name="x">The X coordinate</param>
    /// <param name="y">The Y coordinate</param>
    /// <param name="data">Initial data for the node</param>
    /// <param name="supressEvent">If true, does not fire NodeAdded event</param>
    /// <returns>Information about the created node</returns>
    public NodeInfo CreateNode(Type type, double x, double y, Dictionary<string, object?> data, bool supressEvent = false)
    {
        var id = Guid.CreateVersion7().ToString();

        data[nameof(FlowNodeBase.Graph)] = this;

        if (!data.ContainsKey(nameof(FlowNodeBase.Id)))
            data[nameof(FlowNodeBase.Id)] = id;

        id = data[nameof(FlowNodeBase.Id)]!.ToString()!;

        data[nameof(FlowNodeBase.X)] = x;
        data[nameof(FlowNodeBase.Y)] = y;

        NodesInfo.Add(id, new NodeInfo { Id = id, NodeType = type, Component = null, Parameters = data });

        if (!supressEvent)
            NodeAdded?.Invoke(this, new NodeAddedEventArgs
            {
                NodeId = id,
                NodeType = type,
                X = x,
                Y = y
            });

        return NodesInfo[id];
    }

    /// <summary>
    /// Creates a new node in the graph at the specified position
    /// </summary>
    /// <param name="type">The fully qualified type name of the node</param>
    /// <param name="x">The X coordinate</param>
    /// <param name="y">The Y coordinate</param>
    /// <param name="data">Initial data for the node</param>
    /// <param name="supressEvent">If true, does not fire NodeAdded event</param>
    /// <returns>Information about the created node</returns>
    public NodeInfo CreateNode(string type, double x, double y, Dictionary<string, object?> data, bool supressEvent = false)
    {
        var parsedType = Type.GetType(type);
        if (parsedType == null)
            throw new Exception("Invalid type: " + type);

        return CreateNode(parsedType, x, y, data, supressEvent);
    }

    /// <summary>
    /// Creates a new node in the graph at the specified position
    /// </summary>
    /// <typeparam name="T">The type of node to create</typeparam>
    /// <param name="x">The X coordinate</param>
    /// <param name="y">The Y coordinate</param>
    /// <param name="data">Initial data for the node</param>
    /// <param name="supressEvent">If true, does not fire NodeAdded event</param>
    /// <returns>Information about the created node</returns>
    public NodeInfo CreateNode<T>(double x, double y, Dictionary<string, object?> data, bool supressEvent = false) where T : FlowNodeBase
    {
        return CreateNode(typeof(T), x, y, data, supressEvent);
    }

    /// <summary>
    /// Removes a node from the graph by its ID and all connected edges
    /// </summary>
    /// <param name="id">The ID of the node to remove</param>
    public void RemoveNode(string id)
    {
        var node = GetNodeById(id);

        if (node == null)
            return;

        var edges = EdgesInfo.Where(x => x.Value.Instance != null
            && (x.Value.Instance.ToSocket?.FlowNode == node
            || x.Value.Instance.FromSocket?.FlowNode == node));

        foreach (var edge in edges)
        {
            RemoveEdge(edge.Key);
        }

        NodesInfo.Remove(id);
        NodeRemoved?.Invoke(this, new NodeRemovedEventArgs { NodeId = id });
    }

    /// <summary>
    /// Removes all nodes from the graph
    /// </summary>
    public void RemoveAllNodes()
    {
        if (NodesInfo.Count == 0)
            return;

        var nodeIds = new string[NodesInfo.Count];
        NodesInfo.Keys.CopyTo(nodeIds, 0);

        NodesInfo.Clear();

        AllNodesCleared?.Invoke(this, EventArgs.Empty);
    }

    /// <summary>
    /// Gets a node by its ID
    /// </summary>
    /// <param name="id">The ID of the node</param>
    /// <returns>The node, or null if not found</returns>
    public FlowNodeBase? GetNodeById(string id)
    {
        if (NodesInfo.ContainsKey(id))
            return NodesInfo[id].Instance;
        return null;
    }

    // Edge Management Methods

    /// <summary>
    /// Creates a connection between two sockets
    /// </summary>
    /// <param name="from">The source socket</param>
    /// <param name="to">The destination socket</param>
    /// <param name="checkDataType">If true, validates data type compatibility</param>
    /// <returns>A tuple containing the edge info and any error message</returns>
    public (EdgeInfo? Edge, string? Error) Connect(FlowSocket from, FlowSocket to, bool checkDataType = false)
    {
        return Connect(from.FlowNode!.Id, to.FlowNode!.Id, from.Name, to.Name, checkDataType);
    }

    /// <summary>
    /// Creates a connection between two nodes by socket names
    /// </summary>
    /// <param name="fromNodeId">The ID of the source node</param>
    /// <param name="toNodeId">The ID of the destination node</param>
    /// <param name="fromSocketName">The name of the source socket</param>
    /// <param name="toSocketName">The name of the destination socket</param>
    /// <param name="checkDataType">If true, validates data type compatibility</param>
    /// <returns>A tuple containing the edge info and any error message</returns>
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

    /// <summary>
    /// Removes an edge from the graph by its ID
    /// </summary>
    /// <param name="id">The ID of the edge to remove</param>
    public void RemoveEdge(string id)
    {
        if (!EdgesInfo.ContainsKey(id))
            return;

        EdgesInfo.Remove(id);
        EdgeRemoved?.Invoke(this, new EdgeRemovedEventArgs { EdgeId = id });
    }

    /// <summary>
    /// Removes all edges from the graph
    /// </summary>
    public void RemoveAllEdges()
    {
        if (EdgesInfo.Count == 0)
            return;

        var edgeIds = new string[EdgesInfo.Count];
        EdgesInfo.Keys.CopyTo(edgeIds, 0);

        EdgesInfo.Clear();

        AllEdgesCleared?.Invoke(this, EventArgs.Empty);
    }

    // Selection Methods

    /// <summary>
    /// Selects nodes in the canvas by their IDs
    /// </summary>
    /// <param name="nodeIds">The IDs of the nodes to select</param>
    /// <returns>A task representing the asynchronous operation</returns>
    public ValueTask SelectNodesAsync(params string[] nodeIds)
    {
        if (Canvas == null)
            return ValueTask.CompletedTask;
        return Canvas.SelectNodesAsync(nodeIds);
    }

    /// <summary>
    /// Clears the current node selection in the canvas
    /// </summary>
    /// <returns>A task representing the asynchronous operation</returns>
    public ValueTask ClearNodeSelectionAsync()
    {
        if (Canvas == null)
            return ValueTask.CompletedTask;
        return Canvas.ClearNodeSelectionAsync();
    }

    /// <summary>
    /// Gets the IDs of currently selected nodes
    /// </summary>
    /// <returns>An array of selected node IDs</returns>
    public ValueTask<string[]> GetSelectedNodesAsync()
    {
        if (Canvas == null)
            throw new Exception("Canvas is not set");
        return Canvas.GetSelectedNodesAsync();
    }


    // Graph Execution Methods

    /// <summary>
    /// Executes the graph
    /// </summary>
    public ValueTask ExecuteAsync(CancellationToken cancellationToken=default)
    {
        if(Canvas==null)
            throw new Exception("Canvas is not set");
        return executionFlow.ExecuteAsync(Canvas.ExecutionDirection, cancellationToken);
    }

    // Serialization Methods

    /// <summary>
    /// Gets the serializable representation of the graph
    /// </summary>
    /// <returns>A GraphData object containing all graph information</returns>
    public async ValueTask<GraphData> GetSerializableObjectAsync()
    {
        if (Canvas == null)
            throw new Exception("Canvas is not set");
        var canvas = await Canvas.GetViewportPropertiesAsync();

        var nodesProperties = new List<NodeProperties>();
        var edgesProperties = new List<EdgeProperties>();

        foreach (var node in Nodes)
        {
            var nodeProperties = await node.GetSerializableObjectAsync();
            nodesProperties.Add(nodeProperties);
        }

        foreach (var edge in Edges)
        {
            var edgeProperties = await edge.GetSerializableObjectAsync();
            edgesProperties.Add(edgeProperties);
        }
        return new GraphData { Canvas = canvas, Nodes = nodesProperties, Edges = edgesProperties };
    }

    /// <summary>
    /// Serializes the graph to a JSON string
    /// </summary>
    /// <returns>A JSON string representing the graph</returns>
    public async ValueTask<string> SerializeAsync()
    {
        var data = await GetSerializableObjectAsync();
        return JsonSerializer.Serialize(data);
    }

    /// <summary>
    /// Deserializes a graph from a JSON string
    /// </summary>
    /// <param name="data">The JSON string to deserialize</param>
    /// <returns>A task representing the asynchronous operation</returns>
    public ValueTask DeserializeAsync(string data)
    {
        var graphData = JsonSerializer.Deserialize<GraphData>(data);
        if (graphData == null)
            throw new Exception("Invalid graph data");
        return DeserializeAsync(graphData);
    }

    /// <summary>
    /// Deserializes a graph from a GraphData object
    /// </summary>
    /// <param name="graphData">The GraphData object to deserialize</param>
    /// <returns>A task representing the asynchronous operation</returns>
    public async ValueTask DeserializeAsync(GraphData graphData)
    {
        if (Canvas == null)
            throw new Exception("Canvas is not set");

        await ClearAsync();

        await Canvas.SetViewportPropertiesAsync(graphData.Canvas);

        foreach (var node in graphData.Nodes)
        {
            var type = Type.GetType(node.Type)!;
            _ = CreateNode(type, node.X, node.Y, node.GetRawDictionary());
        }

        ForcedRequestDomStateChanged?.Invoke(this, EventArgs.Empty);

        await Task.Delay(100);

        foreach (var edge in graphData.Edges)
        {
            _ = Connect(edge.FromNodeId, edge.ToNodeId, edge.FromSocketName, edge.ToSocketName);
        }

        ForcedRequestDomStateChanged?.Invoke(this, EventArgs.Empty);
    }


    /// <summary>
    /// Clears the entire graph including all nodes and edges
    /// </summary>
    /// <returns>A task representing the asynchronous operation</returns>
    public ValueTask ClearAsync()
    {
        if (Canvas == null)
            throw new Exception("Canvas is not set");
        return Canvas.ClearAsync();
    }

    // Private Helper Methods

    private bool IsDataTypeCompatibile(FlowSocket fromSocket, FlowSocket toSocket)
    {
        if (toSocket.T == typeof(object))
            return true;

        if (TypeCompatibiltyRegistry.IsCompatible(fromSocket.T, toSocket.T))
            return true;

        return toSocket.T == fromSocket.T;
    }

    // Events

    /// <summary>
    /// Fired when a node is added to the graph
    /// </summary>
    public event EventHandler<NodeAddedEventArgs>? NodeAdded;

    /// <summary>
    /// Fired when an edge is added to the graph
    /// </summary>
    public event EventHandler<EdgeAddedEventArgs>? EdgeAdded;

    /// <summary>
    /// Fired when a node is removed from the graph
    /// </summary>
    public event EventHandler<NodeRemovedEventArgs>? NodeRemoved;

    /// <summary>
    /// Fired when an edge is removed from the graph
    /// </summary>
    public event EventHandler<EdgeRemovedEventArgs>? EdgeRemoved;

    /// <summary>
    /// Fired when all nodes are cleared from the graph
    /// </summary>
    public event EventHandler? AllNodesCleared;

    /// <summary>
    /// Fired when all edges are cleared from the graph
    /// </summary>
    public event EventHandler? AllEdgesCleared;

    /// <summary>
    /// Fired when a forced DOM state change is requested
    /// </summary>
    public event EventHandler? ForcedRequestDomStateChanged;

}
