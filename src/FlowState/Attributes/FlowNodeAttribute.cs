namespace FlowState.Attributes;

[AttributeUsage(AttributeTargets.Class, Inherited = false, AllowMultiple = false)]
public sealed class FlowNodeAttribute : Attribute
{
    public string Category { get; }
    public FlowNodeAttribute(string category)
    {
        Category = category;
    }
}