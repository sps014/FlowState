using System.Diagnostics;
using FlowState.Components;
using FlowState.Models.Events;


namespace FlowState.Models.Execution;

/// <summary>
/// Handles node execution and dependency management for FlowGraph.
/// Manages the execution of nodes in the correct order based on their dependencies,
/// handles branch tracking for conditional execution, and provides comprehensive 
/// execution control and monitoring.
/// </summary>
public class FlowGraphExecution
{
    /// <summary>
    /// Map of node IDs to active input socket indices
    /// Used for branch tracking in conditional execution
    /// </summary>
    private Dictionary<string, HashSet<int>> activeInputs = [];
    
    /// <summary>
    /// Map of node IDs to active output socket indices
    /// Used for branch tracking in conditional execution
    /// </summary>
    private Dictionary<string, HashSet<int>> activeOutputs = [];

    /// <summary>
    /// Set of edge IDs that are currently executing
    /// </summary>
    private HashSet<string> executingEdgeIds = new();

    /// <summary>
    /// Shared state dictionary that persists across all nodes during a single execution run
    /// Cleared at the start of each execution
    /// </summary>
    private Dictionary<string, object?> executionState = new();

    /// <summary>
    /// The parent FlowGraph instance
    /// </summary>
    public FlowGraph Graph { get; }
    
    /// <summary>
    /// Creates a new GraphFlowExecution instance
    /// </summary>
    /// <param name="graph">The parent FlowGraph instance</param>
    public FlowGraphExecution(FlowGraph graph)
    {
        Graph = graph;
    }

    // =================== State Management ===================

    /// <summary>
    /// Gets a value from the shared execution state
    /// </summary>
    /// <typeparam name="T">The type of the value to retrieve</typeparam>
    /// <param name="key">The key to look up</param>
    /// <returns>The value if found, otherwise default(T)</returns>
    public T GetState<T>(string key)
    {
        if (executionState.TryGetValue(key, out var value))
        {
            if (value is T typedValue)
                return typedValue;

            // Try conversion for compatible types
            try
            {
                return (T)Convert.ChangeType(value, typeof(T))!;
            }
            catch
            {
                return default!;
            }
        }
        return default!;
    }

    /// <summary>
    /// Sets a value in the shared execution state
    /// </summary>
    /// <typeparam name="T">The type of the value to store</typeparam>
    /// <param name="key">The key to store the value under</param>
    /// <param name="value">The value to store</param>
    public void SetState<T>(string key, T value)
    {
        executionState[key] = value;
    }

    /// <summary>
    /// Checks if a key exists in the execution state
    /// </summary>
    /// <param name="key">The key to check</param>
    /// <returns>True if the key exists, false otherwise</returns>
    public bool HasState(string key)
    {
        return executionState.ContainsKey(key);
    }

    /// <summary>
    /// Removes a key from the execution state
    /// </summary>
    /// <param name="key">The key to remove</param>
    /// <returns>True if the key was removed, false if it didn't exist</returns>
    public bool RemoveState(string key)
    {
        return executionState.Remove(key);
    }

    /// <summary>
    /// Clears all state values
    /// </summary>
    public void ClearState()
    {
        executionState.Clear();
    }

    /// <summary>
    /// Gets a read-only view of all current state
    /// </summary>
    public IReadOnlyDictionary<string, object?> GetAllState()
    {
        return executionState;
    }

    /// <summary>
    /// Execute all nodes in the graph in dependency order
    /// </summary>
    public async ValueTask ExecuteAsync(CancellationToken cancellationToken)
    {
        // Fire start event
        OnExecutionStarted?.Invoke(this, new ExecutionEventArgs
        {
            Timestamp = DateTime.UtcNow
        });

        executingEdgeIds.Clear();
        
        // Clear previous execution state
        ClearBranchTracking();
        ClearState();
        
        // Call BeforeGraphExecutionAsync on all nodes to allow them to reset state
        foreach (var node in Graph.Nodes)
        {
            await node.BeforeGraphExecutionAsync();
        }
        
        // Get execution order based on dependencies
        var executionOrder = GetExecutionOrder();
        
        if (executionOrder.Length == 0)
        {
            OnExecutionCompleted?.Invoke(this, new ExecutionCompletedEventArgs
            {
                ExecutedNodes = 0,
                TotalNodes = 0,
                Timestamp = DateTime.UtcNow
            });
            return;
        }
        
        int executedCount = 0;
        Exception? executionError = null;
        bool wasCancelled = false;
        
        // Create shared data storage for this execution run
        var sharedExecutionData = new Dictionary<string, object?>();
        
        try
        {
            // Execute nodes in order
            foreach (var nodeId in executionOrder)
            {
                // Check cancellation before each node
                if (cancellationToken.IsCancellationRequested)
                {
                    wasCancelled = true;
                    throw new OperationCanceledException("Graph execution was cancelled.", cancellationToken);
                }
                
                var node = Graph.GetNodeById(nodeId);
                if (node == null)
                    continue;
                
                // Check if node should execute based on active branches
                if (!ShouldNodeExecute(nodeId))
                    continue;
                
                try
                {
                    // Fire node execution start event
                    OnNodeExecutionStarted?.Invoke(this, new NodeExecutionEventArgs
                    {
                        NodeId = nodeId,
                        Timestamp = DateTime.UtcNow
                    });
                    
                    // Mark connected edges as executing
                    MarkNodeEdgesAsExecuting(nodeId, true);
                    
                    // Create execution context with full graph state and shared data
                    var executionContext = new FlowExecutionContext(node)
                    {
                        CancellationToken = cancellationToken,
                        Execution = this,
                        CustomData = sharedExecutionData // Share data across all nodes
                    };
                    
                    await node.ExecuteAsync(executionContext);
                    executedCount++;
                    
                    // Mark connected edges as no longer executing
                    MarkNodeEdgesAsExecuting(nodeId, false);
                    
                    // Fire node execution completed event
                    OnNodeExecutionCompleted?.Invoke(this, new NodeExecutionEventArgs
                    {
                        NodeId = nodeId,
                        Timestamp = DateTime.UtcNow
                    });
                }
                catch (OperationCanceledException)
                {
                    // Cancellation occurred during node execution
                    wasCancelled = true;
                    throw;
                }
                catch (Exception error)
                {
                    Debug.WriteLine($"Error executing node {nodeId}: {error.Message}");
                    executionError = error;
                    
                    // Fire node execution error event
                    OnNodeExecutionError?.Invoke(this, new NodeExecutionErrorEventArgs
                    {
                        NodeId = nodeId,
                        Error = error,
                        Timestamp = DateTime.UtcNow
                    });
                    
                    break; // Stop execution on first failure
                }
            }
        }
        catch (OperationCanceledException cancelEx)
        {
            // Fire completion event with cancellation info
            OnExecutionCompleted?.Invoke(this, new ExecutionCompletedEventArgs
            {
                ExecutedNodes = executedCount,
                TotalNodes = executionOrder.Length,
                Error = cancelEx,
                Timestamp = DateTime.UtcNow
            });
            
            // Re-throw to propagate cancellation
            throw;
        }
        
        // Fire complete event (only if not cancelled)
        if (!wasCancelled)
        {
            OnExecutionCompleted?.Invoke(this, new ExecutionCompletedEventArgs
            {
                ExecutedNodes = executedCount,
                TotalNodes = executionOrder.Length,
                Error = executionError,
                Timestamp = DateTime.UtcNow
            });
            
            // Re-throw error if execution failed
            if (executionError != null)
                throw executionError;
        }
    }

    /// <summary>
    /// Execute only selected nodes
    /// </summary>
    public async Task ExecuteSelectedNodesAsync(CancellationToken cancellationToken = default)
    {
        var selectedNodeIds = await Graph.GetSelectedNodesAsync();
        
        if (selectedNodeIds.Length == 0)
            return;
        
        // Create shared data storage for this execution run
        var sharedExecutionData = new Dictionary<string, object?>();
        
        // Execute nodes in parallel with context
        var executionTasks = selectedNodeIds
            .Select(nodeId => Graph.GetNodeById(nodeId))
            .Where(node => node != null)
            .Select(node =>
            {
                var context = new FlowExecutionContext(node!)
                {
                    CancellationToken = cancellationToken,
                    Execution = this,
                    CustomData = sharedExecutionData // Share data across all nodes
                };
                return node!.ExecuteAsync(context).AsTask();
            });
        
        try
        {
            await Task.WhenAll(executionTasks);
        }
        catch (Exception error)
        {
            Debug.WriteLine($"Error executing selected nodes: {error.Message}");
            throw;
        }
    }

    /// <summary>
    /// Gets the execution order of nodes using topological sort based on dependencies
    /// Throws InvalidOperationException if circular dependencies are detected
    /// </summary>
    /// <returns>Array of node IDs in execution order</returns>
    public string[] GetExecutionOrder()
    {
        var visited = new HashSet<string>();
        var visiting = new HashSet<string>();
        var result = new List<string>();

        var dependencies = new Dictionary<string, HashSet<string>>();

        // Initialize dependencies for all nodes
        foreach(var node in Graph.Nodes)
        {
            dependencies[node.Id] = [];
        }

        // Build dependency graph - ToSocket node depends on FromSocket node
        foreach(var edge in Graph.Edges)
        {
            dependencies[edge.ToSocket!.FlowNode!.Id].Add(edge.FromSocket!.FlowNode!.Id);
        }

        // Local function for DFS topological sort
        void Visit(string nodeId)
        {
            if (visiting.Contains(nodeId))
            {
                throw new InvalidOperationException($"Circular dependency detected involving node {nodeId}");
            }
            
            if (visited.Contains(nodeId))
                return;
            
            visiting.Add(nodeId);
            
            // Visit all dependencies first
            if (dependencies.TryGetValue(nodeId, out var deps))
            {
                foreach (var depId in deps)
                {
                    Visit(depId);
                }
            }
            
            visiting.Remove(nodeId);
            visited.Add(nodeId);
            
            // Add to execution order
            result.Add(nodeId);
        }

        // Visit all nodes
        foreach(var node in Graph.Nodes)
        {
            if(!visited.Contains(node.Id))
                Visit(node.Id);
        }
        
        return result.ToArray();
    }

    /// <summary>
    /// Gets the execution order of nodes (based on dependencies using topological sort)
    /// </summary>
    /// <returns>Array of nodes in execution order</returns>
    public FlowNodeBase[] GetExecutionOrderNodes()
    {
        var order = GetExecutionOrder();
        return order
            .Select(id => Graph.GetNodeById(id))
            .Where(node => node != null)
            .ToArray()!;
    }

    /// <summary>
    /// Checks if the graph has circular dependencies (uses topological sort)
    /// </summary>
    /// <returns>True if circular dependencies exist</returns>
    public bool HasCircularDependencies()
    {
        try
        {
            GetExecutionOrder();
            return false;
        }
        catch (InvalidOperationException)
        {
            return true;
        }
    }

    /// <summary>
    /// Activate an output socket (called when setOutput is used)
    /// </summary>
    public void ActivateOutputSocket(string nodeId, int outputIndex)
    {
        if (!activeOutputs.ContainsKey(nodeId))
        {
            activeOutputs[nodeId] = [];
        }
        activeOutputs[nodeId].Add(outputIndex);
        
        // Mark connected input sockets as active
        MarkConnectedInputsAsActive(nodeId, outputIndex);
    }

    /// <summary>
    /// Mark input sockets connected to an active output as active
    /// </summary>
    private void MarkConnectedInputsAsActive(string nodeId, int outputIndex)
    {
        var node = Graph.GetNodeById(nodeId);
        if (node == null)
            return;
        
        var outputArray = node.OutputSockets.Values.ToArray();
        if (outputIndex >= outputArray.Length)
            return;
        
        var outputSocket = outputArray[outputIndex];
        
        // Find all edges connected to this output
        var connectedEdges = Graph.Edges.Where(e => 
            e.FromSocket?.FlowNode?.Id == nodeId && 
            e.FromSocket?.Name == outputSocket.Name);
        
        foreach (var edge in connectedEdges)
        {
            if (edge.ToSocket?.FlowNode == null)
                continue;
            
            var targetNodeId = edge.ToSocket.FlowNode.Id;
            var inputIndex = GetInputSocketIndex(edge.ToSocket);
            
            if (!activeInputs.ContainsKey(targetNodeId))
            {
                activeInputs[targetNodeId] = [];
            }
            activeInputs[targetNodeId].Add(inputIndex);
        }
    }

    /// <summary>
    /// Get the index of an input socket within its node
    /// </summary>
    private int GetInputSocketIndex(FlowSocket socket)
    {
        if (socket.FlowNode == null)
            return -1;
        
        var inputArray = socket.FlowNode.InputSockets.Values.ToArray();
        return Array.IndexOf(inputArray, socket);
    }

    /// <summary>
    /// Get the index of an output socket within its node
    /// </summary>
    private int GetOutputSocketIndex(FlowSocket socket)
    {
        if (socket.FlowNode == null)
            return -1;
        
        var outputArray = socket.FlowNode.OutputSockets.Values.ToArray();
        return Array.IndexOf(outputArray, socket);
    }

    /// <summary>
    /// Check if a node should execute based on active branches
    /// By default, all nodes execute unless explicitly disabled
    /// </summary>
    private bool ShouldNodeExecute(string nodeId)
    {
        var node = Graph.GetNodeById(nodeId);
        if (node == null)
            return false;
        
        // If node has no input sockets, it can execute
        if (node.InputSockets.Count == 0)
            return true;
        
        // By default, execute all nodes
        // Only skip if branch tracking is active and no inputs are marked as active
        if (activeInputs.Count > 0)
        {
            var activeInputsForNode = activeInputs.GetValueOrDefault(nodeId);
            return activeInputsForNode != null && activeInputsForNode.Count > 0;
        }
        
        // If no branch tracking is active, execute all nodes
        return true;
    }

    /// <summary>
    /// Clear all branch tracking (called at start of execution)
    /// </summary>
    private void ClearBranchTracking()
    {
        activeOutputs.Clear();
        activeInputs.Clear();
    }

    /// <summary>
    /// Check if a node has received any input values (legacy method - keeping for compatibility)
    /// </summary>
    public bool NodeHasInputValues(string nodeId)
    {
        return ShouldNodeExecute(nodeId);
    }

    /// <summary>
    /// Marks input edges (edges coming TO the node) as executing
    /// This shows where the data is flowing from during node execution
    /// </summary>
    private void MarkNodeEdgesAsExecuting(string nodeId, bool isExecuting)
    {
        var node = Graph.GetNodeById(nodeId);
        if (node == null || Graph.Canvas == null)
            return;

        // Directly access input socket connections - much faster than iterating all edges
        foreach (var socket in node.InputSockets.Values)
        {
            foreach (var edge in socket.Connections)
            {
                if (isExecuting)
                    executingEdgeIds.Add(edge.Id);
                else
                    executingEdgeIds.Remove(edge.Id);

                edge.SetExecuting(isExecuting);
            }
        }
    }

    // Events

    /// <summary>
    /// Fired when execution starts
    /// </summary>
    public event EventHandler<ExecutionEventArgs>? OnExecutionStarted;

    /// <summary>
    /// Fired when execution completes (successful or with error)
    /// </summary>
    public event EventHandler<ExecutionCompletedEventArgs>? OnExecutionCompleted;

    /// <summary>
    /// Fired before a node begins execution
    /// </summary>
    public event EventHandler<NodeExecutionEventArgs>? OnNodeExecutionStarted;

    /// <summary>
    /// Fired after a node successfully completes execution
    /// </summary>
    public event EventHandler<NodeExecutionEventArgs>? OnNodeExecutionCompleted;

    /// <summary>
    /// Fired when a node encounters an error during execution
    /// </summary>
    public event EventHandler<NodeExecutionErrorEventArgs>? OnNodeExecutionError;
}

