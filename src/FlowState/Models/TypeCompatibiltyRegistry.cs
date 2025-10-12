using System.Collections.Concurrent;

namespace FlowState.Models;

public class TypeCompatibiltyRegistry
{
    private Dictionary<string, HashSet<string>> fromToComatibilityMap = new();

    public void Register<T>(params Type[] toTypes)
    {
        Register(typeof(T).ToString(), toTypes.Select(x => x.ToString()));
    }

    public void Register(string fromType, params IEnumerable<string> toTypes)
    {
        fromToComatibilityMap[fromType] = toTypes.ToHashSet();
    }

    public bool IsCompatible(string fromType, string toType)
    {
        if (fromToComatibilityMap.ContainsKey(fromType) && fromToComatibilityMap[fromType].Contains(toType))
            return true;
        return false;
    }
    public bool IsCompatible(Type fromType,Type toType)
    {
        return IsCompatible(fromType.ToString(), toType.ToString());
    }

}