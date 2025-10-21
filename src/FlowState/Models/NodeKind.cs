namespace FlowState.Models;


/// <summary>
/// Node Kind indicates the type of node
/// </summary>
public enum NodeKind
{
    /// <summary>
    /// Regular node is a regular node that can be used in the graph
    /// </summary>
    Regular,
    /// <summary>
    /// Group node is a group node that can be used to group other nodes
    /// </summary>
    Group,
}