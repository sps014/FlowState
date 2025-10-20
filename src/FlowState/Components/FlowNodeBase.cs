using System.Diagnostics.CodeAnalysis;
using FlowState.Models;
using FlowState.Models.Execution;
using FlowState.Models.Serializable;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Rendering;
using Microsoft.JSInterop;

namespace FlowState.Components;

/// <summary>
/// Base class for all flow nodes in the graph
/// </summary>
public abstract class FlowNodeBase : ComponentBase, IDisposable, ISerializable<NodeProperties>
{
    // Properties

    /// <summary>
    /// Gets or sets the X coordinate of the node
    /// </summary>
    [Parameter]
    public double X { get; set; }

    /// <summary>
    /// Gets or sets the Y coordinate of the node
    /// </summary>
    [Parameter]
    public double Y { get; set; }

    /// <summary>
    /// Gets or sets the unique identifier for this node
    /// </summary>
    [EditorRequired]
    [Parameter]
    public string Id { get; set; }

    /// <summary>
    /// Gets or sets the graph that contains this node
    /// </summary>
    [Parameter]
    public FlowGraph? Graph { get; set; }

    /// <summary>
    /// Gets all sockets (both input and output) for this node
    /// </summary>
    public IReadOnlyList<FlowSocket> Sockets => [.. inputSockets.Values, .. outputSockets.Values];

    /// <summary>
    /// Gets all input sockets for this node
    /// </summary>
    public IReadOnlyDictionary<string, FlowSocket> InputSockets => inputSockets;

    /// <summary>
    /// Gets all output sockets for this node
    /// </summary>
    public IReadOnlyDictionary<string, FlowSocket> OutputSockets => outputSockets;

    internal FlowNode? DomElement;

    private Dictionary<string, FlowSocket> inputSockets = new();
    private Dictionary<string, FlowSocket> outputSockets = new();

    // Abstract Methods

    /// <summary>
    /// Executes the node's logic
    /// </summary>
    /// <returns>A task representing the asynchronous operation</returns>
    public abstract ValueTask ExecuteAsync(FlowExecutionContext context);

    /// <summary>
    /// Called before graph execution starts for all nodes.
    /// Override this method to reset node state, clear cached data, or prepare for execution.
    /// </summary>
    /// <returns>A task representing the asynchronous operation</returns>
    public virtual ValueTask BeforeGraphExecutionAsync()
    {
        return ValueTask.CompletedTask;
    }

    // Public Methods

    /// <summary>
    /// Gets a socket by its name and type
    /// </summary>
    /// <param name="name">The name of the socket</param>
    /// <param name="type">The type of socket (Input or Output)</param>
    /// <returns>The socket if found, otherwise null</returns>
    public FlowSocket? GetSocketByName(string name, SocketType type)
    {
        if (type == SocketType.Input)
            return InputSockets.GetValueOrDefault(name);
        return outputSockets.GetValueOrDefault(name);
    }

    /// <summary>
    /// Adds a socket to this node
    /// </summary>
    /// <param name="flowSocket">The socket to add</param>
    /// <exception cref="Exception">Thrown if a socket with the same name and type already exists</exception>
    public void AddSocket(FlowSocket flowSocket)
    {
        if (flowSocket.Type == SocketType.Input)
        {
            if (!inputSockets.TryAdd(flowSocket.Name, flowSocket))
            {
                throw new Exception("Already a Socket[type=Input] exists with the same name : " + flowSocket.Name);
            }
        }
        else
        {
            if (!outputSockets.TryAdd(flowSocket.Name, flowSocket))
            {
                throw new Exception("Already a Socket[type=Output] exists with the same name : " + flowSocket.Name);
            }
        }
    }

    /// <summary>
    /// Gets the serializable representation of this node
    /// </summary>
    /// <returns>A NodeProperties object containing the node's state</returns>
    public async ValueTask<NodeProperties> GetSerializableObjectAsync()
    {

        var position = await DomElement!.GetTransformPositionAsync();
        X = position.X;
        Y = position.Y;


        var properties = this.GetType().GetProperties();

        var parameterProperties = properties
            .Where(p => p.GetCustomAttributes(typeof(ParameterAttribute), false).Any()).ToList();
        var parameterValues = parameterProperties
            .ToDictionary(p => p.Name, p => new { Value = p.GetValue(this), Type = p.PropertyType });

        parameterValues ??= new();
        parameterValues.Remove(nameof(Graph));


        var data = new Dictionary<string, StoredProperty>();

        foreach (var (k, v) in parameterValues)
        {
            data[k] = new StoredProperty(v.Type.AssemblyQualifiedName!, v.Value);
        }

        return new NodeProperties(GetType().AssemblyQualifiedName!, Id, data);
    }

    /// <summary>
    /// Performs initialization after the component has rendered
    /// </summary>
    /// <param name="firstRender">Whether this is the first time the component has rendered</param>
    protected override void OnAfterRender(bool firstRender)
    {
        base.OnAfterRender(firstRender);

        if (!firstRender)
            return;

        if (Graph != null && Graph.Canvas != null)
            Graph.Canvas.Refresh();
    }


    /// <summary>
    /// Disposes of the node and clears all sockets
    /// </summary>
    public void Dispose()
    {
        inputSockets.Clear();
        outputSockets.Clear();
    }
}
