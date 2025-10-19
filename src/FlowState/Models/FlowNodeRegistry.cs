
namespace FlowState.Models;

/// <summary>
/// Registry for managing node types
/// </summary>
public class FlowNodeRegistry
{
    private HashSet<Type> registeredNodeTypes = new HashSet<Type>();

    /// <summary>
    /// Gets the collection of registered node types
    /// </summary>
    public IReadOnlyCollection<Type> RegisteredNodes => registeredNodeTypes;

    /// <summary>
    /// Registers a node type
    /// </summary>
    /// <typeparam name="T">The node type to register</typeparam>
    public void Register<T>()
    {
        registeredNodeTypes.Add(typeof(T));
    } 
}