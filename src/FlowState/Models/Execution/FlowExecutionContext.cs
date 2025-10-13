using FlowState.Components;

namespace FlowState.Models.Execution;

/// <summary>
/// Execution context passed to nodes during graph execution.
/// Provides access to cancellation tokens, execution state, and graph-level utilities.
/// </summary>
public class FlowExecutionContext
{
    private readonly FlowNodeBase _node;
    private readonly Dictionary<int, object?> _outputValues = new();
    
    /// <summary>
    /// Gets or sets the cancellation token for the execution.
    /// Nodes can check this to cancel long-running operations.
    /// </summary>
    public CancellationToken CancellationToken { get; set; }
    
    /// <summary>
    /// Gets the execution direction (InputToOutput or OutputToInput).
    /// </summary>
    public ExecutionDirection Direction { get; init; }
    
    /// <summary>
    /// Gets the graph execution instance managing this execution.
    /// Provides access to branch tracking and execution utilities.
    /// </summary>
    public FlowGraphExecution? Execution { get; init; }
    
    /// <summary>
    /// Gets the current node being executed.
    /// </summary>
    public FlowNodeBase Node => _node;
    
    /// <summary>
    /// Gets a dictionary for storing custom data during execution.
    /// Useful for passing state between nodes in the same execution run.
    /// This is shared across all nodes in the same execution.
    /// </summary>
    public Dictionary<string, object?> CustomData { get; init; } = new();
    
    /// <summary>
    /// Creates a new FlowExecutionContext for a specific node.
    /// </summary>
    /// <param name="node">The node being executed</param>
    public FlowExecutionContext(FlowNodeBase node)
    {
        _node = node;
    }
    
    /// <summary>
    /// Gets data from an input socket by name.
    /// </summary>
    /// <param name="socketName">The name of the input socket</param>
    /// <returns>The data value, or null if not found</returns>
    public object? GetInputSocketData(string socketName)
    {
        if (Execution?.Graph == null)
            return null;
        
        // Find the input socket on this node
        if (!_node.InputSockets.TryGetValue(socketName, out var inputSocket))
            return null;
        
        // Find the edge connected to this input socket
        var connectedEdge = Execution.Graph.Edges.FirstOrDefault(e => 
            e.ToSocket?.FlowNode?.Id == _node.Id && 
            e.ToSocket?.Name == socketName);
        
        if (connectedEdge?.FromSocket?.FlowNode == null)
            return null;
        
        // Get the source node and socket
        var sourceNode = connectedEdge.FromSocket.FlowNode;
        var sourceSocketName = connectedEdge.FromSocket.Name;
        
        // Get the output from the execution context storage using socket name
        var key = $"output_{sourceNode.Id}_{sourceSocketName}";
        if (CustomData.TryGetValue(key, out var storedValue))
        {
            return storedValue;
        }
        
        return null;
    }
    
    /// <summary>
    /// Gets typed data from an input socket by name.
    /// </summary>
    /// <typeparam name="T">The expected data type</typeparam>
    /// <param name="socketName">The name of the input socket</param>
    /// <returns>The typed data value, or default(T) if not found</returns>
    public T? GetInputSocketData<T>(string socketName)
    {
        var value = GetInputSocketData(socketName);
        if (value == null)
            return default;
        
        try
        {
            // Try direct cast first
            if (value is T typedValue)
                return typedValue;
            
            // Try Convert.ChangeType for numeric conversions
            return (T)Convert.ChangeType(value, typeof(T));
        }
        catch
        {
            return default;
        }
    }
    
    /// <summary>
    /// Sets the output value for an output socket by name.
    /// </summary>
    /// <param name="socketName">The name of the output socket</param>
    /// <param name="value">The value to set</param>
    public void SetOutputSocketData(string socketName, object? value)
    {
        // Find the output socket and its index
        var outputSockets = _node.OutputSockets.Values.ToList();
        var index = outputSockets.FindIndex(s => s.Name == socketName);
        
        if (index < 0)
            return;
        
        // Store in local dictionary by index
        _outputValues[index] = value;
        
        // Store in shared CustomData for other nodes to access (using socket name as key)
        var key = $"output_{_node.Id}_{socketName}";
        CustomData[key] = value;
        
        // Notify execution system that this output is active
        if (Execution != null && !string.IsNullOrEmpty(_node.Id))
        {
            Execution.ActivateOutputSocket(_node.Id, index);
        }
    }
    
    /// <summary>
    /// Gets the output value for an output socket by name.
    /// </summary>
    /// <param name="socketName">The name of the output socket</param>
    /// <returns>The output value, or null if not set</returns>
    public object? GetOutputSocketData(string socketName)
    {
        // Try to get from shared storage first (for values set during this execution)
        var key = $"output_{_node.Id}_{socketName}";
        if (CustomData.TryGetValue(key, out var storedValue))
        {
            return storedValue;
        }
        
        // Fallback to local dictionary by index
        var outputSockets = _node.OutputSockets.Values.ToList();
        var index = outputSockets.FindIndex(s => s.Name == socketName);
        
        if (index >= 0 && _outputValues.TryGetValue(index, out var value))
        {
            return value;
        }
        
        return null;
    }
    
    /// <summary>
    /// Gets typed output value for an output socket by name.
    /// </summary>
    /// <typeparam name="T">The expected data type</typeparam>
    /// <param name="socketName">The name of the output socket</param>
    /// <returns>The typed output value, or default(T) if not found</returns>
    public T? GetOutputSocketData<T>(string socketName)
    {
        var value = GetOutputSocketData(socketName);
        if (value == null)
            return default;
        
        try
        {
            // Try direct cast first
            if (value is T typedValue)
                return typedValue;
            
            // Try Convert.ChangeType for numeric conversions
            return (T)Convert.ChangeType(value, typeof(T));
        }
        catch
        {
            return default;
        }
    }
}