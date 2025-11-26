---
layout: default
title: CommandManager
nav_order: 13
---

# CommandManager

Undo/redo system using the command pattern. Provides unlimited history for graph operations.

## Overview

`CommandManager` automatically tracks graph operations and provides undo/redo functionality. All node and edge operations are recorded.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| Graph | FlowGraph | Associated graph |
| UndoCount | int | Number of operations in undo stack |
| RedoCount | int | Number of operations in redo stack |

## Methods

### UndoAsync
Undoes the last operation.

**Signature**: `ValueTask UndoAsync()`

```csharp
await graph.CommandManager.UndoAsync();
```

### RedoAsync
Redoes the last undone operation.

**Signature**: `ValueTask RedoAsync()`

```csharp
await graph.CommandManager.RedoAsync();
```

### ClearStacks
Clears the undo and redo stacks.

**Signature**: `void ClearStacks()`

```csharp
graph.CommandManager.ClearStacks();
```

## Events

### UndoRedoStackChanged
Fired when the undo/redo stacks change.

**Type**: `EventHandler<EventArgs>`

```csharp
graph.CommandManager.UndoRedoStackChanged += (sender, e) =>
{
    UpdateUI();
};
```

## Automatic Tracking

Commands are automatically tracked for:
- Node creation
- Node removal
- Edge creation
- Edge removal

```csharp
// These operations are automatically tracked:
await graph.CreateNodeAsync<MyNode>(100, 100, []);  // Tracked
await graph.RemoveNodeAsync(nodeId);                // Tracked
await graph.ConnectAsync(from, to, "Out", "In");   // Tracked
await graph.RemoveEdgeAsync(edgeId);                // Tracked
```

## UI Integration

### Undo/Redo Buttons

```razor
<button @onclick="Undo" 
        disabled="@(graph.CommandManager.UndoCount == 0)">
    ↶ Undo (@graph.CommandManager.UndoCount)
</button>

<button @onclick="Redo" 
        disabled="@(graph.CommandManager.RedoCount == 0)">
    ↷ Redo (@graph.CommandManager.RedoCount)
</button>

@code {
    async Task Undo()
    {
        await graph.CommandManager.UndoAsync();
    }

    async Task Redo()
    {
        await graph.CommandManager.RedoAsync();
    }
}
```

### Keyboard Shortcuts

FlowCanvas automatically handles Ctrl+Z / Ctrl+Y:

```csharp
// Built-in keyboard shortcuts:
// Ctrl+Z or Cmd+Z → Undo
// Ctrl+Y or Cmd+Shift+Z → Redo
```

**Note:** Keyboard shortcuts for undo/redo are automatically handled by FlowCanvas:
- **Ctrl+Z** (Windows/Linux) or **Cmd+Z** (Mac): Undo
- **Ctrl+Y** or **Ctrl+Shift+Z** (Windows/Linux) or **Cmd+Y** or **Cmd+Shift+Z** (Mac): Redo

No additional setup is required for keyboard shortcuts.

## Complete Example

```razor
@using FlowState.Components
@using FlowState.Models

<div class="toolbar">
    <button class="toolbar-btn" 
            @onclick="Undo"
            disabled="@(!CanUndo)">
        ↶ Undo
    </button>
    
    <button class="toolbar-btn" 
            @onclick="Redo"
            disabled="@(!CanRedo)">
        ↷ Redo
    </button>
    
    <div class="history-info">
        History: @graph.CommandManager.UndoCount operations
    </div>
</div>

<FlowCanvas Graph="graph" Height="calc(100vh - 60px)" Width="100vw">
    <BackgroundContent>
        <FlowBackground class="grid-bg"/>
    </BackgroundContent>
</FlowCanvas>

@code {
    FlowGraph graph = new();
    
    bool CanUndo => graph.CommandManager.UndoCount > 0;
    bool CanRedo => graph.CommandManager.RedoCount > 0;

    protected override void OnInitialized()
    {
        // Subscribe to stack changes to update UI
        graph.CommandManager.UndoRedoStackChanged += (s, e) =>
        {
            StateHasChanged();
        };
        
        graph.RegisterNode<MyNode>();
    }

    async Task Undo()
    {
        if (CanUndo)
        {
            await graph.CommandManager.UndoAsync();
        }
    }

    async Task Redo()
    {
        if (CanRedo)
        {
            await graph.CommandManager.RedoAsync();
        }
    }
}
```

## Read-Only Mode

Commands are not tracked in read-only mode:

```csharp
await canvas.SetReadOnlyAsync(true);

// Operations in read-only mode are not tracked
// Undo/redo are disabled
```

## Clearing History

Clear the command history when appropriate:

```csharp
// After loading a new graph
await graph.DeserializeAsync(json);
graph.CommandManager.ClearStacks();

// After clearing the canvas
await graph.ClearAsync();
// Stacks are automatically cleared
```

## Stack Limits

There is no built-in limit to the undo/redo stacks. For memory-constrained scenarios, you might want to implement a custom limit.

## Suppressing Commands

Operations can suppress command tracking:

```csharp
// Internal use - normally not needed in user code
await graph.CreateNodeAsync<MyNode>(
    100, 100, 
    [], 
    suppressEvent: false,
    suppressAddingToCommandStack: true  // Don't track
);
```

## Command Types

The following command types are automatically tracked:

1. **NodeAddedCommand** - Node creation
2. **NodeRemovedCommand** - Node deletion (includes connected edges)
3. **EdgeAddedCommand** - Edge creation
4. **EdgeRemovedCommand** - Edge deletion

## See Also

- [FlowGraph](./flow-graph.html) - Graph operations
- [FlowCanvas](./components/flow-canvas.html) - Keyboard events
- [Getting Started](./getting-started.html) - Complete examples with undo/redo

