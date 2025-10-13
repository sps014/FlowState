namespace FlowStateBlazorServer.Components.Nodes;

using FlowState.Attributes;
using FlowState.Components;
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

    public override ValueTask ExecuteAsync()
    {
        bool result = EvaluateCondition();
        
        if (result)
        {
            // Output to True path
            SetOutput("OutputTrue", inputA);
        }
        else
        {
            // Output to False path
            SetOutput("OutputFalse", inputB);
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
    /// Sets the comparison operator
    /// </summary>
    public void SetOperator(string op)
    {
        selectedOperator = op;
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
