namespace FlowState.Models.Serializable;

public class NodeProperties
{
    public string Type { get; set; }
    public string Id { get; set; }
    public double X => Convert.ToDouble(Data[nameof(X)].GetValue());
    public double Y => Convert.ToDouble(Data[nameof(Y)].GetValue());
    public Dictionary<string, StoredProperty> Data { get; init; } = new ();

    public NodeProperties(string type, string id, Dictionary<string, StoredProperty> data)
    {
        Type = type;
        Id = id;
        Data = data;
    }
    
    public Dictionary<string,object?> GetRawDictionary()
    {
        var dict = new Dictionary<string, object?>();

        foreach(var (k,v) in Data)
        {
            dict.Add(k, v.GetValue());
        }

        return dict;
    }
}