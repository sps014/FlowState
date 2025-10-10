
namespace FlowState.Models;

public class FlowNodeRegistry
{
    private HashSet<Type> registeredNodeTypes = new HashSet<Type>();

    public void Register<T>()
    {
        registeredNodeTypes.Add(typeof(T));
    } 
}