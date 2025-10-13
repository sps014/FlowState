namespace FlowStateBlazorServer.Components.Nodes;

using FlowState.Attributes;
using FlowState.Components;
using FlowState.Models.Execution;
using Microsoft.AspNetCore.Components;

/// <summary>
/// Node that compares two values and outputs to true or false path
/// </summary>
[FlowNodeMetadata("If-Else")]
public partial class IfElseNode
{
    private float inputA = 0;
    private float inputB = 0;
    private string selectedOperator = ">";

    public override ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        // Get input values using context API
        inputA = context.GetInputSocketData<float>("InputA");
        inputB = context.GetInputSocketData<float>("InputB");
        
        bool result = EvaluateCondition();
        
        if (result)
        {
            // Output to True path using context API
            context.SetOutputSocketData("OutputTrue", inputA);
        }
        else
        {
            // Output to False path using context API
            context.SetOutputSocketData("OutputFalse", inputB);
        }
        
        return ValueTask.CompletedTask;
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
