// index.js

import { exec } from 'child_process';

/**
 * Executes a shell command and returns a promise with the success status and message.
 * 
 * @param {string} command - The command to execute in the shell.
 * @returns {Promise<{success: boolean, message: string}>} - A promise that resolves to an object containing the success status and the command output or error message.
 */
function executeCommand(command) {
    return new Promise((resolve) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                resolve({ success: false, message: error.message });
            } else if (stderr) {
                resolve({ success: false, message: stderr });
            } else {
                resolve({ success: true, message: stdout });
            }
        });
    });
}

/**
 * Installs a list of npm dependencies with specified global and individual options.
 * 
 * @param {Object} options - The configuration options for the installation process.
 * @param {string} options.globalOptions - Global options to apply to all dependencies unless overridden.
 * @param {Array<{name: string, options?: string, override?: boolean}>} options.dependencies - An array of dependencies, each with a name, optional specific options, and an override flag.
 * @returns {Promise<{success: boolean, details: Array<{name: string, success: boolean, message: string}>}>} - A promise that resolves to an object with the overall success status and details for each dependency installation.
 */
export async function installDependencies(options) {
    const { dependencies, globalOptions } = options;
    const commandBase = 'npm install';
    const results = [];

    // Process each dependency
    for (const dep of dependencies) {
        const { name, override = true } = dep;
        const specificOptions = dep.options || '';
        
        // Determine final options based on override flag
        const finalOptions = override ? specificOptions : `${globalOptions} ${specificOptions}`;
        const depCommand = `${commandBase} ${name} ${finalOptions}`.trim();

        // Run command and capture result
        const result = await executeCommand(depCommand);
        results.push({ name, ...result });
    }

    // Determine overall success status
    const overallSuccess = results.every(result => result.success);

    // Return detailed results
    return {
        success: overallSuccess,
        details: results,
    };
}
