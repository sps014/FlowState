
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


    /// <summary>
    /// Retrieves the registered node type that matches the specified type name.
    /// </summary>
    /// <param name="typeName">The name of the node type to retrieve. The comparison is case-sensitive.</param>
    /// <returns>The <see cref="Type"/> object representing the registered node type with the specified name.</returns>
    /// <exception cref="Exception">Thrown if a node type with the specified <paramref name="typeName"/> is not registered.</exception>
    public Type GetNodeTypeFromName(string typeName)
    {
        var type = registeredNodeTypes.FirstOrDefault(t => t.Name == typeName);
        if (type == null)
            throw new Exception($"Node type '{typeName}' is not registered.");
        return type;
    }
}