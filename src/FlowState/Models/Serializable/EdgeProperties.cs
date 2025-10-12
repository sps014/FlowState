namespace FlowState.Models.Serializable;

public class EdgeProperties
{
    public string Id { get; set; }
    public string FromNodeId { get; set; }
    public string ToNodeId { get; set; }
    public string FromSocketName { get; set; }
    public string ToSocketName { get; set; }

    public EdgeProperties(string id, string fromNodeId, string toNodeId, string fromSocketName, string toSocketName)
    {
        Id = id;
        FromNodeId = fromNodeId;
        ToNodeId = toNodeId;
        FromSocketName = fromSocketName;
        ToSocketName = toSocketName;
    }

}