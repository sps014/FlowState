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
        /// Event fired when a node is added to the canvas
        /// </summary>
        [Parameter]
        public EventCallback<NodeAddedEventArgs> OnNodeAdded { get; set; }

        /// <summary>
        /// Event fired when an edge is added to the canvas
        /// </summary>
        [Parameter]
        public EventCallback<EdgeAddedEventArgs> OnEdgeAdded { get; set; }

        /// <summary>
        /// Event fired when a node is removed from the canvas
        /// </summary>
        [Parameter]
        public EventCallback<NodeRemovedEventArgs> OnNodeRemoved { get; set; }

        /// <summary>
        /// Event fired when an edge is removed from the canvas
        /// </summary>
        [Parameter]
        public EventCallback<EdgeRemovedEventArgs> OnEdgeRemoved { get; set; }

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
        /// Event fired when all nodes are cleared from the canvas
        /// </summary>
        [Parameter]
        public EventCallback OnAllNodesCleared { get; set; }

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
            NotifyStateHasChanged();
        }

        private void RefreshOnAllEdgesCleared(object? _, EventArgs e)
        {
            NotifyStateHasChanged();
        }

        private void RefreshOnNodeAdded(object? _, NodeAddedEventArgs e)
        {
            NotifyStateHasChanged();
            OnNodeAdded.InvokeAsync(e);
        }

        private void RefreshOnNodeRemoved(object? _, NodeRemovedEventArgs e)
        {
            NotifyStateHasChanged();
            OnNodeRemoved.InvokeAsync(e);
        }

        private void RefreshOnEdgeAdded(object? _, EdgeAddedEventArgs e)
        {
            NotifyStateHasChanged();
            OnEdgeAdded.InvokeAsync(e);
        }

        private void RefreshOnEdgeRemoved(object? _, EdgeRemovedEventArgs e)
        {
            NotifyStateHasChanged();
            OnEdgeRemoved.InvokeAsync(e);
        }

        private void RefreshOnAllNodesCleared(object? _, EventArgs e)
        {
            NotifyStateHasChanged();
            OnAllNodesCleared.InvokeAsync(EventArgs.Empty);
        }

        /// <summary>
        /// Notifies the canvas that its state has changed and it should re-render
        /// </summary>
        public void NotifyStateHasChanged()
        {
            base.StateHasChanged();
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
        /// Called from JavaScript when multiple nodes are moved
        /// </summary>
        [JSInvokable]
        public async Task NotifyNodesMoved(string[] nodeIds, double[] xs, double[] ys)
        {
            if (IsReadOnly)
                return;

            if (OnNodeMoved.HasDelegate)
            {
                for (int i = 0; i < nodeIds.Length; i++)
                {
                    await OnNodeMoved.InvokeAsync(new NodeMovedArgs(nodeIds[i], xs[i], ys[i]));
                }
            }
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
        /// Called from JavaScript when Alt+Click is performed on a socket — removes all edges connected to that socket
        /// </summary>
        [JSInvokable]
        public async Task DeleteSocketEdges(string nodeId, string socketName)
        {
            if (IsReadOnly || Graph == null)
                return;

            var node = Graph.GetNodeById(nodeId);
            if (node == null)
                return;

            node.InputSockets.TryGetValue(socketName, out var inputSocket);
            node.OutputSockets.TryGetValue(socketName, out var outputSocket);

            var socket = inputSocket ?? outputSocket;
            if (socket == null)
                return;

            var edgeIds = socket.Connections.Select(e => e.Id).ToArray();
            foreach (var edgeId in edgeIds)
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

        /// <summary>
        /// Arranges nodes in a left-to-right layered layout based on the dependency graph using
        /// fixed column/row spacing.
        /// </summary>
        /// <param name="startX">Canvas X coordinate for the first column (default: 50)</param>
        /// <param name="startY">Canvas Y coordinate for the topmost node (default: 50)</param>
        /// <param name="horizontalSpacing">Horizontal distance between column origins (default: 250)</param>
        /// <param name="verticalSpacing">Vertical distance between node origins (default: 120)</param>
        public async ValueTask ArrangeAsync(double startX = 50, double startY = 50, double horizontalSpacing = 250, double verticalSpacing = 120)
        {
            var layers = BuildArrangeLayers();
            if (layers == null) return;

            foreach (var (col, nodeIds) in layers)
            {
                double x = startX + col * horizontalSpacing;
                for (int row = 0; row < nodeIds.Count; row++)
                {
                    var node = Graph.GetNodeById(nodeIds[row]);
                    if (node?.DomElement != null)
                    {
                        await node.DomElement.MoveNodeAsync(x, startY + row * verticalSpacing);
                        await node.DomElement.UpdateEdgesAsync();
                    }
                }
            }
        }

        /// <summary>
        /// Arranges nodes in a left-to-right layered layout, reading each node's actual rendered
        /// size from the DOM so columns are sized to their widest node and rows advance by each
        /// node's real height. <paramref name="gapX"/> and <paramref name="gapY"/> are the
        /// whitespace between nodes. When <paramref name="useDom"/> is <c>false</c> this falls
        /// back to <see cref="ArrangeAsync(double,double,double,double)"/>.
        /// </summary>
        /// <param name="x">Canvas X coordinate for the first column (default: 50)</param>
        /// <param name="y">Canvas Y coordinate for the topmost node (default: 50)</param>
        /// <param name="gapX">Horizontal whitespace between columns in pixels (default: 60)</param>
        /// <param name="gapY">Vertical whitespace between nodes in a column in pixels (default: 40)</param>
        /// <param name="useDom">When true, reads rendered node sizes from the DOM to drive placement</param>
        public async ValueTask ArrangeAsync(double x = 50, double y = 50, double gapX = 60, double gapY = 40, bool useDom = true)
        {
            if (!useDom)
            {
                await ArrangeAsync(x, y, gapX + 200, gapY + 80);
                return;
            }

            var layers = BuildArrangeLayers();
            if (layers == null) return;

            // Read every node's rendered size from the DOM
            var sizes = new Dictionary<string, (double W, double H)>();
            foreach (var node in Graph.Nodes)
            {
                var size = node.DomElement != null
                    ? await node.DomElement.GetNodeSizeAsync()
                    : null;
                sizes[node.Id] = size != null ? (size.X, size.Y) : (160, 80);
            }

            // Column widths = widest node per column; cumulative X per column
            var colCount = layers.Keys.Max() + 1;
            var colWidths = new double[colCount];
            for (int col = 0; col < colCount; col++)
            {
                if (layers.TryGetValue(col, out var ids))
                    colWidths[col] = ids.Max(id => sizes.TryGetValue(id, out var s) ? s.W : 0);
            }

            var colX = new double[colCount];
            colX[0] = x;
            for (int col = 1; col < colCount; col++)
                colX[col] = colX[col - 1] + colWidths[col - 1] + gapX;

            // Place nodes, advancing Y by each node's actual height
            var colCurrentY = new double[colCount];
            Array.Fill(colCurrentY, y);

            foreach (var col in layers.Keys.OrderBy(c => c))
            {
                foreach (var nodeId in layers[col])
                {
                    var node = Graph.GetNodeById(nodeId);
                    if (node?.DomElement == null) continue;

                    await node.DomElement.MoveNodeAsync(colX[col], colCurrentY[col]);
                    await node.DomElement.UpdateEdgesAsync();

                    colCurrentY[col] += (sizes.TryGetValue(nodeId, out var sz) ? sz.H : 80) + gapY;
                }
            }
        }

        /// <summary>
        /// Builds a topological layer map (column index per node) from the current graph edges.
        /// Group nodes (NodeKind.Group) are excluded — they are containers and have no place in
        /// the data-flow dependency order.
        /// Returns null if the graph has no arrangeable nodes.
        /// </summary>
        private Dictionary<int, List<string>>? BuildArrangeLayers()
        {
            if (Graph == null || Graph.Nodes.Count == 0)
                return null;

            // Only regular (non-group) nodes participate in the layout
            var arrangeableNodes = Graph.Nodes.Where(n => n.NodeKind != NodeKind.Group).ToList();
            if (arrangeableNodes.Count == 0)
                return null;

            var arrangeableIds = arrangeableNodes.Select(n => n.Id).ToHashSet();

            var dependencies = new Dictionary<string, HashSet<string>>();
            foreach (var node in arrangeableNodes)
                dependencies[node.Id] = [];

            foreach (var edge in Graph.Edges)
            {
                var fromId = edge.FromSocket?.FlowNode?.Id;
                var toId   = edge.ToSocket?.FlowNode?.Id;
                if (fromId != null && toId != null
                    && arrangeableIds.Contains(fromId)
                    && arrangeableIds.Contains(toId))
                {
                    dependencies[toId].Add(fromId);
                }
            }

            var layerMap = new Dictionary<string, int>();

            void AssignLayer(string nodeId)
            {
                if (layerMap.ContainsKey(nodeId)) return;

                var deps = dependencies[nodeId];
                if (deps.Count == 0) { layerMap[nodeId] = 0; return; }

                foreach (var depId in deps)
                    AssignLayer(depId);

                layerMap[nodeId] = deps.Max(d => layerMap.TryGetValue(d, out var l) ? l : 0) + 1;
            }

            foreach (var node in arrangeableNodes)
                AssignLayer(node.Id);

            var layers = new Dictionary<int, List<string>>();
            foreach (var (nodeId, col) in layerMap)
            {
                if (!layers.ContainsKey(col)) layers[col] = [];
                layers[col].Add(nodeId);
            }

            return layers;
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


        /// <summary>
        /// Called from JavaScript to handle undo operation
        /// </summary>
        [JSInvokable]
        public async Task HandleUndo()
        {
            if (Graph?.CommandManager != null)
                await Graph.CommandManager.UndoAsync();
        }

        /// <summary>
        /// Called from JavaScript to handle redo operation
        /// </summary>
        [JSInvokable]
        public async Task HandleRedo()
        {
            if (Graph?.CommandManager != null)
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
