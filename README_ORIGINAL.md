# GeminiForMac

GeminiForMac is a macOS desktop client based on [gemini-cli](./README_ORIGINAL.md), providing a user-friendly graphical interface for interacting with Google Gemini AI.

## Features
![client-Code](./docs/assets/client_code_review.png)

- **Intuitive GUI**: Modern native macOS interface design
- **File Management**: Built-in file browser for easy project file management
- **Proxy Support**: Built-in proxy settings with network proxy configuration
- **Project Management**: Support for switching and managing multiple projects

## Interface Overview
![client-Mian](./docs/assets/client_main.png)

<<<<<<< HEAD
The application includes the following main interfaces:
- **Chat Interface**: Main conversation interaction area with Markdown rendering support
- **File Explorer**: Left sidebar file tree for browsing and selecting project files
- **Settings Panel**: Proxy settings, project configuration, etc.
- **Login Interface**: Support for Google account login and API Key configuration
=======
- Query and edit large codebases in and beyond Gemini's 1M token context window.
- Generate new apps from PDFs or sketches, using Gemini's multimodal capabilities.
- Automate operational tasks, like querying pull requests or handling complex rebases.
- Integrate with GitHub: Use the [Gemini CLI GitHub Action](https://github.com/google-github-actions/run-gemini-cli) for automated PR reviews, issue triage, and on-demand AI assistance directly in your repositories.
- Use tools and MCP servers to connect new capabilities, including [media generation with Imagen,
  Veo or Lyria](https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/mcp-genmedia)
- Ground your queries with the [Google Search](https://ai.google.dev/gemini-api/docs/grounding)
  tool, built into Gemini.
>>>>>>> origin/main

## Installation and Usage

### System Requirements

- macOS 14.0 or higher
- Network connection (for AI services)

### Installation Steps

1. Download and install the PKG installer
2. Double-click the PKG file to install
3. Launch the GeminiForMac application
4. Server will start automatically (handled by postinstall script)
5. Follow the interface prompts to complete login and configuration

### Proxy Settings

If you need to use a proxy to access the network:

1. Open "Proxy Settings" in the application
2. Configure proxy server address and port
3. Save settings and restart the service

The system will automatically detect `http://127.0.0.1:7890` proxy by default.

## Development and Packaging

### Building the Application

```bash
# Navigate to the iOS/macOS project directory
cd GeminiForMac

# Build using Xcode
xcodebuild build -project GeminiForMac.xcodeproj -scheme GeminiForMac -configuration Release
```

### Creating Installer Package

```bash
# Run the packaging script
./macPackage/scripts/package-macos-pkg.sh
```

After packaging is complete, the PKG file will be generated in the `macPackage/dist/` directory.

### Viewing Logs

Application logs are stored in the following locations:

- **Application Logs**: `~/Library/Logs/GeminiForMac/`
- **Server Logs**: `~/Library/Logs/GeminiForMac/gemini-server.log`
- **Error Logs**: `~/Library/Logs/GeminiForMac/gemini-server-error.log`

```bash
# View real-time logs
tail -f ~/Library/Logs/GeminiForMac/gemini-server.log

# View error logs
tail -f ~/Library/Logs/GeminiForMac/gemini-server-error.log
```

### Restarting the Server

```bash
# Stop service
launchctl unload ~/Library/LaunchAgents/com.gemini.cli.server.plist

# Start service
launchctl load ~/Library/LaunchAgents/com.gemini.cli.server.plist

# Check service status
launchctl list | grep com.gemini.cli.server

# Verify service port
curl http://localhost:18080/health
```

## Uninstallation

### Complete Uninstallation Steps

1. **Stop background service**:
   ```bash
   launchctl unload ~/Library/LaunchAgents/com.gemini.cli.server.plist
   ```

2. **Delete application**:
   ```bash
   rm -rf /Applications/GeminiForMac.app
   ```

3. **Clean user data**:
   ```bash
   # Delete server files
   rm -rf ~/.gemini-server
   
   # Delete Launch Agent configuration
   rm -f ~/Library/LaunchAgents/com.gemini.cli.server.plist
   
   # Delete log files
   rm -rf ~/Library/Logs/GeminiForMac
   ```

<<<<<<< HEAD
4. **Clean configuration files** (optional):
=======
### With Homebrew

1. **Prerequisites:** Ensure you have [Homebrew](https://brew.sh/) installed.
2. **Install the CLI:** Execute the following command in your terminal:

>>>>>>> origin/main
   ```bash
   # Delete application configuration (if complete cleanup needed)
   rm -rf ~/Library/Preferences/com.gemini.cli.*
   rm -rf ~/Library/Application\ Support/GeminiForMac
   ```

## System Architecture

### Overall Architecture

```
┌─────────────────┐    HTTP/WebSocket     ┌─────────────────┐
│                 │ ──────────────────→   │                 │
│  macOS Client   │                       │ Background      │
│  (SwiftUI)      │ ←────────────────── │ Server (Node.js)│
│                 │                       │                 │
└─────────────────┘                       └─────────────────┘
         │                                         │
         │                                         │
    ┌────▼────┐                               ┌────▼────┐
    │ Local UI│                               │ Gemini  │
    │Components│                              │  API    │
    └─────────┘                               └─────────┘
```

### Core Components

#### 1. macOS Client (`GeminiForMac/`)

Native macOS application built with SwiftUI:

- **Main Modules**:
  - `MainView.swift`: Main interface container
  - `Modules/Input/`: Input components with dynamic height adjustment
  - `Modules/FileExplorer/`: File browser
  - `Modules/Login/`: Login and authentication
  - `Modules/Proxy/`: Proxy settings
  - `Services/`: Network services and data management

#### 2. Background Server (`packages/core/src/server/`)

Node.js background service providing API endpoints:

<<<<<<< HEAD
- **Core Services**:
  - `core/GeminiService.ts`: Gemini API integration
  - `auth/AuthService.ts`: Authentication management
  - `chat/ChatHandler.ts`: Chat processing
  - `files/FileService.ts`: File operations
  - `project/ProjectService.ts`: Project management
  - `utils/ProxyConfigManager.ts`: Proxy configuration
=======
## GitHub Integration

Integrate Gemini CLI directly into your GitHub workflows with the [**Gemini CLI GitHub Action**](https://github.com/google-github-actions/run-gemini-cli). Key features include:

- **Pull Request Reviews**: Automatically review pull requests when they're opened.
- **Issue Triage**: Automatically triage and label GitHub issues.
- **On-demand Collaboration**: Mention `@gemini-cli` in issues and pull requests for assistance and task delegation.
- **Custom Workflows**: Set up your own scheduled tasks and event-driven automations.

## Popular tasks
>>>>>>> origin/main

#### 3. Communication Protocol

- **HTTP API**: Standard REST interfaces for basic operations
- **WebSocket**: For real-time chat and streaming responses
- **Port**: Uses port `18080` by default

#### 4. Data Flow

1. User inputs message in macOS client
2. Client sends to background server via HTTP/WebSocket
3. Server calls Gemini API to process request
4. Response streams back to client via WebSocket
5. Client renders response content in real-time

<<<<<<< HEAD
### Configuration Management
=======
```text
> Provide a step-by-step dev onboarding doc for developers new to the codebase.
```

```text
> Summarize this codebase and highlight the most interesting patterns or techniques I could learn from.
```

```text
> Identify potential areas for improvement or refactoring in this codebase, highlighting parts that appear fragile, complex, or hard to maintain.
```

```text
> Which parts of this codebase might be challenging to scale or debug?
```

```text
> Generate a README section for the [module name] module explaining what it does and how to use it.
```

```text
> What kind of error handling and logging strategies does the project use?
```

```text
> Which tools, libraries, and dependencies are used in this project?
```

### Work with your existing code
>>>>>>> origin/main

- **Server Configuration**: `~/.gemini-server/` directory
- **Launch Agent**: `~/Library/LaunchAgents/com.gemini.cli.server.plist`
- **Proxy Configuration**: Auto-detection or manual configuration

## Troubleshooting

### Common Issues

1. **Server fails to start**:
   - Check if port 18080 is occupied
   - View error logs: `~/Library/Logs/GeminiForMac/gemini-server-error.log`

2. **Cannot connect to Gemini API**:
   - Check network connection
   - Verify proxy settings are correct
   - Validate API Key or login status

3. **Interface anomalies**:
   - Restart the application
   - Check macOS version compatibility

### Getting Help

- View original project documentation: [README_ORIGINAL.md](./README_ORIGINAL.md)
- Check log files for detailed error information
- Restart server service

## License

<<<<<<< HEAD
This project is based on the original gemini-cli project. Please refer to the relevant license terms.
=======
### Uninstall

Head over to the [Uninstall](docs/Uninstall.md) guide for uninstallation instructions.

## Terms of Service and Privacy Notice

For details on the terms of service and privacy notice applicable to your use of Gemini CLI, see the [Terms of Service and Privacy Notice](./docs/tos-privacy.md).

## Security Disclosures

Please see our [security disclosure process](SECURITY.md). All [security advisories](https://github.com/google-gemini/gemini-cli/security/advisories) are managed on Github.
>>>>>>> origin/main
