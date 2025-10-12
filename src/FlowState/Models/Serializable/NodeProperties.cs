namespace FlowState.Models.Serializable;

public class NodeProperties
{
    public string Type { get; set; }
    public string Id { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public Dictionary<string, object?> Data { get; set; } = new ();

    public NodeProperties(string type, string id, double x, double y, Dictionary<string, object?> data)
    {
        Type = type;
        Id = id;
        X = x;
        Y = y;
        Data = data;
    }
}