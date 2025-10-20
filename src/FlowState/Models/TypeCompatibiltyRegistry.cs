using System.Collections.Concurrent;

namespace FlowState.Models;

/// <summary>
/// Registry for managing type compatibility rules between sockets
/// </summary>
public class TypeCompatibiltyRegistry
{
    private Dictionary<string, HashSet<string>> fromToComatibilityMap = new();

    /// <summary>
    /// Registers compatible types for a given type
    /// </summary>
    /// <typeparam name="T">The source type</typeparam>
    /// <param name="toTypes">The compatible target types</param>
    public void Register<T>(params Type[] toTypes)
    {
        Register(typeof(T).ToString(), toTypes.Select(x => x.ToString()));
    }

    /// <summary>
    /// Registers compatible types for a given type name
    /// </summary>
    /// <param name="fromType">The source type name</param>
    /// <param name="toTypes">The compatible target type names</param>
    public void Register(string fromType, params IEnumerable<string> toTypes)
    {
        fromToComatibilityMap[fromType] = toTypes.ToHashSet();
    }

    /// <summary>
    /// Checks if two types are compatible
    /// </summary>
    /// <param name="fromType">The source type name</param>
    /// <param name="toType">The target type name</param>
    /// <returns>True if the types are compatible, false otherwise</returns>
    public bool IsCompatible(string fromType, string toType)
    {
        if (fromToComatibilityMap.ContainsKey(fromType) && fromToComatibilityMap[fromType].Contains(toType))
            return true;
        return false;
    }
    
    /// <summary>
    /// Checks if two types are compatible
    /// </summary>
    /// <param name="fromType">The source type</param>
    /// <param name="toType">The target type</param>
    /// <returns>True if the types are compatible, false otherwise</returns>
    public bool IsCompatible(Type fromType,Type toType)
    {
        return IsCompatible(fromType.ToString(), toType.ToString());
    }

}