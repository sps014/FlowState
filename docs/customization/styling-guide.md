---
layout: default
title: Styling Guide
parent: Customization
nav_order: 5
---

# Styling Guide

Complete CSS reference for customizing the look of your FlowState node editor. This guide shows the exact CSS from `GraphViewport.razor` - copy and modify it to match your design.

## Complete GraphViewport CSS

This is the production-ready CSS used in the GraphViewport example. Copy this entire block into your component's `<style>` section.

```css
.flow-node .title { 
  font-weight: 600; 
  font-size: 14px; 
  margin-bottom: 8px; 
  color: white;
  padding: 12px 16px 8px;
  background: linear-gradient(90deg, rgba(124,58,237,0.1), transparent);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px 12px 0 0;
}

.flow-node .body { 
  font-size: 13px; 
  color: #cbd5e1;
  padding: 12px 16px;
}


.flow-node {
  position: absolute;
  min-width: 160px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
  border: 1px solid rgba(255,255,255,0.05);
  box-shadow: 
    0 8px 32px rgba(2,6,23,0.6),
    inset 0 1px 0 rgba(255,255,255,0.05);
  transform-origin: 0 0;
  user-select: none;
  cursor: grab;
  backdrop-filter: blur(8px);
  z-index: 10; /* Default z-index for regular nodes */
  
  /* PERFORMANCE OPTIMIZATIONS */
  /* GPU acceleration with proper text rendering */
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  
  /* Text rendering optimizations - prevents blur during zoom */
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: auto;
  text-rendering: geometricPrecision;
  
  /* Force subpixel precision for crisp text at any zoom level */
  -webkit-transform: translate3d(0, 0, 0);
  -webkit-perspective: 1000;
  perspective: 1000;
  
  /* CSS containment for better rendering performance */
  contain: layout style paint;
  
  /* Prevent layout thrashing */
  isolation: isolate;
}

/* Group nodes should be behind edges and regular nodes */
.flow-node[kind="Group"] {
    z-index: 1 !important;
}



.flow-grid-lines
{
    background: #111827;
    background-image: 
    /* Main grid lines */
    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
    /* Minor grid lines */
    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 
    100px 100px,
    100px 100px,
    20px 20px,
    20px 20px;
  background-position: 
    0 0,        /* Main grid */
    0 0,        /* Main grid */
    0 0,        /* Minor grid */
    0 0;        /* Minor grid */
}

/* Input box styles */
.input-box {
  width: 90%;
  padding: 6px 8px;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  background: rgba(255,255,255,0.05);
  color: #fff;
  font-size: 12px;
  outline: none;
  transition: all 0.2s ease;
  margin: 4px 0;
  pointer-events: auto;
  cursor: text;
}

:deep .input-box:focus {
  border-color: var(--fg-accent);
  background: rgba(255,255,255,0.1);
}

.input-box::placeholder {
  color: rgba(255,255,255,0.5);
}
.title-container {
    position: relative;
}

.execution-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
    overflow: hidden;
}

.execution-progress::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: linear-gradient(90deg, 
        transparent 0%, 
        #4CAF50 25%, 
        #8BC34A 50%, 
        #4CAF50 75%, 
        transparent 100%);
    animation: progress-slide 1.5s ease-in-out infinite;
}

@keyframes progress-slide {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}
```

## How to Use

Add these styles to your Blazor component:

```razor
<FlowCanvas Graph="graph" Height="calc(100vh - 60px)">
    <BackgroundContent>
        <FlowBackground class="flow-grid-lines"/>
    </BackgroundContent>
</FlowCanvas>

<style>
    /* Paste the CSS above here */
</style>
```

## What Each Section Does

### Node Title Styling
```css
.flow-node .title { ... }
```
- Styles the title area at the top of each node
- Creates a gradient background (purple to transparent)
- Adds rounded corners at the top
- Sets font size and padding

### Node Body Styling
```css
.flow-node .body { ... }
```
- Styles the main content area of nodes
- Sets text color and padding
- Defines font size for node content

### Main Node Container
```css
.flow-node { ... }
```
- Creates the glassmorphism effect with `backdrop-filter: blur(8px)`
- Adds shadow and border for depth
- Sets up positioning and sizing
- **Performance optimizations**: GPU acceleration, text rendering hints, and layout containment for smooth panning/zooming

### Group Node Z-Index
```css
.flow-node[kind="Group"] { ... }
```
- Ensures group nodes appear behind regular nodes and edges
- Important for proper visual layering

### Grid Background
```css
.flow-grid-lines { ... }
```
- Creates a dual-grid pattern (major and minor lines)
- Major grid: 100px spacing with 0.1 opacity
- Minor grid: 20px spacing with 0.05 opacity
- Dark background color: `#111827`

### Input Elements
```css
.input-box { ... }
```
- Styles text inputs inside nodes (like in InputNode)
- Semi-transparent background that brightens on focus
- Uses CSS variables for accent color (`--fg-accent`)

### Execution Progress Indicator
```css
.execution-progress { ... }
```
- Shows an animated progress bar during node execution
- Sliding gradient effect (green wave)
- Appears at the bottom of the title area
- 1.5-second animation loop

## Customization Tips

**Change Colors:**
- Node background: Modify `rgba(255,255,255,0.03)` in `.flow-node`
- Grid lines: Change `rgba(255,255,255,0.1)` in `.flow-grid-lines`
- Accent color: Update `rgba(124,58,237,0.1)` in `.flow-node .title`

**Adjust Grid Spacing:**
- Major grid: Change `100px 100px` in `background-size`
- Minor grid: Change `20px 20px` in `background-size`

**Modify Glass Effect:**
- Blur strength: Change `blur(8px)` in `backdrop-filter`
- Transparency: Adjust `rgba` alpha values

**Performance:**
- Keep all GPU acceleration properties (`transform: translate3d`, `backface-visibility`, etc.)
- These prevent blurry text when zooming

## See Also

- [Getting Started](../getting-started.html) - Complete working example
- [Custom Nodes](./custom-nodes.html) - Create your own node types
- [FlowBackground](../components/flow-background.html) - Background component reference

