
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Rendering;

namespace FlowState.Components;

public class FlowNode : ComponentBase
{
  [Parameter]
  public RenderFragment? ChildContent { get; set; }

  private FlowNode? flowNode;

  protected override void OnInitialized()
  {
    flowNode = this;
    base.OnInitialized();
    StateHasChanged();
  }

  protected override void BuildRenderTree(RenderTreeBuilder builder)
{
    builder.OpenComponent<CascadingValue<FlowNode>>(0);
    builder.AddAttribute(1, "Value", flowNode);
    builder.AddAttribute(2, "ChildContent", (RenderFragment)(b =>
    {
        b.OpenElement(0, "span");
        b.AddAttribute(1, "class", "flow-node"); 
        b.AddContent(2, ChildContent);
        b.CloseElement(); // closes <span>
    }));
    builder.CloseComponent(); // closes CascadingValue
}


}


//private string FlowNodeStyle => $"transform: translate({NodeOffsetX}px, {NodeOffsetY}px); left:0; top:0;";

