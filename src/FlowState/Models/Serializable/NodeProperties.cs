namespace FlowState.Models.Serializable;

/// <summary>
/// Represents serializable node properties
/// </summary>
public class NodeProperties
{
    /// <summary>
    /// Gets or sets the node name
    /// </summary>
    public string Name { get; set; }
    
    /// <summary>
    /// Gets or sets the node ID
    /// </summary>
    public string Id { get; set; }
    
    /// <summary>
    /// Gets the X coordinate from stored data
    /// </summary>
    public double X => Convert.ToDouble(Data[nameof(X)].GetValue());
    
    /// <summary>
    /// Gets the Y coordinate from stored data
    /// </summary>
    public double Y => Convert.ToDouble(Data[nameof(Y)].GetValue());
    
    /// <summary>
    /// Gets or sets the dictionary of stored properties
    /// </summary>
    public Dictionary<string, StoredProperty> Data { get; init; } = new ();

    /// <summary>
    /// Initializes a new instance of the NodeProperties class
    /// </summary>
    /// <param name="name">The node type name</param>
    /// <param name="id">The node ID</param>
    /// <param name="data">The stored properties</param>
    public NodeProperties(string name, string id, Dictionary<string, StoredProperty> data)
    {
        Name = name;
        Id = id;
        Data = data;
    }
    
    /// <summary>
    /// Converts stored properties to a raw dictionary
    /// </summary>
    /// <returns>A dictionary of property names and values</returns>
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