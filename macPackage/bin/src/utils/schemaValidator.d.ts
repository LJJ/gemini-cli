/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Schema } from '@google/genai';
/**
 * Simple utility to validate objects against JSON Schemas
 */
export declare class SchemaValidator {
    /**
     * Returns null if the data confroms to the schema described by schema (or if schema
     *  is null). Otherwise, returns a string describing the error.
     */
    static validate(schema: Schema | undefined, data: unknown): string | null;
    /**
     * Converts @google/genai's Schema to an object compatible with avj.
     * This is necessry because it represents Types as an Enum (with
     * UPPERCASE values) and minItems and minLength as strings, when they should be numbers.
     */
    private static toObjectSchema;
}
