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


    private List<FlowSocket> sockets = new();

    public IReadOnlyList<FlowSocket> Sockets => sockets;

    public void AddSocket(FlowSocket flowSocket)
    {
        sockets.Add(flowSocket);
    }
    public void Dispose()
    {

    }
}