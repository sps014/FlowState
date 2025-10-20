namespace FlowState.Models;

/// <summary>
/// Defines a contract for objects that can be serialized
/// </summary>
/// <typeparam name="T">The type of the serializable object</typeparam>
public interface ISerializable<T>
{
    /// <summary>
    /// Gets the serializable representation of the object
    /// </summary>
    /// <returns>A task containing the serializable object</returns>
    ValueTask<T> GetSerializableObjectAsync();
}