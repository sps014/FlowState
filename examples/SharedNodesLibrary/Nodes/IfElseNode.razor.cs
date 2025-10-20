namespace SharedNodesLibrary.Nodes;

using FlowState.Attributes;
using FlowState.Models.Execution;

/// <summary>
/// Node that compares two values and outputs to true or false path
/// </summary>
[FlowNodeMetadata(
    Category = "Logic",
    Title = "If/Else",
    Description = "Conditional branching based on comparison",
    Icon = "🔀",
    Order = 1)]
public partial class IfElseNode : ExecutableNodeBase
{
    private float inputA = 0;
    private float inputB = 0;
    private string selectedOperator = ">";

    public override async ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        await ExecuteWithProgressAsync((ctx) =>
        {
            // Get input values using context API
            inputA = ctx.GetInputSocketData<float>("InputA");
            inputB = ctx.GetInputSocketData<float>("InputB");
            
            bool result = EvaluateCondition();
            
            if (result)
            {
                // Output to True path using context API
                ctx.SetOutputSocketData("OutputTrue", inputA);
            }
            else
            {
                // Output to False path using context API
                ctx.SetOutputSocketData("OutputFalse", inputB);
            }
            
            return ValueTask.CompletedTask;
        }, context);
    }

    /// <summary>
    /// Evaluates the comparison based on selected operator
    /// </summary>
    private bool EvaluateCondition()
    {
        return selectedOperator switch
        {
            ">" => inputA > inputB,
            "<" => inputA < inputB,
            "==" => Math.Abs(inputA - inputB) < 0.0001f,
            "!=" => Math.Abs(inputA - inputB) >= 0.0001f,
            ">=" => inputA >= inputB,
            "<=" => inputA <= inputB,
            _ => false
        };
    }
}
