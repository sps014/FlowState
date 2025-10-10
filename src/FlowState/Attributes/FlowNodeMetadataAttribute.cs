namespace FlowState.Attributes;

[AttributeUsage(AttributeTargets.Class, Inherited = false, AllowMultiple = false)]
public sealed class FlowNodeMetadataAttribute : Attribute
{
    public string Category { get; }
    public FlowNodeMetadataAttribute(string category)
    {
        Category = category;
    }
}