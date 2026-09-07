namespace FlowState.Models.Serializable;

/// <summary>
/// Clipboard payload for copying a subgraph (nodes plus fully-contained edges).
/// </summary>
public class GraphClipboardPayload
{
    /// <summary>Marker used to identify FlowState clipboard JSON.</summary>
    public string Kind { get; set; } = Marker;

    /// <summary>Copied nodes.</summary>
    public List<NodeProperties> Nodes { get; set; } = [];

    /// <summary>Copied edges whose both endpoints are in <see cref="Nodes"/>.</summary>
    public List<EdgeProperties> Edges { get; set; } = [];

    /// <summary>Clipboard JSON marker value.</summary>
    public const string Marker = "flowstate-clipboard";
}
