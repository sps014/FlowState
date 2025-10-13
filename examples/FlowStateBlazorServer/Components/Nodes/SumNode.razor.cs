namespace FlowStateBlazorServer.Components.Nodes;

using FlowState.Attributes;
using FlowState.Components;

/// <summary>
/// Node that adds two numbers together
/// </summary>
[FlowNodeMetadata("Sum")]
public partial class SumNode
{
    private float inputA = 0;
    private float inputB = 0;

    public override ValueTask ExecuteAsync()
    {
        // Calculate sum
        float result = inputA + inputB;
        
        // Output the result
        SetOutput("Output", result);
        
        return ValueTask.CompletedTask;
    }

    /// <summary>
    /// Sets input value A
    /// </summary>
    public void SetInputA(float value)
    {
        inputA = value;
    }

    /// <summary>
    /// Sets input value B
    /// </summary>
    public void SetInputB(float value)
    {
        inputB = value;
    }

    /// <summary>
    /// Sets output value
    /// </summary>
    private void SetOutput(string socketName, float value)
    {
        // Store the output value for connected nodes to retrieve
        // This would be handled by the execution system
    }
}

