using System.Threading.Tasks;
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
    public partial class FlowCanvas : ComponentBase, IAsyncDisposable, ISerializable<CanvasProperties>
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
        /// Panels in the Cavas
        /// </summary>
        [Parameter]
        public RenderFragment? Panels { get; set; }

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
        /// Gets or sets the CSS class to apply to selected nodes
        /// </summary>
        [Parameter]
        public string NodeSelectionClass { get; set; } = "selected";

        /// <summary>
        /// Gets or sets the key to use for panning the canvas. Options: "shift", "ctrl", "alt", "meta"
        /// </summary>
        [Parameter]
        public string PanKey { get; set; } = "alt";

        /// <summary>
        /// Gets or sets the CSS class for the selection rectangle
        /// </summary>
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
        /// Gets or sets the scroll speed for zooming (default is 1)
        /// </summary>
        [Parameter]
        public double ScrollSpeed { get; set; } = 1;

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
        /// Gets or sets whether the canvas is in read-only mode. When true, only panning and zooming are allowed.
        /// </summary>
        [Parameter]
#pragma warning disable BL0007 // Component parameters should be auto properties
        public bool IsReadOnly
#pragma warning restore BL0007 // Component parameters should be auto properties
        {
            get => Graph?.IsReadOnly ?? false;
            set
            {
                if (Graph != null)
                {
                    Graph.IsReadOnly = value;
                    if (isInitialized) SetReadOnlyAsync(value);
                }
            }
        }

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

        /// <summary>
        /// Event fired when a socket is long pressed
        /// </summary>
        [Parameter]
        public EventCallback<SocketLongPressEventArgs> OnSocketLongPress { get; set; }

        /// <summary>
        /// Event fired when the canvas is right-clicked (context menu)
        /// </summary>
        [Parameter]
        public EventCallback<CanvasContextMenuEventArgs> OnContextMenu { get; set; }


        /// <summary>
        /// Event fired when a key is pressed (Delete key or Backspace on Mac)
        /// </summary>
        [Parameter]
        public EventCallback<KeyboardEventArgs> OnKeyDown { get; set; }

        private FlowEdge? TempEdge = null;
        private ElementReference canvasRef;
        private ElementReference flowContentRef;
        private ElementReference selectionRectRef;
        private ElementReference edgeHoverDetectorRef;
        private ElementReference edgesSvgRef;
        internal ElementReference gridRef;
        private bool isInitialized;

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

        /// <summary>
        /// Initializes the canvas component
        /// </summary>
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

        /// <summary>
        /// Performs initialization after the component has rendered
        /// </summary>
        /// <param name="firstRender">Whether this is the first time the component has rendered</param>
        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            await base.OnAfterRenderAsync(firstRender);

            if (!firstRender)
                return;

            if (BackgroundContent == null)
                throw new Exception("Flow Canvas Background is null");

            JsModule = await JS.InvokeAsync<IJSObjectReference>("import", "/_content/FlowState/flowGraph.js");
            JsModule = await JsModule.InvokeAsync<IJSObjectReference>("createFlowCanvas");
            
            await JsModule.InvokeVoidAsync("setComponentProperties", new
            {
                nodeSelectionClass = NodeSelectionClass,
                autoUpdateSocketColors = AutoUpdateSocketColors,
                jsEdgePathFunctionName = JsEdgePathFunctionName,
                panKey = PanKey,
                isReadOnly = IsReadOnly,
                scrollSpeed = ScrollSpeed
            });
            await JsModule.InvokeVoidAsync("setupCanvasEvents", 
                new
                {
                    canvasElement = canvasRef,
                    gridElement = gridRef,
                    flowContentElement = flowContentRef,
                    selectionRectElement = selectionRectRef,
                    edgeHoverDetectorElement = edgeHoverDetectorRef,
                    edgesSvgElement = edgesSvgRef
                }, 
                dotnetObjRef);
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

            isInitialized = true;
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
            IsReadOnly = canvasProperties.IsReadOnly;

            StateHasChanged();
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
        public ValueTask SetOffsetAsync(double offsetX, double offsetY)
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

        /// <summary>
        /// Sets whether the canvas is in read-only mode
        /// </summary>
        /// <param name="isReadOnly">True to enable read-only mode, false to allow editing</param>
        /// <returns>A task representing the asynchronous operation</returns>
        public ValueTask SetReadOnlyAsync(bool isReadOnly)
        {
            if (IsReadOnly == isReadOnly)
                return ValueTask.CompletedTask;

            IsReadOnly = isReadOnly;
            return JsModule.InvokeVoidAsync("setReadOnly", isReadOnly);
        }

        /// <summary>
        /// Sets the canvas interaction mode
        /// </summary>
        /// <param name="mode">The canvas mode to set (Select or Pan)</param>
        /// <returns>A task representing the asynchronous operation</returns>
        public ValueTask SetCanvasModeAsync(CanvasMode mode)
        {
            return JsModule.InvokeVoidAsync("setCanvasMode", (int)mode);
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

            Graph.CommandManager.ClearStacks();
            Graph.RemoveAllNodes();
            Graph.RemoveAllEdges();

            return SetViewportPropertiesAsync(new CanvasProperties { Zoom = 1.0, MinZoom = MinZoom, MaxZoom = MaxZoom, OffsetX = 0, OffsetY = 0, IsReadOnly = IsReadOnly });
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

        /// <summary>
        /// Calls StateHasChanged
        /// </summary>
        public void Refresh()
        {
            StateHasChanged();
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
            if (IsReadOnly)
                return;

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
        /// Called from JavaScript when a socket is long pressed
        /// </summary>
        [JSInvokable]
        public async Task NotifySocketLongPress(string nodeId, string socketName, double x, double y)
        {
            if (!OnSocketLongPress.HasDelegate)
                return;

            var node = Graph.Nodes.FirstOrDefault(n => n.Id == nodeId);
            var socket = node?.Sockets.FirstOrDefault(s => s.Name == socketName);

            if (socket != null)
                await OnSocketLongPress.InvokeAsync(new SocketLongPressEventArgs { Socket = socket, X = x, Y = y });
        }

        /// <summary>
        /// Called from JavaScript when the canvas is right-clicked
        /// </summary>
        [JSInvokable]
        public async Task NotifyContextMenu(double x, double y, double clientX, double clientY)
        {
            if (!OnContextMenu.HasDelegate)
                return;

            await OnContextMenu.InvokeAsync(new CanvasContextMenuEventArgs 
            { 
                X = x, 
                Y = y, 
                ClientX = clientX, 
                ClientY = clientY 
            });
        }

        /// <summary>
        /// Called from JavaScript to delete an edge
        /// </summary>
        [JSInvokable]
        public async ValueTask DeleteEdge(string edgeId)
        {
            if (IsReadOnly || Graph == null)
                return;

            await Graph.RemoveEdgeAsync(edgeId);
        }

        /// <summary>
        /// Called from JavaScript when an edge connection is requested
        /// </summary>
        [JSInvokable]
        public async Task EdgeConnectRequest(string fromNodeId, string toNodeId, string fromSocketName, string toSocketName)
        {
            if (IsReadOnly)
                return;

            if (OnEdgeConnectRequest.HasDelegate)
            {
                ConnectRequestArgs e = new(fromNodeId, toNodeId, fromSocketName, toSocketName, Graph);
                await OnEdgeConnectRequest.InvokeAsync(e);

                if (!e.Handled)
                    await Graph!.ConnectAsync(e.FromSocket, e.ToSocket, EdgeShouldMatchDataType);
            }
            else
                await Graph!.ConnectAsync(fromNodeId, toNodeId, fromSocketName, toSocketName, EdgeShouldMatchDataType);
        }

        /// <summary>
        /// Called from JavaScript when nodes should be deleted (Delete key pressed)
        /// </summary>
        [JSInvokable]
        public async Task DeleteNodes(string[] nodeIds)
        {
            if (IsReadOnly || Graph == null || nodeIds == null || nodeIds.Length == 0)
                return;

            foreach (var nodeId in nodeIds)
            {
                await Graph.RemoveNodeAsync(nodeId);
            }
        }

        /// <summary>
        /// Called from JavaScript when a node is resized
        /// </summary>
        [JSInvokable]
        public void NotifyNodeResized(string nodeId, double width, double height)
        {
            if (Graph == null)
                return;

            var node = Graph.GetNodeById(nodeId);
            if (node == null || node is not FlowGroupNodeBase group)
                return;
            group.OnResized(width, height);
            return;
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


        private async Task HandleKeyDown(KeyboardEventArgs e)
        {
            if (OnKeyDown.HasDelegate)
                await OnKeyDown.InvokeAsync(e);

            if ((e.CtrlKey || e.MetaKey) && e.Key == "z" && !e.ShiftKey)
                await Graph.CommandManager.UndoAsync();
            else if ((e.CtrlKey || e.MetaKey) && (e.Key == "y" || (e.Key == "z" && e.ShiftKey)))
                await Graph.CommandManager.RedoAsync();
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
