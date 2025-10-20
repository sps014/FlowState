using System.Text.Json;

namespace FlowState.Models.Serializable;

/// <summary>
/// Represents a stored property with type information
/// </summary>
/// <param name="TypeAlias">The type alias for the property</param>
/// <param name="Value">The property value</param>
public record StoredProperty(string TypeAlias, object? Value)
{
    /// <summary>
    /// Gets the deserialized value of the property
    /// </summary>
    /// <returns>The deserialized value</returns>
    public object? GetValue()
    {
        var type = Type.GetType(TypeAlias);
        
        if (type == null || Value is not JsonElement json)
            return Value;

        return JsonSerializer.Deserialize(json, type);
    }
}