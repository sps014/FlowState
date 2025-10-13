namespace FlowState.Models.Execution;

/// <summary>
/// Execution direction for the graph
/// </summary>
public enum ExecutionDirection
{
    /// <summary>
    /// Normal flow: data flows from inputs to outputs (e.g., A → B → C)
    /// </summary>
    InputToOutput,
    
    /// <summary>
    /// Reverse flow: data flows from outputs to inputs (e.g., C → B → A)
    /// Useful for backpropagation or reverse inference
    /// </summary>
    OutputToInput
}

