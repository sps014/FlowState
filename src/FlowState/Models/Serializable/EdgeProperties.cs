namespace FlowState.Models.Serializable;

/// <summary>
/// Represents serializable edge properties
/// </summary>
public class EdgeProperties
{
    /// <summary>
    /// Gets or sets the edge ID
    /// </summary>
    public string Id { get; set; }
    
    /// <summary>
    /// Gets or sets the source node ID
    /// </summary>
    public string FromNodeId { get; set; }
    
    /// <summary>
    /// Gets or sets the destination node ID
    /// </summary>
    public string ToNodeId { get; set; }
    
    /// <summary>
    /// Gets or sets the source socket name
    /// </summary>
    public string FromSocketName { get; set; }
    
    /// <summary>
    /// Gets or sets the destination socket name
    /// </summary>
    public string ToSocketName { get; set; }

    /// <summary>
    /// Initializes a new instance of the EdgeProperties class
    /// </summary>
    /// <param name="id">The edge ID</param>
    /// <param name="fromNodeId">The source node ID</param>
    /// <param name="toNodeId">The destination node ID</param>
    /// <param name="fromSocketName">The source socket name</param>
    /// <param name="toSocketName">The destination socket name</param>
    public EdgeProperties(string id, string fromNodeId, string toNodeId, string fromSocketName, string toSocketName)
    {
        Id = id;
        FromNodeId = fromNodeId;
        ToNodeId = toNodeId;
        FromSocketName = fromSocketName;
        ToSocketName = toSocketName;
    }

}