/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseTool } from './tools.js';
import { Type } from '@google/genai';
import { SchemaValidator } from '../utils/schemaValidator.js';
import { getErrorMessage } from '../utils/errors.js';
import { getResponseText } from '../utils/generateContentResponseUtilities.js';
/**
 * A tool to perform web searches using Google Search via the Gemini API.
 */
export class WebSearchTool extends BaseTool {
    config;
    static Name = 'google_web_search';
    constructor(config) {
        super(WebSearchTool.Name, 'GoogleSearch', 'Performs a web search using Google Search (via the Gemini API) and returns the results. This tool is useful for finding information on the internet based on a query.', {
            type: Type.OBJECT,
            properties: {
                query: {
                    type: Type.STRING,
                    description: 'The search query to find information on the web.',
                },
            },
            required: ['query'],
        });
        this.config = config;
    }
    /**
     * Validates the parameters for the WebSearchTool.
     * @param params The parameters to validate
     * @returns An error message string if validation fails, null if valid
     */
    validateParams(params) {
        const errors = SchemaValidator.validate(this.schema.parameters, params);
        if (errors) {
            return errors;
        }
        if (!params.query || params.query.trim() === '') {
            return "The 'query' parameter cannot be empty.";
        }
        return null;
    }
    getDescription(params) {
        return `Searching the web for: "${params.query}"`;
    }
    async execute(params, signal) {
        const validationError = this.validateToolParams(params);
        if (validationError) {
            return {
                llmContent: `Error: Invalid parameters provided. Reason: ${validationError}`,
                returnDisplay: validationError,
            };
        }
        const geminiClient = this.config.getGeminiClient();
        try {
            const response = await geminiClient.generateContent([{ role: 'user', parts: [{ text: params.query }] }], { tools: [{ googleSearch: {} }] }, signal);
            const responseText = getResponseText(response);
            const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
            const sources = groundingMetadata?.groundingChunks;
            const groundingSupports = groundingMetadata?.groundingSupports;
            if (!responseText || !responseText.trim()) {
                return {
                    llmContent: `No search results or information found for query: "${params.query}"`,
                    returnDisplay: 'No information found.',
                };
            }
            let modifiedResponseText = responseText;
            const sourceListFormatted = [];
            if (sources && sources.length > 0) {
                sources.forEach((source, index) => {
                    const title = source.web?.title || 'Untitled';
                    const uri = source.web?.uri || 'No URI';
                    sourceListFormatted.push(`[${index + 1}] ${title} (${uri})`);
                });
                if (groundingSupports && groundingSupports.length > 0) {
                    const insertions = [];
                    groundingSupports.forEach((support) => {
                        if (support.segment && support.groundingChunkIndices) {
                            const citationMarker = support.groundingChunkIndices
                                .map((chunkIndex) => `[${chunkIndex + 1}]`)
                                .join('');
                            insertions.push({
                                index: support.segment.endIndex,
                                marker: citationMarker,
                            });
                        }
                    });
                    // Sort insertions by index in descending order to avoid shifting subsequent indices
                    insertions.sort((a, b) => b.index - a.index);
                    const responseChars = modifiedResponseText.split(''); // Use new variable
                    insertions.forEach((insertion) => {
                        // Fixed arrow function syntax
                        responseChars.splice(insertion.index, 0, insertion.marker);
                    });
                    modifiedResponseText = responseChars.join(''); // Assign back to modifiedResponseText
                }
                if (sourceListFormatted.length > 0) {
                    modifiedResponseText +=
                        '\n\nSources:\n' + sourceListFormatted.join('\n'); // Fixed string concatenation
                }
            }
            return {
                llmContent: `Web search results for "${params.query}":\n\n${modifiedResponseText}`,
                returnDisplay: `Search results for "${params.query}" returned.`,
                sources,
            };
        }
        catch (error) {
            const errorMessage = `Error during web search for query "${params.query}": ${getErrorMessage(error)}`;
            console.error(errorMessage, error);
            return {
                llmContent: `Error: ${errorMessage}`,
                returnDisplay: `Error performing web search.`,
            };
        }
    }
}
//# sourceMappingURL=web-search.js.map