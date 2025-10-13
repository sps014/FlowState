using System.Diagnostics.CodeAnalysis;
using FlowState.Models;
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
    public abstract ValueTask ExecuteAsync();

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
        var properties = this.GetType().GetProperties();
        var parameterProperties = properties.Where(p => p.GetCustomAttributes(typeof(ParameterAttribute), false).Any()).ToList();
        var parameterValues = parameterProperties.ToDictionary(p => p.Name, p => p.GetValue(this));
        parameterValues ??= new();
        parameterValues.Remove(nameof(Graph));

        var position = await DomElement!.GetTransformPositionAsync();
        parameterValues[nameof(X)] = position.X;
        parameterValues[nameof(Y)] = position.Y;

        return new NodeProperties(GetType().AssemblyQualifiedName!, Id, parameterValues);
    }

    protected override void OnParametersSet()
    {
        base.OnParametersSet();
        StateHasChanged();

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
