namespace SharedNodesLibrary.Nodes;

using FlowState.Attributes;
using FlowState.Models.Execution;

/// <summary>
/// Node that adds two numbers together
/// </summary>
[FlowNodeMetadata(
    Category = "Math",
    Title = "Sum",
    Description = "Adds two numbers together",
    Icon = "➕",
    Order = 1)]
public partial class SumNode : ExecutableNodeBase
{
    private float inputA = 0;
    private float inputB = 0;

    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        await ExecuteWithProgressAsync((ctx) =>
        {
            // Get input values using context API
            // Note: GetInputSocketData<float> will handle conversion from long/int to float automatically
            inputA = ctx.GetInputSocketData<float>("InputA");
            inputB = ctx.GetInputSocketData<float>("InputB");
            
            // Calculate sum
            float result = inputA + inputB;
            
            // Set output using context API
            ctx.SetOutputSocketData("Output", result);
            
            return ValueTask.CompletedTask;
        }, context);
    }
}

