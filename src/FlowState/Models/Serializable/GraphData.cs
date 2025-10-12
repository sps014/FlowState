namespace FlowState.Models.Serializable;

public class GraphData
{
    public CanvasProperties Canvas { get; set; } = new();
    public List<NodeProperties> Nodes { get; set; } = new();
    public List<EdgeProperties> Edges { get; set; } = new();
}