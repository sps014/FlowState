using FlowState.Models.Commands;

namespace FlowState.Models.Commands;

/// <summary>
/// Manages the undo and redo stacks for the graph
/// </summary>
public class CommandManager
{
    private Stack<ICommand> undoStack = [];
    private Stack<ICommand> redoStack = [];

    /// <summary>
    /// The graph that the command manager is managing
    /// </summary>
    public FlowGraph Graph { get; }

    /// <summary>
    /// Initializes a new instance of the CommandManager class
    /// </summary>
    /// <param name="graph">The graph that the command manager is managing</param>
    /// <returns>A new instance of the CommandManager class</returns>
    public CommandManager(FlowGraph graph)
    {
        Graph = graph;
    }


    /// <summary>
    /// command added to the undo stack
    /// </summary>
    /// <param name="command">The command to execute</param>
    public void AddCommand(ICommand command)
    {

        if(Graph.Canvas==null || Graph.Canvas.IsReadOnly)
            return;
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
    /// Gets the number of commands in the undo stack
    /// </summary>
    public int UndoCount => undoStack.Count;

    /// <summary>
    /// Gets the number of commands in the redo stack
    /// </summary>
    public int RedoCount => redoStack.Count;


    /// <summary>
    /// Undoes the last command and adds it to the redo stack
    /// </summary>
    /// <returns>A task representing the asynchronous operation</returns>
    public async ValueTask UndoAsync()
    {
        if (Graph.Canvas == null || Graph.Canvas.IsReadOnly)
            return;

        if (undoStack.Count == 0)
            return;
            
        var command = undoStack.Pop();
        await command.UndoAsync();
        redoStack.Push(command);
        UndoRedoStackChanged?.Invoke(this, EventArgs.Empty);
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
        UndoRedoStackChanged?.Invoke(this, EventArgs.Empty);
    }

    public event EventHandler? UndoRedoStackChanged;
}
