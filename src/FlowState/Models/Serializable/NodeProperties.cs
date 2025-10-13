namespace FlowState.Models.Serializable;

public class NodeProperties
{
    public string Type { get; set; }
    public string Id { get; set; }
    public double X => Convert.ToDouble(Data[nameof(X)]);
    public double Y => Convert.ToDouble(Data[nameof(Y)]);
    public Dictionary<string, object?> Data { get; set; } = new ();

    public NodeProperties(string type, string id,Dictionary<string, object?> data)
    {
        Type = type;
        Id = id;
        Data = data;
    }
}