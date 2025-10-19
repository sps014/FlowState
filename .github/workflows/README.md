# GitHub Actions Workflows

## Publish to NuGet

### Setup Instructions

1. **Create a NuGet API Key**
   - Go to https://www.nuget.org/account/apikeys
   - Create a new API key with "Push" permissions
   - Copy the generated key

2. **Add the API Key to GitHub Secrets**
   - Go to your repository on GitHub
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NUGET_API_KEY`
   - Value: Paste your NuGet API key
   - Click "Add secret"

3. **Update Package Metadata**
   - Edit `src/FlowState/FlowState.csproj`
   - Update these fields:
     - `<Authors>` - Your name
     - `<Company>` - Your company name
     - `<PackageProjectUrl>` - Your GitHub repository URL
     - `<RepositoryUrl>` - Your GitHub repository URL

### How to Publish

1. Go to the "Actions" tab in your GitHub repository
2. Click on "Publish to NuGet" workflow
3. Click "Run workflow" button
4. Enter the version number (e.g., `1.0.0`)
5. Click "Run workflow"

The workflow will:
- Build the project
- Create a NuGet package with the specified version
- Publish it to NuGet.org
- Upload the package as an artifact for download

### Version Guidelines

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version: Breaking changes (e.g., 2.0.0)
- **MINOR** version: New features, backwards compatible (e.g., 1.1.0)
- **PATCH** version: Bug fixes, backwards compatible (e.g., 1.0.1)

