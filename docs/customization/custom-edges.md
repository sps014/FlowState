---
layout: default
title: Custom Edges
parent: Customization
parent: Customization
nav_order: 1
---

# Custom Edge Paths

Create custom edge rendering with JavaScript functions for unique connection styles.

## Overview

By default, FlowState uses curved Bézier edges. You can replace this with custom edge path functions to create straight lines, stepped connections, or any SVG path style.

## How It Works

1. Create a JavaScript function that takes `from` and `to` positions
2. Return an SVG path string
3. Expose the function on the `window` object
4. Set `JsEdgePathFunctionName` on FlowCanvas

## Unity-Style Edges (Complete Example)

This example creates edges with horizontal extensions and rounded corners, similar to Unity's node editor.

### 1. Create graphLine.js

```javascript
function createUnityStylePath(from, to) {
  const HORIZONTAL_OFFSET = 50;
  const CORNER_RADIUS = 10;
  
  const p1 = { x: from.x + HORIZONTAL_OFFSET, y: from.y };
  const p2 = { x: to.x - HORIZONTAL_OFFSET, y: to.y };
  
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const radius = Math.min(CORNER_RADIUS, dist / 2);
  
  const ux = dx / dist;
  const uy = dy / dist;
  
  return `M ${from.x} ${from.y} 
          L ${p1.x - radius} ${p1.y} 
          Q ${p1.x} ${p1.y}, ${p1.x + radius * ux} ${p1.y + radius * uy}
          L ${p2.x - radius * ux} ${p2.y - radius * uy}
          Q ${p2.x} ${p2.y}, ${p2.x + radius} ${p2.y}
          L ${to.x} ${to.y}`;
}

window.EdgePathFunc = createUnityStylePath;
```

### 2. Load the JavaScript

Place the file in `wwwroot` and load it:

```csharp
@inject IJSRuntime JSRuntime

@code {
    protected override async Task OnInitializedAsync()
    {
        await JSRuntime.InvokeAsync<IJSObjectReference>(
            "import", 
            "/_content/YourProject/graphLine.js"
        );
    }
}
```

### 3. Use in FlowCanvas

```razor
<FlowCanvas Graph="graph" 
            JsEdgePathFunctionName="EdgePathFunc"
            Height="100vh" 
            Width="100vw">
    <BackgroundContent>
        <FlowBackground class="grid-bg"/>
    </BackgroundContent>
</FlowCanvas>
```

## Straight Line Edges

Simple straight connections:

```javascript
function createStraightPath(from, to) {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
}

window.StraightEdge = createStraightPath;
```

## Stepped Edges

Orthogonal/stepped connections:

```javascript
function createSteppedPath(from, to) {
  const midX = (from.x + to.x) / 2;
  
  return `M ${from.x} ${from.y} 
          L ${midX} ${from.y} 
          L ${midX} ${to.y} 
          L ${to.x} ${to.y}`;
}

window.SteppedEdge = createSteppedPath;
```

## Bezier Curves (Custom)

Custom Bézier curve implementation:

```javascript
function createCustomBezier(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // Control point offset based on distance
  const offset = Math.min(200, dist * 0.5);
  
  const c1x = from.x - offset;
  const c1y = from.y;
  const c2x = to.x + offset;
  const c2y = to.y;
  
  return `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;
}

window.CustomBezier = createCustomBezier;
```

## Animated Edges

Add animation with SVG attributes (CSS or SMIL):

```javascript
function createAnimatedPath(from, to) {
  const path = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  // Path is returned, animation handled via CSS
  return path;
}

window.AnimatedEdge = createAnimatedPath;
```

Then style with CSS:

```css
.edge {
    stroke-dasharray: 10 5;
    animation: dash 1s linear infinite;
}

@keyframes dash {
    to {
        stroke-dashoffset: -15;
    }
}
```

## Curved with Horizontal Exit

Edges that exit horizontally before curving:

```javascript
function createHorizontalCurve(from, to) {
  const EXIT_DISTANCE = 30;
  
  const fromExit = { x: from.x - EXIT_DISTANCE, y: from.y };
  const toEntry = { x: to.x + EXIT_DISTANCE, y: to.y };
  
  const dx = toEntry.x - fromExit.x;
  const dy = toEntry.y - fromExit.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const controlOffset = dist * 0.3;
  
  const c1x = fromExit.x - controlOffset;
  const c1y = fromExit.y;
  const c2x = toEntry.x + controlOffset;
  const c2y = toEntry.y;
  
  return `M ${from.x} ${from.y} 
          L ${fromExit.x} ${fromExit.y} 
          C ${c1x} ${c1y}, ${c2x} ${c2y}, ${toEntry.x} ${toEntry.y} 
          L ${to.x} ${to.y}`;
}

window.HorizontalCurve = createHorizontalCurve;
```

## Circuit Board Style

Sharp corners for a technical look:

```javascript
function createCircuitPath(from, to) {
  const SEGMENT_LENGTH = 40;
  
  const midY = (from.y + to.y) / 2;
  const p1 = { x: from.x - SEGMENT_LENGTH, y: from.y };
  const p2 = { x: from.x - SEGMENT_LENGTH, y: midY };
  const p3 = { x: to.x + SEGMENT_LENGTH, y: midY };
  const p4 = { x: to.x + SEGMENT_LENGTH, y: to.y };
  
  return `M ${from.x} ${from.y} 
          L ${p1.x} ${p1.y} 
          L ${p2.x} ${p2.y} 
          L ${p3.x} ${p3.y} 
          L ${p4.x} ${p4.y} 
          L ${to.x} ${to.y}`;
}

window.CircuitEdge = createCircuitPath;
```

## Position Parameters

The `from` and `to` parameters are objects with `x` and `y` properties:

```javascript
function myEdgeFunction(from, to) {
  // from = { x: 100, y: 50 }  // Output socket position
  // to = { x: 300, y: 150 }    // Input socket position
  
  // Return SVG path string
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
}
```

## SVG Path Commands

Quick reference for SVG path commands:

```javascript
// Move to
`M ${x} ${y}`

// Line to
`L ${x} ${y}`

// Cubic Bézier curve
`C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x} ${y}`

// Quadratic Bézier curve
`Q ${cx} ${cy}, ${x} ${y}`

// Arc
`A ${rx} ${ry} ${rotation} ${largeArc} ${sweep} ${x} ${y}`
```

## Testing Your Edge Function

1. Create the JavaScript file
2. Load it in your component
3. Reference it in FlowCanvas
4. Create nodes and connect them
5. Observe the edge rendering

## Complete Working Example

```javascript
// wwwroot/myEdges.js
function createMyCustomEdge(from, to) {
  // Your custom logic here
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  // Example: Wavy path
  const midX = (from.x + to.x) / 2;
  const wave = Math.sin(dx / 50) * 20;
  
  return `M ${from.x} ${from.y} 
          Q ${midX} ${from.y + wave}, ${to.x} ${to.y}`;
}

window.MyCustomEdge = createMyCustomEdge;

export function Load() {
  console.log("Custom edges loaded");
}
```

```razor
@page "/custom-edges"
@inject IJSRuntime JSRuntime

<FlowCanvas Graph="graph"
            JsEdgePathFunctionName="MyCustomEdge"
            Height="100vh"
            Width="100vw">
    <BackgroundContent>
        <FlowBackground class="grid-bg"/>
    </BackgroundContent>
</FlowCanvas>

@code {
    FlowGraph graph = new();

    protected override async Task OnInitializedAsync()
    {
        await JSRuntime.InvokeAsync<IJSObjectReference>(
            "import",
            "/myEdges.js"
        );
        
        graph.RegisterNode<MyNode>();
    }
}
```

## See Also

- [FlowCanvas](../components/flow-canvas.html) - JsEdgePathFunctionName parameter
- [Getting Started](../getting-started.html) - GraphViewportUnity example
- [Styling Guide](./styling-guide.html) - Edge styling with CSS

