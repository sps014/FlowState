namespace FlowState.Models.Commands;

/// <summary>
/// Interface for commands that can be executed and undone
/// </summary>
public interface ICommand
{
    /// <summary>
    /// Executes the command
    /// </summary>
    /// <returns>A task representing the asynchronous operation</returns>
    ValueTask ExecuteAsync();

    /// <summary>
    /// Undoes the command
    /// </summary>
    /// <returns>A task representing the asynchronous operation</returns>
    ValueTask UndoAsync();
}
