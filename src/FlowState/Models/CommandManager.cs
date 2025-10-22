using FlowState.Models.Commands;

namespace FlowState.Models;

/// <summary>
/// Manages the undo and redo stacks for the graph
/// </summary>
public class CommandManager
{
    private Stack<ICommand> undoStack = [];
    private Stack<ICommand> redoStack = [];


    /// <summary>
    /// command added to the undo stack
    /// </summary>
    /// <param name="command">The command to execute</param>
    public void AddCommand(ICommand command)
    {
        //await command.ExecuteAsync();
        undoStack.Push(command);
        redoStack.Clear();
    }

    /// <summary>
    /// Clears the undo and redo stacks
    /// </summary>
    public void ClearStacks()
    {
        undoStack.Clear();
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
