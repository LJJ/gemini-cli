/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Base implementation for tools with common functionality
 */
export class BaseTool {
    name;
    displayName;
    description;
    parameterSchema;
    isOutputMarkdown;
    canUpdateOutput;
    /**
     * Creates a new instance of BaseTool
     * @param name Internal name of the tool (used for API calls)
     * @param displayName User-friendly display name of the tool
     * @param description Description of what the tool does
     * @param isOutputMarkdown Whether the tool's output should be rendered as markdown
     * @param canUpdateOutput Whether the tool supports live (streaming) output
     * @param parameterSchema JSON Schema defining the parameters
     */
    constructor(name, displayName, description, parameterSchema, isOutputMarkdown = true, canUpdateOutput = false) {
        this.name = name;
        this.displayName = displayName;
        this.description = description;
        this.parameterSchema = parameterSchema;
        this.isOutputMarkdown = isOutputMarkdown;
        this.canUpdateOutput = canUpdateOutput;
    }
    /**
     * Function declaration schema computed from name, description, and parameterSchema
     */
    get schema() {
        return {
            name: this.name,
            description: this.description,
            parameters: this.parameterSchema,
        };
    }
    /**
     * Validates the parameters for the tool
     * This is a placeholder implementation and should be overridden
     * Should be called from both `shouldConfirmExecute` and `execute`
     * `shouldConfirmExecute` should return false immediately if invalid
     * @param params Parameters to validate
     * @returns An error message string if invalid, null otherwise
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    validateToolParams(params) {
        // Implementation would typically use a JSON Schema validator
        // This is a placeholder that should be implemented by derived classes
        return null;
    }
    /**
     * Gets a pre-execution description of the tool operation
     * Default implementation that should be overridden by derived classes
     * @param params Parameters for the tool execution
     * @returns A markdown string describing what the tool will do
     */
    getDescription(params) {
        return JSON.stringify(params);
    }
    /**
     * Determines if the tool should prompt for confirmation before execution
     * @param params Parameters for the tool execution
     * @returns Whether or not execute should be confirmed by the user.
     */
    shouldConfirmExecute(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortSignal) {
        return Promise.resolve(false);
    }
}
export var ToolConfirmationOutcome;
(function (ToolConfirmationOutcome) {
    ToolConfirmationOutcome["ProceedOnce"] = "proceed_once";
    ToolConfirmationOutcome["ProceedAlways"] = "proceed_always";
    ToolConfirmationOutcome["ProceedAlwaysServer"] = "proceed_always_server";
    ToolConfirmationOutcome["ProceedAlwaysTool"] = "proceed_always_tool";
    ToolConfirmationOutcome["ModifyWithEditor"] = "modify_with_editor";
    ToolConfirmationOutcome["Cancel"] = "cancel";
})(ToolConfirmationOutcome || (ToolConfirmationOutcome = {}));
//# sourceMappingURL=tools.js.map