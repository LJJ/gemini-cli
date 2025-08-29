/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType } from '../core/contentGenerator.js';
import { getOauthClient } from './oauth2.js';
import { setupUser } from './setup.js';
import { CodeAssistServer } from './server.js';
export async function createCodeAssistContentGenerator(httpOptions, authType, config, sessionId) {
    if (authType === AuthType.LOGIN_WITH_GOOGLE ||
        authType === AuthType.CLOUD_SHELL) {
        const authClient = await getOauthClient(authType, config);
        const projectId = await setupUser(authClient);
        return new CodeAssistServer(authClient, projectId, httpOptions, sessionId);
    }
    throw new Error(`Unsupported authType: ${authType}`);
}
//# sourceMappingURL=codeAssist.js.map