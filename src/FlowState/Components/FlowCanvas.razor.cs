using System.Drawing;
using FlowState.Models;
using FlowState.Models.Dom;
using FlowState.Models.Events;
using FlowState.Models.Serializable;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;

namespace FlowState.Components
{
    public partial class FlowCanvas : IAsyncDisposable, ISerializable<CanvasProperties>
    {

        [EditorRequired]
        [Parameter]
        public RenderFragment? BackgroundContent { get; set; }
        public string Id { get; } = Guid.NewGuid().ToString();

        [EditorRequired]
        [Parameter]
        public FlowGraph Graph { get; set; }

        [EditorRequired]
        [Parameter]
        public string Width { get; set; } = "100%";

        [EditorRequired]
        [Parameter]
        public string Height { get; set; } = "100%";
        [Parameter] public string Style { get; set; } = string.Empty;

        [Parameter] public bool AutoUpdateSocketColors { get; set; } = true;

        [Parameter] public string NodeSelectionClass { get; set; } = "selected";
        [Parameter] public string Class { get; set; } = "flow-canvas";

        [Parameter] public double MinZoom { get; set; } = 0.2;
        [Parameter] public double MaxZoom { get; set; } = 2.0;

        [Parameter] public double Zoom { get; set; } = 1.0;

        [Parameter] public bool EdgeShouldMatchDataType { get; set; } = true;
        [Parameter] public EventCallback<PanEventArgs> OnPanned { get; set; }
        [Parameter] public EventCallback<double> OnZoomed { get; set; }
        [Parameter] public EventCallback<NodeMovedArgs> OnNodeMoved { get; set; }

        [Parameter] public EventCallback<string> OnNodeSelected { get; set; }
        [Parameter] public EventCallback<string> OnNodeDeselected { get; set; }
        // Selection changed sends an array of selected node IDs
        [Parameter] public EventCallback<string[]> OnSelectionChanged { get; set; }

        [Parameter] public EventCallback OnNotifyNodesCleared { get; set; }

        [Parameter] public EventCallback<ConnectRequestArgs> OnEdgeConnectRequest { get; set; }


        private FlowEdge? TempEdge = null;

        [Parameter]
        public EventCallback OnCanvasLoaded { get; set; }


        /// <summary>
        /// Optional override for the background grid pattern.
        /// </summary>
        [Parameter] public string GridStyle { get; set; } = string.Empty;

        private ElementReference canvasRef;
        private ElementReference flowContentRef;
        internal ElementReference gridRef;

#nullable disable
        internal IJSObjectReference JsModule;
#nullable restore

        private DotNetObjectReference<FlowCanvas>? dotnetObjRef;



        private string ContentStyle =>
            $"""
    position:absolute;
    top:0;left:0;
    transform-origin: 0 0;
    will-change:transform;
    """;

        protected override void OnInitialized()
        {
            if (Graph == null)
                throw new InvalidOperationException("FlowCanvas requires a valid FlowGraph instance.");

            Graph.Canvas = this;
            Graph.NodeAdded += Refresh;
            Graph.EdgeAdded += Refresh;
            Graph.NodeRemoved += Refresh;
            Graph.EdgeRemoved += Refresh;

            dotnetObjRef = DotNetObjectReference.Create(this);
        }

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            await base.OnAfterRenderAsync(firstRender);

            if (!firstRender)
                return;

            if (BackgroundContent == null)
                throw new Exception("Flow Canvas Background is null");


            JsModule = await JS.InvokeAsync<IJSObjectReference>("import", "/_content/FlowState/flowCanvas.js");
            await JsModule.InvokeVoidAsync("setComponentProperties", NodeSelectionClass,AutoUpdateSocketColors);
            await JsModule.InvokeVoidAsync("setupCanvasEvents", canvasRef, gridRef, flowContentRef, dotnetObjRef);
            await SetViewportPropertiesAsync(new CanvasProperties { Zoom = Zoom, MinZoom = MinZoom, MaxZoom = MaxZoom });

            if (TempEdge != null)
            {
                TempEdge.SetGraph(Graph);
                await TempEdge.SetTempEdgeElementAsync();
            }

            if (OnCanvasLoaded.HasDelegate)
                await OnCanvasLoaded.InvokeAsync();
        }

        private void Refresh(object? _, EventArgs e)
        {
            StateHasChanged();
        }

        public ValueTask SetViewportPropertiesAsync(CanvasProperties canvasProperties)
        {
            return JsModule.InvokeVoidAsync("setCanvasProperties", canvasProperties);
        }

        public ValueTask<CanvasProperties> GetViewportPropertiesAsync()
        {
            return JsModule.InvokeAsync<CanvasProperties>("getCanvasProperties");
        }
        public ValueTask SetOffsetAsync(int offsetX, int offsetY)
        {
            return JsModule.InvokeVoidAsync("setOffset", offsetX, offsetY);
        }

        public ValueTask SetZoomAsync(double zoom)
        {
            return JsModule.InvokeVoidAsync("setZoom", zoom);
        }

        public ValueTask ClearAsync()
        {
            if (Graph == null)
                return ValueTask.CompletedTask;

            Graph.NodesInfo.Clear();
            Graph.EdgesInfo.Clear();

            return SetViewportPropertiesAsync(new CanvasProperties { Zoom = 1.0, MinZoom = MinZoom, MaxZoom = MaxZoom,OffsetX =0,OffsetY=0 });

        }

        public ValueTask SelectNodesAsync(params string[] nodeIds)
        {
            if (Graph == null)
                return ValueTask.CompletedTask;

            var nodesEls = new List<ElementReference>();

            foreach (var nodeId in nodeIds)
            {
                var node = Graph.GetNodeById(nodeId);
                if (node == null || node.DomElement == null)
                    continue;
                nodesEls.Add(node.DomElement.nodeRef);
            }

            return JsModule.InvokeVoidAsync("selectNodes", nodesEls);
        }

        public ValueTask ClearNodeSelectionAsync()
        {
            if (Graph == null)
                return ValueTask.CompletedTask;

            return JsModule.InvokeVoidAsync("clearSelection");
        }

        internal ValueTask AddEdgeToNodeEdgeMapAsync(FlowEdge edge, FlowNodeBase node)
        {
            return JsModule.InvokeVoidAsync("addUpdateEdgeMap", edge.edgeRef, node.DomElement?.nodeRef, edge?.FromSocket?.anchorRef, edge?.ToSocket?.anchorRef);
        }
        internal ValueTask RemoveEdgeFromNodeEdgeMapAsync(FlowEdge edge, FlowNodeBase node)
        {
            return JsModule.InvokeVoidAsync("deleteEdgeFromMap", edge.edgeRef, node.DomElement?.nodeRef);
        }
        
        /// <summary>
        /// Get the IDs of the currently selected nodes
        /// </summary>
        /// <returns>An array of the IDs of the currently selected nodes</returns>
        public ValueTask<string[]> GetSelectedNodesAsync()
        {
            return JsModule.InvokeAsync<string[]>("getSelectedNodes");
        }

        [JSInvokable]
        public async Task NotifyPanned(double offsetX, double offsetY)
        {
            if (OnPanned.HasDelegate)
                await OnPanned.InvokeAsync(new PanEventArgs(offsetX, offsetY));
        }

        [JSInvokable]
        public async Task NotifyZoomed(double zoom)
        {
            if (OnZoomed.HasDelegate)
                await OnZoomed.InvokeAsync(zoom);
        }

        [JSInvokable]
        public async Task NotifyNodeMoved(string nodeId, double x, double y)
        {
            if (OnNodeMoved.HasDelegate)
                await OnNodeMoved.InvokeAsync(new NodeMovedArgs(nodeId, x, y));
        }

        [JSInvokable]
        public async Task NotifyNodeSelected(string nodeId)
        {
            if (OnNodeSelected.HasDelegate)
                await OnNodeSelected.InvokeAsync(nodeId);
        }

        [JSInvokable]
        public async Task NotifyNodeDeselected(string nodeId)
        {
            if (OnNodeDeselected.HasDelegate)
                await OnNodeDeselected.InvokeAsync(nodeId);
        }

        [JSInvokable]
        public async Task NotifySelectionChanged(string[] nodeIds)
        {
            if (OnSelectionChanged.HasDelegate)
                await OnSelectionChanged.InvokeAsync(nodeIds);
        }

        [JSInvokable]
        public async Task NotifyNodesCleared()
        {
            if (OnNotifyNodesCleared.HasDelegate)
                await OnNotifyNodesCleared.InvokeAsync();
        }

        [JSInvokable]
        public async ValueTask EdgeConnectRequest(string fromNodeId, string toNodeId, string fromSocketName, string toSocketName)
        {

            if (OnEdgeConnectRequest.HasDelegate)
            {
                ConnectRequestArgs e = new(fromNodeId, toNodeId, fromSocketName, toSocketName, Graph);
                await OnEdgeConnectRequest.InvokeAsync(e);

                if (!e.Handled)
                    Graph!.Connect(e.FromSocket, e.ToSocket,EdgeShouldMatchDataType);
            }
            else
                Graph!.Connect(fromNodeId, toNodeId, fromSocketName, toSocketName,EdgeShouldMatchDataType);
        }


        public async ValueTask DisposeAsync()
        {
            if (Graph != null)
            {
                Graph.NodeAdded -= Refresh;
                Graph.EdgeAdded -= Refresh;
                Graph.NodeRemoved -= Refresh;
                Graph.EdgeRemoved -= Refresh;
            }

            if (JsModule != null)
            {

                try
                {
                    await JsModule.InvokeVoidAsync("removeCanvasEvents", canvasRef);
                    dotnetObjRef?.Dispose();
                    await JsModule.DisposeAsync();
                }
                catch
                {

                }
            }
        }

        public ValueTask<CanvasProperties> GetSerializableObjectAsync()
        {
            return GetViewportPropertiesAsync();
        }
    }
}