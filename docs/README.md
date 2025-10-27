# FlowState Documentation

This directory contains the complete documentation for FlowState, built with Jekyll and hosted on GitHub Pages.

## Local Development

To build and preview the documentation locally:

### Prerequisites

1. Install Ruby (2.7 or higher)
2. Install Bundler:
   ```bash
   gem install bundler
   ```

### Setup

1. Create a `Gemfile` in the docs directory:
   ```ruby
   source "https://rubygems.org"
   gem "github-pages", group: :jekyll_plugins
   gem "just-the-docs"
   ```

2. Install dependencies:
   ```bash
   cd docs
   bundle install
   ```

### Run Locally

```bash
bundle exec jekyll serve
```

Then navigate to `http://localhost:4000/FlowState/`

## GitHub Pages Deployment

### Enable GitHub Pages

1. Go to repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: `main` (or your default branch)
4. Folder: `/docs`
5. Save

GitHub will automatically build and deploy the site.

### Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to the docs directory with your domain
2. Configure DNS settings for your domain

## Structure

```
docs/
├── _config.yml              # Jekyll configuration
├── index.md                 # Home page
├── installation.md          # Installation guide
├── getting-started.md       # Getting started tutorial
├── components/              # Component documentation
│   ├── flow-canvas.md
│   ├── flow-background.md
│   ├── flow-socket.md
│   ├── flow-node-base.md
│   ├── flow-context-menu.md
│   ├── flow-panels.md
│   ├── flow-group-node-base.md
│   └── flow-resize-handle.md
├── customization/           # Customization guides
│   ├── custom-nodes.md
│   ├── custom-sockets.md
│   ├── custom-edges.md
│   ├── custom-panels.md
│   └── styling-guide.md
├── flow-graph.md            # Core class documentation
├── flow-execution-context.md
├── type-compatibility.md
├── command-manager.md
├── serialization.md
└── examples.md              # Example projects
```

## Theme

This documentation uses the [just-the-docs](https://github.com/just-the-docs/just-the-docs) theme with dark color scheme.

## Contributing

To contribute to the documentation:

1. Edit the relevant `.md` file
2. Test locally with `bundle exec jekyll serve`
3. Submit a pull request

## Markdown Features

- Standard markdown syntax
- Code fences with syntax highlighting
- Tables
- Callouts (note, warning, tip)
- Internal links

### Example Callouts

```markdown
{: .note }
> This is a note

{: .warning }
> This is a warning

{: .tip }
> This is a tip
```

## Publishing Updates

1. Edit documentation files
2. Commit changes
3. Push to GitHub
4. GitHub Pages will automatically rebuild (takes 1-2 minutes)

## Links

- Live Documentation: https://sps014.github.io/FlowState/
- Repository: https://github.com/sps014/FlowState
- Theme Documentation: https://just-the-docs.com/

