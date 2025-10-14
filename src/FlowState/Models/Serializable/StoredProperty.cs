using System.Text.Json;

namespace FlowState.Models.Serializable;

public record StoredProperty(string TypeAlias, object? Value)
{
    public object? GetValue()
    {
        var type = Type.GetType(TypeAlias);
        
        if (type == null || Value is not JsonElement json)
            return Value;

        return JsonSerializer.Deserialize(json, type);
    }
}