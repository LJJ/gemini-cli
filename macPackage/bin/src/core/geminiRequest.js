/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export function partListUnionToString(value) {
    if (typeof value === 'string') {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(partListUnionToString).join('');
    }
    // Cast to Part, assuming it might contain project-specific fields
    const part = value;
    if (part.videoMetadata !== undefined) {
        return `[Video Metadata]`;
    }
    if (part.thought !== undefined) {
        return `[Thought: ${part.thought}]`;
    }
    if (part.codeExecutionResult !== undefined) {
        return `[Code Execution Result]`;
    }
    if (part.executableCode !== undefined) {
        return `[Executable Code]`;
    }
    // Standard Part fields
    if (part.fileData !== undefined) {
        return `[File Data]`;
    }
    if (part.functionCall !== undefined) {
        return `[Function Call: ${part.functionCall.name}]`;
    }
    if (part.functionResponse !== undefined) {
        return `[Function Response: ${part.functionResponse.name}]`;
    }
    if (part.inlineData !== undefined) {
        return `<${part.inlineData.mimeType}>`;
    }
    if (part.text !== undefined) {
        return part.text;
    }
    return '';
}
//# sourceMappingURL=geminiRequest.js.map