import { exec } from 'child_process';

/**
 * Logs a message to a string and optionally to the console.
 * 
 * @param {string} message - The message to log.
 * @param {boolean} verbose - Whether to also log the message to the console.
 * @param {string} logs - The string to store log messages.
 * @returns {string} - The updated log string.
 */
function logMessage(message, verbose, logs) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - [dynamic-installer]: ${message}\n`;
    logs += logEntry;
    if (verbose) {
        console.log(logEntry);
    }
    return logs;
}

/**
 * Executes a shell command and returns a promise with the success status and message.
 * 
 * @param {string} command - The command to execute in the shell.
 * @param {boolean} verbose - Whether to log messages to the console.
 * @param {string} logs - The string to store log messages.
 * @returns {Promise<{success: boolean, message: string, logs: string}>} - A promise that resolves to an object containing the success status, the command output or error message, and the updated log string.
 */
function executeCommand(command, verbose, logs) {
    return new Promise((resolve) => {
        exec(command, (error, stdout, stderr) => {
            logs = logMessage(`command: ${command}`, verbose, logs);
            let success = !error;
            let message = stdout || stderr || error.message;

            if (stderr && stderr.toLowerCase().includes('err!')) {
                success = false;
            } else if (stderr && !stderr.toLowerCase().includes('warn')) {
                success = false;
            }

            logs = logMessage(`stdout: ${stdout}`, verbose, logs);
            logs = logMessage(`stderr: ${stderr}`, verbose, logs);
            logs = logMessage(`error: ${error}`, verbose, logs);
            logs = logMessage(`success: ${success}, message: ${message}`, verbose, logs);

            resolve({ success, message, logs });
        });
    });
}

/**
 * Installs a list of npm dependencies with specified global and individual options.
 * 
 * @param {Object} options - The configuration options for the installation process.
 * @param {string} options.globalOptions - Global options to apply to all dependencies unless overridden.
 * @param {Array<{name: string, options?: string, override?: boolean}>} options.dependencies - An array of dependencies, each with a name, optional specific options, and an override flag.
 * @returns {Promise<{success: boolean, details: Array<{name: string, success: boolean, message: string}>, logs: string}>} - A promise that resolves to an object with the overall success status, details for each dependency installation, and the updated log string.
 */
export async function installDependencies(options) {
    const { dependencies, globalOptions } = options;
    const commandBase = 'npm install';
    let logs = '';
    const results = [];

    // Process each dependency
    for (const dep of dependencies) {
        const { name, override = true } = dep;
        const specificOptions = dep.options || '';

        // Determine final options based on override flag
        const finalOptions = override ? specificOptions : `${globalOptions} ${specificOptions}`;
        const depCommand = `${commandBase} ${name} ${finalOptions}`.trim();

        // Run command and capture result
        const result = await executeCommand(depCommand, true, logs);
        logs = result.logs;
        results.push({ name, success: result.success, message: result.message });
    }

    // Determine overall success status
    const overallSuccess = results.every(result => result.success);

    // Return detailed results
    return {
        success: overallSuccess,
        details: results,
        logs: logs
    };
}
