namespace FlowState.Models.Commands;

/// <summary>
/// Groups multiple commands into a single undo/redo step.
/// </summary>
public class CompositeCommand : ICommand
{
    /// <summary>
    /// Commands executed in order and undone in reverse order.
    /// </summary>
    public IReadOnlyList<ICommand> Commands { get; }

    /// <summary>
    /// Initializes a new composite command.
    /// </summary>
    public CompositeCommand(IReadOnlyList<ICommand> commands)
    {
        Commands = commands;
    }

    /// <inheritdoc/>
    public async ValueTask ExecuteAsync()
    {
        foreach (var command in Commands)
            await command.ExecuteAsync();
    }

    /// <inheritdoc/>
    public async ValueTask UndoAsync()
    {
        for (int i = Commands.Count - 1; i >= 0; i--)
            await Commands[i].UndoAsync();
    }
}
