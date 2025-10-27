---
layout: default
title: Installation
nav_order: 2
---

# Installation

FlowState is available as a NuGet package and works with both Blazor Server and Blazor WebAssembly.

## Blazor Server

### 1. Install the Package

```bash
dotnet add package FlowState
```

### 2. Set Render Mode

FlowState requires interactive server rendering. Add the render mode directive to your page:

```razor
@page "/"
@rendermode InteractiveServer
```

### 3. Add Required Imports

Add FlowState namespaces to your `_Imports.razor`:

```razor
@using FlowState.Components
@using FlowState.Models
@using FlowState.Models.Events
@using FlowState.Attributes
```

### 4. Verify Installation

Create a simple test page:

```razor
@page "/test"
@rendermode InteractiveServer
@using FlowState.Components
@using FlowState.Models

<FlowCanvas Height="100vh" Width="100vw" Graph="graph">
    <BackgroundContent>
        <FlowBackground class="test-bg"/>
    </BackgroundContent>
</FlowCanvas>

<style>
.test-bg {
    background: #111827;
}
</style>

@code {
    FlowGraph graph = new();
}
```

If you see a dark canvas, the installation is successful!

## Blazor WebAssembly

### 1. Install the Package

```bash
dotnet add package FlowState
```

### 2. Add Required Imports

Add FlowState namespaces to your `_Imports.razor`:

```razor
@using FlowState.Components
@using FlowState.Models
@using FlowState.Models.Events
@using FlowState.Attributes
```

### 3. Browser Requirements

FlowState uses modern browser APIs and requires:
- Chrome 90+
- Firefox 88+
- Safari 14.1+
- Edge 90+

### 4. Verify Installation

Create the same test page as shown in the Blazor Server section (without the `@rendermode` directive for WASM).

## Next Steps

- [Getting Started](./getting-started.html) - Build your first node graph
- [Components Overview](./components/flow-canvas.html) - Learn about FlowCanvas
- [Create Custom Nodes](./customization/custom-nodes.html) - Build your own nodes

## Troubleshooting

### Package Not Found

Make sure your NuGet sources include nuget.org:

```bash
dotnet nuget list source
```

### Render Mode Error

If you see errors about interactivity, ensure you have:
- Added `@rendermode InteractiveServer` to your page
- Configured Blazor Server correctly in `Program.cs`

### JavaScript Errors

FlowState uses JavaScript interop. Ensure:
- Your app is running in a browser context
- JavaScript is enabled
- No Content Security Policy is blocking scripts

