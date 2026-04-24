namespace SharedNodesLibrary.Nodes;

using FlowState.Components;
using FlowState.Models.Execution;
using Microsoft.AspNetCore.Components;

/// <summary>
/// Base class for nodes with execution progress animation
/// </summary>
public abstract class ExecutableNodeBase : FlowNodeBase
{
    /// <summary>
    /// Gets or sets whether the node is currently executing
    /// </summary>
    protected bool IsExecuting { get; set; } = false;

    /// <summary>
    /// Gets or sets the title of the node
    /// </summary>
    [Parameter]
    public string Title { get; set; } = "Node";

    /// <summary>
    /// Gets or sets the child content (node body)
    /// </summary>
    [Parameter]
    public RenderFragment? ChildContent { get; set; }


    /// <summary>
    /// Wraps execution with visual feedback
    /// </summary>
    protected async ValueTask ExecuteWithProgressAsync(Func<FlowExecutionContext, ValueTask> executeLogic, FlowExecutionContext context)
    {
        IsExecuting = true;
        StateHasChanged();

        // Simulate work delay
        await Task.Delay(1500);

        // Execute the actual node logic
        await executeLogic(context);

        IsExecuting = false;
        StateHasChanged();
    }

    /// <summary>
    /// Starts the visual animation for the node
    /// </summary>
    public override void StartAnimation()
    {
        IsExecuting = true;
        StateHasChanged();
    }

    /// <summary>
    /// Ends the visual animation for the node
    /// </summary>
    public override void EndAnimation()
    {
        IsExecuting = false;
        StateHasChanged();
    }
}

