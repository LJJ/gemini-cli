# Packaging Notes for GeminiForMac Application

This document outlines the custom modifications made to the `gemini-cli` codebase to facilitate the packaging of the `GeminiForMac` native macOS application. These changes are essential for bundling the Node.js backend (server and CLI) into standalone executables that can run outside the macOS App Sandbox.

## Summary of Changes

To bypass the macOS App Sandbox limitations, which would otherwise prevent the CLI from accessing the file system or running shell commands, we package the Node.js server and CLI into native executables. These executables are then copied to a location outside the app's bundle (`~/Library/Application Support/GeminiForMac/`) and executed from there.

The primary tool used for this is `pkg`.

## Modifications to `package.json` files

We have made specific, non-standard additions to the `package.json` files in the `packages/core` and `packages/cli` directories. **These changes may conflict with future updates from the upstream `gemini-cli` repository.** When pulling updates, please ensure these modifications are preserved.

### 1. `packages/core/package.json`

*   **Added `pkg` to `devDependencies`:**
    ```json
    "devDependencies": {
      ...,
      "pkg": "^5.8.1"
    }
    ```
    This adds the `pkg` tool, which is necessary for the packaging process.

*   **Added a `package` script:**
    ```json
    "scripts": {
      ...,
      "package": "pkg dist/src/server.js --output ../../bin/gemini-cli-server --targets node20-macos-arm64"
    }
    ```
    This script bundles the core server logic into a single executable named `gemini-cli-server` for ARM64-based Macs (Apple Silicon) and places it in the root `/bin` directory.

### 2. `packages/cli/package.json`

*   **Added `pkg` to `devDependencies`:**
    *Similar to the `core` package, `pkg` is added for packaging.*

*   **Added a `package` script:**
    ```json
    "scripts": {
      ...,
      "package": "pkg dist/index.js --output ../../bin/gemini-cli --targets node20-macos-arm64"
    }
    ```
    This script bundles the command-line interface into a single executable named `gemini-cli` and places it in the root `/bin` directory.

---

**Reasoning:** These modifications allow us to run `npm run package` within each respective package directory to generate the necessary standalone binaries for the `GeminiForMac` application.
