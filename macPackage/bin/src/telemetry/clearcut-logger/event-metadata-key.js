/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
// Defines valid event metadata keys for Clearcut logging.
export var EventMetadataKey;
(function (EventMetadataKey) {
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_KEY_UNKNOWN"] = 0] = "GEMINI_CLI_KEY_UNKNOWN";
    // ==========================================================================
    // Start Session Event Keys
    // ===========================================================================
    // Logs the model id used in the session.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_START_SESSION_MODEL"] = 1] = "GEMINI_CLI_START_SESSION_MODEL";
    // Logs the embedding model id used in the session.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_START_SESSION_EMBEDDING_MODEL"] = 2] = "GEMINI_CLI_START_SESSION_EMBEDDING_MODEL";
    // Logs the sandbox that was used in the session.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_START_SESSION_SANDBOX"] = 3] = "GEMINI_CLI_START_SESSION_SANDBOX";
    // Logs the core tools that were enabled in the session.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_START_SESSION_CORE_TOOLS"] = 4] = "GEMINI_CLI_START_SESSION_CORE_TOOLS";
    // Logs the approval mode that was used in the session.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_START_SESSION_APPROVAL_MODE"] = 5] = "GEMINI_CLI_START_SESSION_APPROVAL_MODE";
    // Logs whether an API key was used in the session.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_START_SESSION_API_KEY_ENABLED"] = 6] = "GEMINI_CLI_START_SESSION_API_KEY_ENABLED";
    // Logs whether the Vertex API was used in the session.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_START_SESSION_VERTEX_API_ENABLED"] = 7] = "GEMINI_CLI_START_SESSION_VERTEX_API_ENABLED";
    // Logs whether debug mode was enabled in the session.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_START_SESSION_DEBUG_MODE_ENABLED"] = 8] = "GEMINI_CLI_START_SESSION_DEBUG_MODE_ENABLED";
    // Logs the MCP servers that were enabled in the session.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_START_SESSION_MCP_SERVERS"] = 9] = "GEMINI_CLI_START_SESSION_MCP_SERVERS";
    // Logs whether user-collected telemetry was enabled in the session.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_START_SESSION_TELEMETRY_ENABLED"] = 10] = "GEMINI_CLI_START_SESSION_TELEMETRY_ENABLED";
    // Logs whether prompt collection was enabled for user-collected telemetry.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_START_SESSION_TELEMETRY_LOG_USER_PROMPTS_ENABLED"] = 11] = "GEMINI_CLI_START_SESSION_TELEMETRY_LOG_USER_PROMPTS_ENABLED";
    // Logs whether the session was configured to respect gitignore files.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_START_SESSION_RESPECT_GITIGNORE"] = 12] = "GEMINI_CLI_START_SESSION_RESPECT_GITIGNORE";
    // ==========================================================================
    // User Prompt Event Keys
    // ===========================================================================
    // Logs the length of the prompt.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_USER_PROMPT_LENGTH"] = 13] = "GEMINI_CLI_USER_PROMPT_LENGTH";
    // ==========================================================================
    // Tool Call Event Keys
    // ===========================================================================
    // Logs the function name.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_TOOL_CALL_NAME"] = 14] = "GEMINI_CLI_TOOL_CALL_NAME";
    // Logs the user's decision about how to handle the tool call.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_TOOL_CALL_DECISION"] = 15] = "GEMINI_CLI_TOOL_CALL_DECISION";
    // Logs whether the tool call succeeded.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_TOOL_CALL_SUCCESS"] = 16] = "GEMINI_CLI_TOOL_CALL_SUCCESS";
    // Logs the tool call duration in milliseconds.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_TOOL_CALL_DURATION_MS"] = 17] = "GEMINI_CLI_TOOL_CALL_DURATION_MS";
    // Logs the tool call error message, if any.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_TOOL_ERROR_MESSAGE"] = 18] = "GEMINI_CLI_TOOL_ERROR_MESSAGE";
    // Logs the tool call error type, if any.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_TOOL_CALL_ERROR_TYPE"] = 19] = "GEMINI_CLI_TOOL_CALL_ERROR_TYPE";
    // ==========================================================================
    // GenAI API Request Event Keys
    // ===========================================================================
    // Logs the model id of the request.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_API_REQUEST_MODEL"] = 20] = "GEMINI_CLI_API_REQUEST_MODEL";
    // ==========================================================================
    // GenAI API Response Event Keys
    // ===========================================================================
    // Logs the model id of the API call.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_API_RESPONSE_MODEL"] = 21] = "GEMINI_CLI_API_RESPONSE_MODEL";
    // Logs the status code of the response.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_API_RESPONSE_STATUS_CODE"] = 22] = "GEMINI_CLI_API_RESPONSE_STATUS_CODE";
    // Logs the duration of the API call in milliseconds.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_API_RESPONSE_DURATION_MS"] = 23] = "GEMINI_CLI_API_RESPONSE_DURATION_MS";
    // Logs the error message of the API call, if any.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_API_ERROR_MESSAGE"] = 24] = "GEMINI_CLI_API_ERROR_MESSAGE";
    // Logs the input token count of the API call.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_API_RESPONSE_INPUT_TOKEN_COUNT"] = 25] = "GEMINI_CLI_API_RESPONSE_INPUT_TOKEN_COUNT";
    // Logs the output token count of the API call.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_API_RESPONSE_OUTPUT_TOKEN_COUNT"] = 26] = "GEMINI_CLI_API_RESPONSE_OUTPUT_TOKEN_COUNT";
    // Logs the cached token count of the API call.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_API_RESPONSE_CACHED_TOKEN_COUNT"] = 27] = "GEMINI_CLI_API_RESPONSE_CACHED_TOKEN_COUNT";
    // Logs the thinking token count of the API call.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_API_RESPONSE_THINKING_TOKEN_COUNT"] = 28] = "GEMINI_CLI_API_RESPONSE_THINKING_TOKEN_COUNT";
    // Logs the tool use token count of the API call.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_API_RESPONSE_TOOL_TOKEN_COUNT"] = 29] = "GEMINI_CLI_API_RESPONSE_TOOL_TOKEN_COUNT";
    // ==========================================================================
    // GenAI API Error Event Keys
    // ===========================================================================
    // Logs the model id of the API call.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_API_ERROR_MODEL"] = 30] = "GEMINI_CLI_API_ERROR_MODEL";
    // Logs the error type.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_API_ERROR_TYPE"] = 31] = "GEMINI_CLI_API_ERROR_TYPE";
    // Logs the status code of the error response.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_API_ERROR_STATUS_CODE"] = 32] = "GEMINI_CLI_API_ERROR_STATUS_CODE";
    // Logs the duration of the API call in milliseconds.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_API_ERROR_DURATION_MS"] = 33] = "GEMINI_CLI_API_ERROR_DURATION_MS";
    // ==========================================================================
    // End Session Event Keys
    // ===========================================================================
    // Logs the end of a session.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_END_SESSION_ID"] = 34] = "GEMINI_CLI_END_SESSION_ID";
    // ==========================================================================
    // Shared Keys
    // ===========================================================================
    // Logs the Prompt Id
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_PROMPT_ID"] = 35] = "GEMINI_CLI_PROMPT_ID";
    // Logs the Auth type for the prompt, api responses and errors.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_AUTH_TYPE"] = 36] = "GEMINI_CLI_AUTH_TYPE";
    // Logs the total number of Google accounts ever used.
    EventMetadataKey[EventMetadataKey["GEMINI_CLI_GOOGLE_ACCOUNTS_COUNT"] = 37] = "GEMINI_CLI_GOOGLE_ACCOUNTS_COUNT";
})(EventMetadataKey || (EventMetadataKey = {}));
export function getEventMetadataKey(keyName) {
    // Access the enum member by its string name
    const key = EventMetadataKey[keyName];
    // Check if the result is a valid enum member (not undefined and is a number)
    if (typeof key === 'number') {
        return key;
    }
    return undefined;
}
//# sourceMappingURL=event-metadata-key.js.map