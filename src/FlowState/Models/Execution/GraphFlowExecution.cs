using FlowState.Components;
using FlowState.Models.Events;

namespace FlowState.Models.Execution;

/// <summary>
/// Handles node execution and dependency management for FlowGraph.
/// Manages the execution of nodes in the correct order based on their dependencies,
/// handles branch tracking for conditional execution, and provides comprehensive 
/// execution control and monitoring.
/// </summary>
public class GraphFlowExecution
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
    /// The parent FlowGraph instance
    /// </summary>
    public FlowGraph Graph { get; }
    
    /// <summary>
    /// The execution direction (InputToOutput or OutputToInput)
    /// </summary>
    public ExecutionDirection Direction { get; }
    
    /// <summary>
    /// Creates a new GraphFlowExecution instance
    /// </summary>
    /// <param name="graph">The parent FlowGraph instance</param>
    /// <param name="direction">The execution direction</param>
    public GraphFlowExecution(FlowGraph graph, ExecutionDirection direction = ExecutionDirection.InputToOutput)
    {
        Graph = graph;
        Direction = direction;
    }

    /// <summary>
    /// Execute all nodes in the graph in dependency order
    /// </summary>
    public async Task ExecuteAsync()
    {
        // Fire start event
        OnExecutionStarted?.Invoke(this, new ExecutionEventArgs 
        { 
            Timestamp = DateTime.UtcNow 
        });
        
        // Clear previous execution state
        ClearBranchTracking();
        
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
        
        // Execute nodes in order
        foreach (var nodeId in executionOrder)
        {
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
                
                await node.ExecuteAsync();
                executedCount++;
                
                // Fire node execution completed event
                OnNodeExecutionCompleted?.Invoke(this, new NodeExecutionEventArgs
                {
                    NodeId = nodeId,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception error)
            {
                Console.WriteLine($"Error executing node {nodeId}: {error.Message}");
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
        
        // Fire complete event
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

    /// <summary>
    /// Execute only selected nodes
    /// </summary>
    public async Task ExecuteSelectedNodesAsync()
    {
        var selectedNodeIds = await Graph.GetSelectedNodesAsync();
        
        if (selectedNodeIds.Length == 0)
            return;
        
        // Execute nodes in parallel
        var executionTasks = selectedNodeIds
            .Select(nodeId => Graph.GetNodeById(nodeId))
            .Where(node => node != null)
            .Select(node => node!.ExecuteAsync().AsTask());
        
        try
        {
            await Task.WhenAll(executionTasks);
        }
        catch (Exception error)
        {
            Console.WriteLine($"Error executing selected nodes: {error.Message}");
            throw;
        }
    }

    /// <summary>
    /// Get execution order using topological sort based on execution direction
    /// </summary>
    private string[] GetExecutionOrder()
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

        // Build dependency graph based on execution direction
        foreach(var edge in Graph.Edges)
        {
            if (Direction == ExecutionDirection.InputToOutput)
            {
                // Normal flow: outputs depend on inputs
                // ToSocket node depends on FromSocket node
                dependencies[edge.ToSocket!.FlowNode!.Id].Add(edge.FromSocket!.FlowNode!.Id);
            }
            else // OutputToInput
            {
                // Reverse flow: inputs depend on outputs
                // FromSocket node depends on ToSocket node
                dependencies[edge.FromSocket!.FlowNode!.Id].Add(edge.ToSocket!.FlowNode!.Id);
            }
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

    // Events
    public event EventHandler<ExecutionEventArgs>? OnExecutionStarted;
    public event EventHandler<ExecutionCompletedEventArgs>? OnExecutionCompleted;
    public event EventHandler<NodeExecutionEventArgs>? OnNodeExecutionStarted;
    public event EventHandler<NodeExecutionEventArgs>? OnNodeExecutionCompleted;
    public event EventHandler<NodeExecutionErrorEventArgs>? OnNodeExecutionError;
}

