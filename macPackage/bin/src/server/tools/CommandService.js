/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { ResponseFactory } from '../utils/responseFactory.js';
const execAsync = promisify(exec);
export class CommandService {
    async executeCommand(req, res) {
        try {
            const { command, cwd } = req.body;
            if (!command) {
                return res.status(400).json(ResponseFactory.validationError('command', 'Command is required'));
            }
            const options = {};
            if (cwd) {
                options.cwd = cwd;
            }
            const { stdout, stderr } = await execAsync(command, options);
            res.json(ResponseFactory.executeCommand(command, stdout.toString(), stderr?.toString() || null, 0));
        }
        catch (error) {
            res.json(ResponseFactory.executeCommand(req.body.command, error.stdout?.toString() || '', error.stderr?.toString() || error.message, error.code || -1));
        }
    }
}
//# sourceMappingURL=CommandService.js.map