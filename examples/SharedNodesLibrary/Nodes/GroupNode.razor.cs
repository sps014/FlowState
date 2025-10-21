using FlowState.Attributes;
using FlowState.Components;
using FlowState.Models;
using FlowState.Models.Execution;
using Microsoft.AspNetCore.Components;

namespace SharedNodesLibrary.Nodes;

/// <summary>
/// Group node for organizing and containing other nodes
/// </summary>
[FlowNodeMetadata(
    Category = "Layout",
    Title = "Group",
    Description = "Container for organizing multiple nodes together",
    Icon = "📦",
    Order = 1)]
public partial class GroupNode
{
    [Parameter]
    public int Value { get; set; }

    public override NodeKind NodeKind => NodeKind.Group;
    
    public override ValueTask ExecuteAsync(FlowExecutionContext context)
    {
        return ValueTask.CompletedTask;
    }
}