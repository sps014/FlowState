namespace FlowStateBlazorServer.Components.Nodes;

using FlowState.Attributes;
using FlowState.Components;
using FlowState.Models.Execution;

/// <summary>
/// Node that adds two numbers together
/// </summary>
[FlowNodeMetadata("Sum")]
public partial class SumNode
{
    private float inputA = 0;
    private float inputB = 0;

    public override ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        // Get input values using context API
        // Note: GetInputSocketData<float> will handle conversion from long/int to float automatically
        inputA = context.GetInputSocketData<float>("InputA");
        inputB = context.GetInputSocketData<float>("InputB");
        
        // Calculate sum
        float result = inputA + inputB;
        
        // Set output using context API
        context.SetOutputSocketData("Output", result);
        
        return ValueTask.CompletedTask;
    }
}

