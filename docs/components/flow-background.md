---
layout: default
title: FlowBackground
parent: Components
nav_order: 2
---

# FlowBackground

A customizable background component for the canvas. Provides the visual backdrop for your node graph.

## Overview

`FlowBackground` is placed inside the `<BackgroundContent>` section of `FlowCanvas`. It's fully styled with CSS, allowing complete customization of the canvas appearance.

## Usage

```razor
<FlowCanvas Graph="graph" Height="100vh" Width="100vw">
    <BackgroundContent>
        <FlowBackground class="my-custom-background"/>
    </BackgroundContent>
</FlowCanvas>
```

## CSS Customization

The background is styled entirely through CSS. You have full control over colors, patterns, and effects.

### Key CSS Properties

- `background` - Solid color or gradient
- `background-image` - Grid patterns using linear gradients
- `background-size` - Grid cell size
- `background-position` - Grid alignment (automatically managed during pan)

## Background Examples

### 1. Simple Grid

A basic grid pattern with evenly-spaced lines:

```css
.simple-grid {
    background: #111827;
    background-image: 
        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 100px 100px;
}
```

```razor
<FlowBackground class="simple-grid"/>
```

### 2. Dual-Grid (Major + Minor Lines)

A professional grid with major and minor gridlines:

```css
.dual-grid {
    background: #111827;
    background-image: 
        /* Main grid lines */
        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
        /* Minor grid lines */
        linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
    background-size: 
        100px 100px,  /* Main grid */
        100px 100px,
        20px 20px,    /* Minor grid */
        20px 20px;
    background-position: 
        0 0,
        0 0,
        0 0,
        0 0;
}
```

```razor
<FlowBackground class="dual-grid"/>
```

### 3. Solid Color

A simple solid background with no grid:

```css
.solid-bg {
    background: #0f172a;
}
```

```razor
<FlowBackground class="solid-bg"/>
```

### 4. Gradient Background

A subtle gradient for visual depth:

```css
.gradient-bg {
    background: linear-gradient(180deg, #111827 0%, #0f172a 100%);
}
```

### 5. Dot Pattern

A dot grid instead of lines:

```css
.dot-grid {
    background: #111827;
    background-image: 
        radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px);
    background-size: 25px 25px;
}
```

## How Panning and Zooming Work

FlowState automatically manages the background position and size during panning and zooming through CSS transforms. The background stays synchronized with the canvas content.

**Implementation Details:**

1. **Panning**: The `background-position` is updated to match the canvas offset
2. **Zooming**: The `background-size` is scaled proportionally with the zoom level
3. **Performance**: Uses CSS transforms for GPU acceleration

The JavaScript implementation (from `flowGraph.js`) handles this:

```javascript
// Pan background
function panBackgroundPosition() {
  let gridSizeMatrix = getBackgroundSizesMatrix();
  let positions = [];

  for (let row of gridSizeMatrix) {
    const computed = `${offsetX % (row[0].number * zoom)}${row[0].unit} ${
      offsetY % (row[1].number * zoom)
    }${row[1].unit}`;
    positions.push(computed);
  }

  gridEl.style.backgroundPosition = positions.join(",");
}

// Scale background
function scaleBackgroundSize() {
  const bgSizes = cacheGridBackgroundSize.split(",");

  const scaledSizes = bgSizes.map((size) => {
    const parts = size.trim().split(/\s+/);
    const scaled = parts.map((val) => {
      const match = val.match(/^([\d.]+)([a-z%]*)$/i);
      if (match) {
        const [, num, unit] = match;
        const scaledNum = parseFloat(num) * zoom;
        return `${scaledNum}${unit}`;
      }
      return val;
    });
    return scaled.join(" ");
  });

  gridEl.style.backgroundSize = scaledSizes.join(", ");
}
```

{: .note }
You don't need to worry about this implementation - FlowState handles it automatically. This is just for reference if you want to understand how it works.

## Advanced Customization

### Animated Background

Create a subtle animated effect:

```css
.animated-bg {
    background: #111827;
    background-image: 
        linear-gradient(rgba(124,58,237,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(124,58,237,0.1) 1px, transparent 1px);
    background-size: 100px 100px;
    animation: grid-pulse 4s ease-in-out infinite;
}

@keyframes grid-pulse {
    0%, 100% {
        background-image: 
            linear-gradient(rgba(124,58,237,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.1) 1px, transparent 1px);
    }
    50% {
        background-image: 
            linear-gradient(rgba(124,58,237,0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.2) 1px, transparent 1px);
    }
}
```

### Theme-Based Background

Switch backgrounds based on theme:

```css
[data-theme="dark"] .themed-bg {
    background: #111827;
    background-image: 
        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 100px 100px;
}

[data-theme="light"] .themed-bg {
    background: #f8fafc;
    background-image: 
        linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
    background-size: 100px 100px;
}
```

## Complete Example

```razor
@using FlowState.Components
@using FlowState.Models

<div class="theme-container" data-theme="@currentTheme">
    <FlowCanvas Graph="graph" Height="100vh" Width="100vw">
        <BackgroundContent>
            <FlowBackground class="themed-bg"/>
        </BackgroundContent>
    </FlowCanvas>
</div>

<style>
[data-theme="dark"] .themed-bg {
    background: #111827;
    background-image: 
        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 100px 100px;
}

[data-theme="light"] .themed-bg {
    background: #f8fafc;
    background-image: 
        linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
    background-size: 100px 100px;
}
</style>

@code {
    FlowGraph graph = new();
    string currentTheme = "dark";
}
```

## See Also

- [FlowCanvas](./flow-canvas.html) - Main canvas component
- [Styling Guide](../customization/styling-guide.html) - Complete styling reference
- [Getting Started](../getting-started.html) - Background examples in context

