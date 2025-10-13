using System.Diagnostics.CodeAnalysis;
using FlowState.Models;
using FlowState.Models.Serializable;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Rendering;
using Microsoft.JSInterop;

namespace FlowState.Components;

public abstract class FlowNodeBase : ComponentBase, IDisposable, ISerializable<NodeProperties>
{
    [Parameter]
    public double X { get; set; }

    [Parameter]
    public double Y { get; set; }

    [EditorRequired]
    [Parameter]
    public string Id { get; set; }
    public abstract ValueTask ExecuteAsync();

    [Parameter]
    public FlowGraph? Graph { get; set; }

    internal FlowNode? DomElement;


    private Dictionary<string, FlowSocket> inputSockets = new();
    private Dictionary<string, FlowSocket> outputSockets = new();


    public IReadOnlyList<FlowSocket> Sockets => [.. inputSockets.Values, .. outputSockets.Values];
    public IReadOnlyDictionary<string,FlowSocket> InputSockets => inputSockets;
    public IReadOnlyDictionary<string, FlowSocket> OutputSockets => outputSockets;
    

    public FlowSocket? GetSocketByName(string name,SocketType type)
    {
        if (type == SocketType.Input)
            return InputSockets.GetValueOrDefault(name);
        return outputSockets.GetValueOrDefault(name);
    }
    public void AddSocket(FlowSocket flowSocket)
    {
        if (flowSocket.Type == SocketType.Input)
        {
            if (!inputSockets.TryAdd(flowSocket.Name, flowSocket))
            {
                throw new Exception("Alreafy a Socket[type=Input] exists with the same name : " + flowSocket.Name);
            }
        }
        else
        {
            if (!outputSockets.TryAdd(flowSocket.Name, flowSocket))
            {
                throw new Exception("Alreafy a Socket[type=Output] exists with the same name : " + flowSocket.Name);
            }
        }
    }

    public async ValueTask<NodeProperties> GetSerializableObjectAsync()
    {
        //all [Parameter] properties, except Graph
        var properties = this.GetType().GetProperties();
        var parameterProperties = properties.Where(p => p.GetCustomAttributes(typeof(ParameterAttribute), false).Any()).ToList();
        var parameterValues = parameterProperties.ToDictionary(p => p.Name, p => p.GetValue(this));
        parameterValues ??= new();
        parameterValues.Remove(nameof(Graph));

        var position = await DomElement!.GetTransformPositionAsync();
        parameterValues[nameof(X)] = position.X;
        parameterValues[nameof(Y)] = position.Y;

        return new  NodeProperties(GetType().AssemblyQualifiedName!, Id, parameterValues);
    }

    
    public void Dispose()
    {

    }
}