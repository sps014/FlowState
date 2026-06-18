namespace FlowState.Models;

/// <summary>
/// Defines the type of socket (input or output)
/// </summary>
public enum SocketType
{
    /// <summary>
    /// Input socket that receives data
    /// </summary>
    Input,
    
    /// <summary>
    /// Output socket that provides data
    /// </summary>
    Output
}

/// <summary>
/// Defines the layout direction for a socket's anchor and label
/// </summary>
public enum SocketDirection
{
    /// <summary>
    /// Anchor is on the left (input) or right (output) side — default horizontal flow
    /// </summary>
    Horizontal,

    /// <summary>
    /// Anchor is on the top (input) or bottom (output) side — vertical flow
    /// </summary>
    Vertical
}