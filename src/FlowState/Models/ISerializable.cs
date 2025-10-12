namespace FlowState.Models;

public interface ISerializable<T>
{
    ValueTask<T> GetSerializableObjectAsync();
}