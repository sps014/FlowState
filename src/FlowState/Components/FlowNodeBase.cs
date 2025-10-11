using System.Diagnostics.CodeAnalysis;
using FlowState.Models;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Rendering;
using Microsoft.JSInterop;

namespace FlowState.Components;

public abstract class FlowNodeBase : ComponentBase, IDisposable
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
    public IReadOnlyDictionary<string,FlowSocket> OutputSockets => outputSockets;


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
    public void Dispose()
    {

    }
}