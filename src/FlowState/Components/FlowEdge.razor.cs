using System.Diagnostics;
using FlowState.Models;
using FlowState.Models.Serializable;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace FlowState.Components
{
    public partial class FlowEdge : ISerializable<EdgeProperties>
    {

        internal ElementReference edgeRef;

        [Parameter]
        public string? Style { get; set; }


        [EditorRequired]
        [Parameter]
        public string Id { get; set; }

        [EditorRequired]
        [Parameter]
        public FlowGraph? Graph { get; set; }

        [Parameter]
        public string Stroke { get; set; } = "#10b981";

        [Parameter]
        public string Fill { get; set; } = "none";

        [Parameter]
        public double StrokeWidth { get; set; } = 2.5;

        [Parameter]
        public FlowSocket? FromSocket { get; set; }

        [Parameter]
        public FlowSocket? ToSocket { get; set; }

        [Parameter]
        public string StrokeLineCap { get; set; } = "round";

        [Parameter(CaptureUnmatchedValues = true)]
        public Dictionary<string, object>? InputAttributes { get; set; } = [];


        [Parameter]
        public bool IsTempEdge { get; set; } = false;


        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            await base.OnAfterRenderAsync(firstRender);

            if (!firstRender)
                return;

            if (Graph == null || Graph.Canvas == null)
                return;


            if (!IsTempEdge && FromSocket != null && ToSocket != null)
            {
                await Graph.Canvas.AddEdgeToNodeEdgeMapAsync(this, FromSocket.FlowNode!);
                await Graph.Canvas.AddEdgeToNodeEdgeMapAsync(this, ToSocket.FlowNode!);
                await UpdatePathAsync();
            }

        }

        public ValueTask UpdatePathAsync()
        {
            if (Graph == null || Graph.Canvas == null || FromSocket == null || ToSocket == null)
                return ValueTask.CompletedTask;
            return Graph.Canvas.JsModule.InvokeVoidAsync("updatePath", ToSocket.anchorRef, FromSocket.anchorRef, edgeRef);
        }

        public ValueTask SetTempEdgeElementAsync()
        {
            if (Graph == null || Graph.Canvas == null)
                return ValueTask.CompletedTask;

            return Graph.Canvas.JsModule.InvokeVoidAsync("setTempEdgeElement", edgeRef);
        }

        public void SetGraph(FlowGraph flowGraph)
        {
            Graph = flowGraph;
        }

        public void Refresh()
        {
            StateHasChanged();
        }

        public async ValueTask DisposeAsync()
        {
            if (Graph == null || Graph.Canvas == null || IsTempEdge)
                return;

            try
            {

                await Graph.Canvas.RemoveEdgeFromNodeEdgeMapAsync(this, FromSocket?.FlowNode!);
                await Graph.Canvas.RemoveEdgeFromNodeEdgeMapAsync(this, ToSocket?.FlowNode!);
            }
            catch
            {
                Debug.Write("Failed to dispose");
            }
        }

        public ValueTask<EdgeProperties> GetSerializableObjectAsync()
        {
            return ValueTask.FromResult(new EdgeProperties(Id,
                    FromSocket!.FlowNode!.Id, ToSocket!.FlowNode!.Id,
                    FromSocket.Name, ToSocket.Name));
        }
    }
}