using System.Drawing;
using FlowState.Models;
using FlowState.Models.Dom;
using FlowState.Models.Events;
using FlowState.Models.Execution;
using FlowState.Models.Serializable;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;

namespace FlowState.Components
{
    /// <summary>
    /// Main canvas component for rendering and managing the flow graph
    /// </summary>
    public partial class FlowCanvas : IAsyncDisposable, ISerializable<CanvasProperties>
    {
        // Properties

        /// <summary>
        /// Gets the unique identifier for this canvas instance
        /// </summary>
        public string Id { get; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Gets or sets the background content for the canvas
        /// </summary>
        [EditorRequired]
        [Parameter]
        public RenderFragment? BackgroundContent { get; set; }

        /// <summary>
        /// Gets or sets the flow graph to display
        /// </summary>
        [EditorRequired]
        [Parameter]
        public FlowGraph Graph { get; set; }

        /// <summary>
        /// Gets or sets the width of the canvas
        /// </summary>
        [EditorRequired]
        [Parameter]
        public string Width { get; set; } = "100%";

        /// <summary>
        /// Gets or sets the height of the canvas
        /// </summary>
        [EditorRequired]
        [Parameter]
        public string Height { get; set; } = "100%";

        /// <summary>
        /// Gets or sets custom CSS styles for the canvas
        /// </summary>
        [Parameter]
        public string Style { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets whether socket colors should auto-update based on connections
        /// </summary>
        [Parameter]
        public bool AutoUpdateSocketColors { get; set; } = true;
        

        /// <summary>
        /// Gets or sets the execution direction (InputToOutput or OutputToInput)
        /// </summary>
        [Parameter]
        public ExecutionDirection ExecutionDirection { get; set; } = ExecutionDirection.InputToOutput;

        /// <summary>
        /// Gets or sets the CSS class to apply to selected nodes
        /// </summary>
        [Parameter]
        public string NodeSelectionClass { get; set; } = "selected";

        /// <summary>
        /// Gets or sets the key to use for multi-selection. Options: "shift", "ctrl", "alt", "meta"
        /// </summary>
        [Parameter]
        public string MultiSelectionKey { get; set; } = "shift";

        [Parameter]
        public string SelectionRectangleClass { get; set; } = "flow-selection-rectangle";

        /// <summary>
        /// Gets or sets the CSS class for the canvas element
        /// </summary>
        [Parameter]
        public string Class { get; set; } = "flow-canvas";

        /// <summary>
        /// Gets or sets the minimum allowed zoom level
        /// </summary>
        [Parameter]
        public double MinZoom { get; set; } = 0.2;

        /// <summary>
        /// Gets or sets the maximum allowed zoom level
        /// </summary>
        [Parameter]
        public double MaxZoom { get; set; } = 2.0;

        /// <summary>
        /// Gets or sets the initial zoom level
        /// </summary>
        [Parameter]
        public double Zoom { get; set; } = 1.0;

        /// <summary>
        /// Gets or sets the name of the JavaScript function to use for edge path calculation (should be defined in the js file and must be accessible from Window object)
        /// </summary>
        [Parameter]
        public string? JsEdgePathFunctionName { get; set; } = null;

        /// <summary>
        /// Gets or sets whether edges should validate data type compatibility
        /// </summary>
        [Parameter]
        public bool EdgeShouldMatchDataType { get; set; } = true;

    /// <summary>
    /// Gets or sets custom CSS styles for the background grid
    /// </summary>
    [Parameter]
    public string GridStyle { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the CSS class to apply to edges when their connected nodes are executing
    /// </summary>
    [Parameter]
    public string ExecutingEdgeClass { get; set; } = "edge-executing";

        // Event Callbacks

        /// <summary>
        /// Event fired when the canvas is panned
        /// </summary>
        [Parameter]
        public EventCallback<PanEventArgs> OnPanned { get; set; }

        /// <summary>
        /// Event fired when the canvas zoom level changes
        /// </summary>
        [Parameter]
        public EventCallback<ZoomEventArgs> OnZoomed { get; set; }

        /// <summary>
        /// Event fired when a node is moved
        /// </summary>
        [Parameter]
        public EventCallback<NodeMovedArgs> OnNodeMoved { get; set; }

        /// <summary>
        /// Event fired when a node is selected
        /// </summary>
        [Parameter]
        public EventCallback<NodeSelectedEventArgs> OnNodeSelected { get; set; }

        /// <summary>
        /// Event fired when a node is deselected
        /// </summary>
        [Parameter]
        public EventCallback<NodeDeselectedEventArgs> OnNodeDeselected { get; set; }

        /// <summary>
        /// Event fired when the selection changes
        /// </summary>
        [Parameter]
        public EventCallback<SelectionChangedEventArgs> OnSelectionChanged { get; set; }

        /// <summary>
        /// Event fired when nodes are cleared
        /// </summary>
        [Parameter]
        public EventCallback<NodesClearedEventArgs> OnNotifyNodesCleared { get; set; }

        /// <summary>
        /// Event fired when an edge connection is requested
        /// </summary>
        [Parameter]
        public EventCallback<ConnectRequestArgs> OnEdgeConnectRequest { get; set; }

        /// <summary>
        /// Event fired when the canvas finishes loading
        /// </summary>
        [Parameter]
        public EventCallback<CanvasLoadedEventArgs> OnCanvasLoaded { get; set; }

        private FlowEdge? TempEdge = null;
        private ElementReference canvasRef;
        private ElementReference flowContentRef;
        private ElementReference selectionRectRef;
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

        // Lifecycle Methods

        protected override void OnInitialized()
        {
            if (Graph == null)
                throw new InvalidOperationException("FlowCanvas requires a valid FlowGraph instance.");

            Graph.Canvas = this;
            Graph.NodeAdded += RefreshOnNodeAdded;
            Graph.EdgeAdded += RefreshOnEdgeAdded;
            Graph.NodeRemoved += RefreshOnNodeRemoved;
            Graph.EdgeRemoved += RefreshOnEdgeRemoved;
            Graph.AllNodesCleared += RefreshOnAllNodesCleared;
            Graph.AllEdgesCleared += RefreshOnAllEdgesCleared;
            Graph.ForcedRequestDomStateChanged += ForcedRequestDomStateChanged;

            dotnetObjRef = DotNetObjectReference.Create(this);
        }

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            await base.OnAfterRenderAsync(firstRender);

            if (!firstRender)
                return;

            if (BackgroundContent == null)
                throw new Exception("Flow Canvas Background is null");

            JsModule = await JS.InvokeAsync<IJSObjectReference>("import", "/_content/FlowState/flowGraph.js");
            await JsModule.InvokeVoidAsync("setComponentProperties", NodeSelectionClass, AutoUpdateSocketColors, JsEdgePathFunctionName, MultiSelectionKey);
            await JsModule.InvokeVoidAsync("setupCanvasEvents", canvasRef, gridRef, flowContentRef, selectionRectRef, dotnetObjRef);
            await SetViewportPropertiesAsync(new CanvasProperties { Zoom = Zoom, MinZoom = MinZoom, MaxZoom = MaxZoom });

            if (TempEdge != null)
            {
                TempEdge.SetGraph(Graph);
                await TempEdge.SetTempEdgeElementAsync();
            }

            if (OnCanvasLoaded.HasDelegate)
                await OnCanvasLoaded.InvokeAsync(new CanvasLoadedEventArgs
                {
                    Zoom = Zoom,
                    MinZoom = MinZoom,
                    MaxZoom = MaxZoom
                });
        }

        // Event Handlers

        private void ForcedRequestDomStateChanged(object? _, EventArgs e)
        {
            StateHasChanged();
        }

        private void RefreshOnAllEdgesCleared(object? _, EventArgs e)
        {
            StateHasChanged();
        }

        private void RefreshOnNodeAdded(object? _, NodeAddedEventArgs e)
        {
            StateHasChanged();
        }

        private void RefreshOnNodeRemoved(object? _, NodeRemovedEventArgs e)
        {
            StateHasChanged();
        }

        private void RefreshOnEdgeAdded(object? _, EdgeAddedEventArgs e)
        {
            StateHasChanged();
        }

        private void RefreshOnEdgeRemoved(object? _, EdgeRemovedEventArgs e)
        {
            StateHasChanged();
        }

        private void RefreshOnAllNodesCleared(object? _, EventArgs e)
        {
            StateHasChanged();
        }

        // Public Methods - Viewport

        /// <summary>
        /// Sets the viewport properties including zoom and offsets
        /// </summary>
        /// <param name="canvasProperties">The properties to apply</param>
        /// <returns>A task representing the asynchronous operation</returns>
        public ValueTask SetViewportPropertiesAsync(CanvasProperties canvasProperties)
        {
            return JsModule.InvokeVoidAsync("setCanvasProperties", canvasProperties);
        }

        /// <summary>
        /// Gets the current viewport properties
        /// </summary>
        /// <returns>The current canvas properties</returns>
        public ValueTask<CanvasProperties> GetViewportPropertiesAsync()
        {
            return JsModule.InvokeAsync<CanvasProperties>("getCanvasProperties");
        }

        /// <summary>
        /// Sets the canvas pan offset
        /// </summary>
        /// <param name="offsetX">The X offset</param>
        /// <param name="offsetY">The Y offset</param>
        /// <returns>A task representing the asynchronous operation</returns>
        public ValueTask SetOffsetAsync(int offsetX, int offsetY)
        {
            return JsModule.InvokeVoidAsync("setOffset", offsetX, offsetY);
        }

        /// <summary>
        /// Sets the canvas zoom level
        /// </summary>
        /// <param name="zoom">The zoom level to set</param>
        /// <returns>A task representing the asynchronous operation</returns>
        public ValueTask SetZoomAsync(double zoom)
        {
            return JsModule.InvokeVoidAsync("setZoom", zoom);
        }

        // Public Methods - Canvas Management

        /// <summary>
        /// Clears all nodes and edges from the canvas and resets the viewport
        /// </summary>
        /// <returns>A task representing the asynchronous operation</returns>
        public ValueTask ClearAsync()
        {
            if (Graph == null)
                return ValueTask.CompletedTask;

            Graph.NodesInfo.Clear();
            Graph.EdgesInfo.Clear();

            return SetViewportPropertiesAsync(new CanvasProperties { Zoom = 1.0, MinZoom = MinZoom, MaxZoom = MaxZoom, OffsetX = 0, OffsetY = 0 });
        }

        // Public Methods - Node Selection

        /// <summary>
        /// Selects nodes by their IDs
        /// </summary>
        /// <param name="nodeIds">The IDs of nodes to select</param>
        /// <returns>A task representing the asynchronous operation</returns>
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

        /// <summary>
        /// Clears the current node selection
        /// </summary>
        /// <returns>A task representing the asynchronous operation</returns>
        public ValueTask ClearNodeSelectionAsync()
        {
            if (Graph == null)
                return ValueTask.CompletedTask;

            return JsModule.InvokeVoidAsync("clearSelection");
        }

        /// <summary>
        /// Gets the IDs of currently selected nodes
        /// </summary>
        /// <returns>An array of selected node IDs</returns>
        public ValueTask<string[]> GetSelectedNodesAsync()
        {
            return JsModule.InvokeAsync<string[]>("getSelectedNodes");
        }

        // Internal Methods - Edge Management

        internal ValueTask AddEdgeToNodeEdgeMapAsync(FlowEdge edge, FlowNodeBase node)
        {
            return JsModule.InvokeVoidAsync("addUpdateEdgeMap", edge.edgeRef, node.DomElement?.nodeRef, edge?.FromSocket?.anchorRef, edge?.ToSocket?.anchorRef);
        }

        internal ValueTask RemoveEdgeFromNodeEdgeMapAsync(FlowEdge edge, FlowNodeBase node)
        {
            return JsModule.InvokeVoidAsync("deleteEdgeFromMap", edge.edgeRef, node.DomElement?.nodeRef);
        }

        // JS Invokable Methods - Event Notifications

        /// <summary>
        /// Called from JavaScript when the canvas is panned
        /// </summary>
        [JSInvokable]
        public async Task NotifyPanned(double offsetX, double offsetY)
        {
            if (OnPanned.HasDelegate)
                await OnPanned.InvokeAsync(new PanEventArgs(offsetX, offsetY));
        }

        /// <summary>
        /// Called from JavaScript when the zoom level changes
        /// </summary>
        [JSInvokable]
        public async Task NotifyZoomed(double zoom)
        {
            if (OnZoomed.HasDelegate)
                await OnZoomed.InvokeAsync(new ZoomEventArgs { Zoom = zoom });
        }

        /// <summary>
        /// Called from JavaScript when a node is moved
        /// </summary>
        [JSInvokable]
        public async Task NotifyNodeMoved(string nodeId, double x, double y)
        {
            if (OnNodeMoved.HasDelegate)
                await OnNodeMoved.InvokeAsync(new NodeMovedArgs(nodeId, x, y));
        }

        /// <summary>
        /// Called from JavaScript when a node is selected
        /// </summary>
        [JSInvokable]
        public async Task NotifyNodeSelected(string nodeId)
        {
            if (OnNodeSelected.HasDelegate)
                await OnNodeSelected.InvokeAsync(new NodeSelectedEventArgs { NodeId = nodeId });
        }

        /// <summary>
        /// Called from JavaScript when a node is deselected
        /// </summary>
        [JSInvokable]
        public async Task NotifyNodeDeselected(string nodeId)
        {
            if (OnNodeDeselected.HasDelegate)
                await OnNodeDeselected.InvokeAsync(new NodeDeselectedEventArgs { NodeId = nodeId });
        }

        /// <summary>
        /// Called from JavaScript when the selection changes
        /// </summary>
        [JSInvokable]
        public async Task NotifySelectionChanged(string[] nodeIds)
        {
            if (OnSelectionChanged.HasDelegate)
                await OnSelectionChanged.InvokeAsync(new SelectionChangedEventArgs { SelectedNodeIds = nodeIds });
        }

        /// <summary>
        /// Called from JavaScript when nodes are cleared
        /// </summary>
        [JSInvokable]
        public async Task NotifyNodesCleared()
        {
            if (OnNotifyNodesCleared.HasDelegate)
                await OnNotifyNodesCleared.InvokeAsync(new NodesClearedEventArgs { ClearedCount = Graph.Nodes.Count });
        }

        /// <summary>
        /// Called from JavaScript when an edge connection is requested
        /// </summary>
        [JSInvokable]
        public async ValueTask EdgeConnectRequest(string fromNodeId, string toNodeId, string fromSocketName, string toSocketName)
        {
            if (OnEdgeConnectRequest.HasDelegate)
            {
                ConnectRequestArgs e = new(fromNodeId, toNodeId, fromSocketName, toSocketName, Graph);
                await OnEdgeConnectRequest.InvokeAsync(e);

                if (!e.Handled)
                    Graph!.Connect(e.FromSocket, e.ToSocket, EdgeShouldMatchDataType);
            }
            else
                Graph!.Connect(fromNodeId, toNodeId, fromSocketName, toSocketName, EdgeShouldMatchDataType);
        }

        // Serialization

        /// <summary>
        /// Gets the serializable representation of the canvas
        /// </summary>
        /// <returns>The canvas properties</returns>
        public ValueTask<CanvasProperties> GetSerializableObjectAsync()
        {
            return GetViewportPropertiesAsync();
        }

        // Disposal

        /// <summary>
        /// Disposes of the canvas and cleans up resources
        /// </summary>
        /// <returns>A task representing the asynchronous operation</returns>
        public async ValueTask DisposeAsync()
        {
            if (Graph != null)
            {
                Graph.NodeAdded -= RefreshOnNodeAdded;
                Graph.EdgeAdded -= RefreshOnEdgeAdded;
                Graph.NodeRemoved -= RefreshOnNodeRemoved;
                Graph.EdgeRemoved -= RefreshOnEdgeRemoved;
                Graph.AllNodesCleared -= RefreshOnAllNodesCleared;
                Graph.AllEdgesCleared -= RefreshOnAllEdgesCleared;
                Graph.ForcedRequestDomStateChanged -= ForcedRequestDomStateChanged;
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
                    // Suppress disposal errors
                }
            }
        }
    }
}
