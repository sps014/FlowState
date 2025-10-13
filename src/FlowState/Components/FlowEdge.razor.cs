using System.Diagnostics;
using FlowState.Models;
using FlowState.Models.Serializable;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace FlowState.Components
{
    /// <summary>
    /// Represents a connection between two sockets in the flow graph
    /// </summary>
    public partial class FlowEdge : ISerializable<EdgeProperties>
    {
        internal ElementReference edgeRef;

        // Properties

        /// <summary>
        /// Gets or sets custom CSS styles for the edge
        /// </summary>
        [Parameter]
        public string? Style { get; set; }

        /// <summary>
        /// Gets or sets the unique identifier for this edge
        /// </summary>
        [EditorRequired]
        [Parameter]
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets the graph that contains this edge
        /// </summary>
        [EditorRequired]
        [Parameter]
        public FlowGraph? Graph { get; set; }

        /// <summary>
        /// Gets or sets the stroke color of the edge line
        /// </summary>
        [Parameter]
        public string Stroke { get; set; } = "#10b981";

        /// <summary>
        /// Gets or sets the fill color for the edge
        /// </summary>
        [Parameter]
        public string Fill { get; set; } = "none";

        /// <summary>
        /// Gets or sets the width of the edge line
        /// </summary>
        [Parameter]
        public double StrokeWidth { get; set; } = 2.5;

        /// <summary>
        /// Gets or sets the source socket for this edge
        /// </summary>
        [Parameter]
        public FlowSocket? FromSocket { get; set; }

        /// <summary>
        /// Gets or sets the destination socket for this edge
        /// </summary>
        [Parameter]
        public FlowSocket? ToSocket { get; set; }

        /// <summary>
        /// Gets or sets the line cap style for the stroke
        /// </summary>
        [Parameter]
        public string StrokeLineCap { get; set; } = "round";

        /// <summary>
        /// Gets or sets additional HTML attributes to apply to the edge element
        /// </summary>
        [Parameter(CaptureUnmatchedValues = true)]
        public Dictionary<string, object>? InputAttributes { get; set; } = [];

        /// <summary>
        /// Gets or sets whether this is a temporary edge being dragged
        /// </summary>
        [Parameter]
        public bool IsTempEdge { get; set; } = false;

        private string? strokeColorCopy;

        // Lifecycle Methods

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            await base.OnAfterRenderAsync(firstRender);

            if (!firstRender)
                return;

            if (Graph == null || Graph.Canvas == null)
                return;

            strokeColorCopy = Stroke;

            if (!IsTempEdge && FromSocket != null && ToSocket != null)
            {
                await Graph.Canvas.AddEdgeToNodeEdgeMapAsync(this, FromSocket.FlowNode!);
                await Graph.Canvas.AddEdgeToNodeEdgeMapAsync(this, ToSocket.FlowNode!);
                ToSocket.Connections++;
                FromSocket.Connections++;
                await UpdatePathAsync();
            }

            if (Graph.Canvas.AutoUpdateSocketColors && FromSocket != null)
            {
                Stroke = FromSocket.InnerColor;

                if (ToSocket != null)
                    ToSocket.AutoUpdateSocketColor(FromSocket.InnerColor, FromSocket.OuterColor);

                StateHasChanged();
            }
        }

        // Public Methods

        /// <summary>
        /// Updates the visual path of the edge between sockets
        /// </summary>
        /// <returns>A task representing the asynchronous operation</returns>
        public ValueTask UpdatePathAsync()
        {
            if (Graph == null || Graph.Canvas == null || FromSocket == null || ToSocket == null)
                return ValueTask.CompletedTask;
            return Graph.Canvas.JsModule.InvokeVoidAsync("updatePath", ToSocket.anchorRef, FromSocket.anchorRef, edgeRef);
        }

        /// <summary>
        /// Sets this edge as a temporary edge element
        /// </summary>
        /// <returns>A task representing the asynchronous operation</returns>
        public ValueTask SetTempEdgeElementAsync()
        {
            if (Graph == null || Graph.Canvas == null)
                return ValueTask.CompletedTask;

            return Graph.Canvas.JsModule.InvokeVoidAsync("setTempEdgeElement", edgeRef);
        }

        /// <summary>
        /// Sets the graph associated with this edge
        /// </summary>
        /// <param name="flowGraph">The flow graph to associate with this edge</param>
        public void SetGraph(FlowGraph flowGraph)
        {
            Graph = flowGraph;
        }

        /// <summary>
        /// Triggers a re-render of the edge component
        /// </summary>
        public void Refresh()
        {
            StateHasChanged();
        }

        /// <summary>
        /// Disposes of the edge and cleans up connections
        /// </summary>
        /// <returns>A task representing the asynchronous operation</returns>
        public async ValueTask DisposeAsync()
        {
            if (Graph == null || Graph.Canvas == null || IsTempEdge)
                return;

            if (ToSocket != null && Graph.Canvas.AutoUpdateSocketColors)
            {
                ToSocket.ResetColor();
            }

            try
            {
                if (FromSocket != null)
                {
                    FromSocket.Connections--;
                    await Graph.Canvas.RemoveEdgeFromNodeEdgeMapAsync(this, FromSocket.FlowNode!);
                }
                if (ToSocket != null)
                {
                    ToSocket.Connections--;
                    await Graph.Canvas.RemoveEdgeFromNodeEdgeMapAsync(this, ToSocket.FlowNode!);
                }
            }
            catch
            {
                Debug.Write("Failed to dispose");
            }
        }

        /// <summary>
        /// Gets the serializable representation of this edge
        /// </summary>
        /// <returns>An EdgeProperties object containing the edge's state</returns>
        public ValueTask<EdgeProperties> GetSerializableObjectAsync()
        {
            return ValueTask.FromResult(new EdgeProperties(Id,
                    FromSocket!.FlowNode!.Id, ToSocket!.FlowNode!.Id,
                    FromSocket.Name, ToSocket.Name));
        }
    }
}
