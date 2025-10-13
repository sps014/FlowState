namespace FlowState.Models;

public class GraphFlowExecution
{
    private Dictionary<string, string> activeInputs = new(); // map of active node to it's active input socket
    private Dictionary<string, string> activeOutputs = new();

    public FlowGraph Graph { get; }
    public ExecutionDirection Direction { get; }
    
    public GraphFlowExecution(FlowGraph graph, ExecutionDirection direction)
    {
        Graph = new FlowGraph();
        Direction = direction;
    }


    private string[] GetExecutionOrder()
    {
      var visited = new HashSet<string>();
      var visiting = new HashSet<string>();
      var result = new List<string>();

      var dependencies = new Dictionary<string, HashSet<string>>();

      foreach(var node in Graph.Nodes)
      {
        dependencies[node.Id] = [];
      }

      // Build dependency graph based on execution direction
      foreach(var edge in Graph.Edges)
      {
        if (Direction == ExecutionDirection.InputToOutput)
        {
          // Normal flow: outputs depend on inputs
          // ToSocket node depends on FromSocket node
          dependencies[edge.ToSocket!.FlowNode!.Id].Add(edge.FromSocket!.FlowNode!.Id);
        }
        else // OutputToInput
        {
          // Reverse flow: inputs depend on outputs
          // FromSocket node depends on ToSocket node
          dependencies[edge.FromSocket!.FlowNode!.Id].Add(edge.ToSocket!.FlowNode!.Id);
        }
      }

      void Visit(string nodeId)
      {
        if (visiting.Contains(nodeId))
        {
          throw new Exception($"Circular dependency detected involving node {nodeId}");
          return;
        }
        
        if (visited.Contains(nodeId))
          return;
        
        visiting.Add(nodeId);
        
        // Visit all dependencies first
        if (dependencies.TryGetValue(nodeId, out var deps))
        {
          foreach (var depId in deps)
          {
            Visit(depId);
          }
        }
        
        visiting.Remove(nodeId);
        visited.Add(nodeId);
        
        // Add to execution order
        result.Add(nodeId);
      }

      foreach(var node in Graph.Nodes)
      {
        if(!visited.Contains(node.Id))
          Visit(node.Id);
      }
      return result.ToArray();
    }
}

public enum ExecutionDirection
{
    InputToOutput,
    OutputToInput
}