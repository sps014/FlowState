using FlowState.Models.Commands;

namespace FlowState.Models.Commands;

/// <summary>
/// Manages the undo and redo stacks for the graph
/// </summary>
public class CommandManager
{
    private Stack<ICommand> undoStack = [];
    private Stack<ICommand> redoStack = [];
    private int batchDepth;
    private List<ICommand>? batch;

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
        if (Graph.IsReadOnly)
            return;

        if (batch != null)
        {
            batch.Add(command);
            return;
        }

        undoStack.Push(command);
        redoStack.Clear();
        UndoRedoStackChanged?.Invoke(this, EventArgs.Empty);
    }

    /// <summary>
    /// Starts grouping subsequent commands into a single undo step.
    /// Nested calls are supported.
    /// </summary>
    public void BeginBatch()
    {
        if (batchDepth++ == 0)
            batch = [];
    }

    /// <summary>
    /// Ends the current command batch and pushes a composite command when more than one
    /// command was recorded.
    /// </summary>
    public void EndBatch()
    {
        if (batchDepth == 0)
            return;

        batchDepth--;
        if (batchDepth > 0)
            return;

        var commands = batch ?? [];
        batch = null;

        if (commands.Count == 0)
            return;

        if (commands.Count == 1)
            AddCommand(commands[0]);
        else
            AddCommand(new CompositeCommand(commands));
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
        if (Graph == null || Graph.IsReadOnly)
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


    /// <summary>
    /// Occurs when the state of the undo or redo stack changes.
    /// </summary>
    /// <remarks>Subscribe to this event to be notified when actions affecting the undo or redo history occur,
    /// such as performing, undoing, or redoing an operation. This event can be used to update UI elements or enable and
    /// disable commands related to undo and redo functionality.</remarks>
    public event EventHandler? UndoRedoStackChanged;
}
