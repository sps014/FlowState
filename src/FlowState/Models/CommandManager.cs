namespace FlowState.Models;

/// <summary>
/// Manages the undo and redo stacks for the graph
/// </summary>
public class CommandManager
{
    private Stack<ICommand> undoStack = [];
    private Stack<ICommand> redoStack = [];


    /// <summary>
    /// Executes a command and adds it to the undo stack
    /// </summary>
    /// <param name="command">The command to execute</param>
    /// <returns>A task representing the asynchronous operation</returns>
    public async ValueTask ExecuteCommandAsync(ICommand command)
    {
        await command.ExecuteAsync();
        undoStack.Push(command);
        redoStack.Clear();
    }


    /// <summary>
    /// Undoes the last command and adds it to the redo stack
    /// </summary>
    /// <returns>A task representing the asynchronous operation</returns>
    public async ValueTask UndoAsync()
    {
        if (undoStack.Count == 0)
            return;
        var command = undoStack.Pop();
        await command.UndoAsync();
        redoStack.Push(command);
    }


    /// <summary>
    /// Redoes the last command and adds it to the undo stack
    /// </summary>
    /// <returns>A task representing the asynchronous operation</returns>
    public async ValueTask RedoAsync()
    {
        if (redoStack.Count == 0)
            return;
        var command = redoStack.Pop();
        await command.ExecuteAsync();
        undoStack.Push(command);
    }
}


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