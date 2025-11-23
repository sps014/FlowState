---
layout: default
title: Performance Guide
nav_order: 9
---

# Performance Guide

FlowState is designed to handle graphs with hundreds of nodes, but as the complexity of your graph grows, rendering performance becomes critical. This guide outlines best practices and common pitfalls to avoid to ensure your application remains responsive.

## Automatic Optimizations

FlowState includes built-in optimizations to maintain smooth performance during panning and zooming.

### Interaction States
When a user pans or zooms the canvas, FlowState automatically adds the following CSS classes to the main `.flow-canvas` element:
- `.is-panning`: Active while dragging the canvas.
- `.is-zooming`: Active while scrolling to zoom.

By default, FlowState uses these classes to:
1.  **Disable Expensive Styles**: `box-shadow`, `backdrop-filter`, and `transition` are disabled on all `.flow-node` elements to reduce GPU fill-rate costs.
2.  **Disable Input Interaction**: Pointer events are disabled on `<input>` and `<textarea>` elements to prevent browser hit-testing overhead during movement.

## User-Side Optimizations

While FlowState handles the basics, your custom node content can still impact performance.

### 1. Optimize Custom Node Styles
If you add custom styling *inside* your nodes (e.g., a specific inner container with a shadow or blur), the default optimizations might not catch it. You should target your custom elements using the interaction classes:

```css
/* Example: You have a custom card inside your node */
.my-custom-node-card {
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

/* Optimize it! */
.flow-canvas.is-panning .my-custom-node-card,
.flow-canvas.is-zooming .my-custom-node-card {
    box-shadow: none !important;
    filter: none !important;
}
```

### 2. Avoid Expensive CSS Properties
Even when static, certain properties can be heavy if used on hundreds of nodes:
- **`box-shadow`**: Large blur radii are expensive.
- **`backdrop-filter`**: Very computationally intensive (glassmorphism).
- **`border-radius`**: Can add overhead when combined with borders and shadows.
- **Complex Gradients**: Prefer simple colors or images where possible.

### 3. Minimize DOM Depth
Keep your custom node components lightweight. Deep DOM trees inside every node multiply quickly.
- **Bad:** Nested divs for simple layouts.
- **Good:** Flat structures using CSS Grid or Flexbox.

### 4. Avoid Heavy Blazor Logic in Nodes
Nodes are rendered as Blazor components.
- Avoid complex calculations in `OnParametersSet` or `OnAfterRender` of your node components.
- Avoid hooking into global events (like `MouseMove`) inside individual nodes.

## Graph Management

### 1. Batch Updates
If you are programmatically adding or moving many nodes (e.g., auto-layout), avoid triggering a re-render for every single change.
- Use `SuspendRefresh` / `ResumeRefresh` patterns if available in your logic (or simply don't call `StateHasChanged` until the end of a batch operation).

### 2. Limit Node Count
While optimizations allow for 200-500+ nodes, web browsers have limits.
- **< 100 nodes:** Should run smoothly on most devices.
- **100 - 500 nodes:** Relies heavily on the CSS optimizations mentioned above.
- **500+ nodes:** Consider virtualization or pagination strategies (splitting logic into sub-graphs).

## Common Pitfalls to Avoid

1.  **Reactive Styles:** Do not bind `style` attributes to C# variables that update frequently (e.g., updating a color variable on every mouse move). This forces Blazor to diff the DOM constantly. Use CSS classes instead.
3.  **Large Input Fields:** Large `<textarea>` or rich text editors inside nodes can cause significant reflow costs when dragged.
