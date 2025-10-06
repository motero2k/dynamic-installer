import { exec } from 'child_process';

/**
 * Interface for dependency configuration
 */
export interface Dependency {
    name: string;
    options?: string;
    override?: boolean;
}

/**
 * Interface for installation options
 */
export interface InstallOptions {
    globalOptions?: string;
    dependencies: Dependency[];
    verbose?: boolean;
}

/**
 * Interface for individual installation result
 */
export interface InstallResult {
    name: string;
    success: boolean;
    message: string;
}

/**
 * Interface for overall installation result
 */
export interface InstallationResult {
    success: boolean;
    details: InstallResult[];
    logs: string;
}

/**
 * Interface for command execution result
 */
interface CommandResult {
    success: boolean;
    message: string;
    logs: string;
}

/**
 * Logs a message to a string and optionally to the console.
 * 
 * @param message - The message to log.
 * @param verbose - Whether to also log the message to the console.
 * @param logs - The string to store log messages.
 * @returns The updated log string.
 */
function logMessage(message: string, verbose: boolean, logs: string): string {
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
 * @param command - The command to execute in the shell.
 * @param verbose - Whether to log messages to the console.
 * @param logs - The string to store log messages.
 * @returns A promise that resolves to an object containing the success status, the command output or error message, and the updated log string.
 */
function executeCommand(command: string, verbose: boolean, logs: string): Promise<CommandResult> {
    return new Promise((resolve) => {
        exec(command, (error, stdout, stderr) => {
            logs = logMessage(`command: ${command}`, verbose, logs);
            
            // Rely primarily on error object from Node.js for error detection
            const success = !error;
            const message = error ? error.message : (stdout || stderr);

            logs = logMessage(`stdout: ${stdout}`, verbose, logs);
            logs = logMessage(`stderr: ${stderr}`, verbose, logs);
            logs = logMessage(`error: ${error}`, verbose, logs);
            logs = logMessage(`success: ${success}, message: ${message}`, verbose, logs);

            resolve({ success, message, logs });
        });
    });
}

/**
 * Validates and sanitizes a dependency name to prevent command injection.
 * 
 * @param name - The dependency name to validate.
 * @returns True if the name is valid, false otherwise.
 */
function isValidDependencyName(name: string): boolean {
    // Allow alphanumeric, hyphens, underscores, dots, slashes (for scoped packages), and @
    const validNamePattern = /^[@a-zA-Z0-9._/-]+$/;
    return validNamePattern.test(name);
}

/**
 * Installs a list of npm dependencies with specified global and individual options.
 * 
 * @param options - The configuration options for the installation process.
 * @returns A promise that resolves to an object with the overall success status, details for each dependency installation, and the updated log string.
 */
export async function installDependencies(options: InstallOptions): Promise<InstallationResult> {
    const { dependencies, globalOptions = '', verbose = true } = options;
    const commandBase = 'npm install';
    let logs = '';
    const results: InstallResult[] = [];

    // Process each dependency
    for (const dep of dependencies) {
        const { name, override = false } = dep;
        const specificOptions = dep.options || '';

        // Validate dependency name to prevent command injection
        if (!isValidDependencyName(name)) {
            const errorMessage = `Invalid dependency name: ${name}`;
            logs = logMessage(errorMessage, verbose, logs);
            results.push({ name, success: false, message: errorMessage });
            continue;
        }

        // Determine final options based on override flag
        const finalOptions = override ? specificOptions : `${globalOptions} ${specificOptions}`.trim();
        const depCommand = `${commandBase} ${name} ${finalOptions}`.trim();

        // Run command and capture result
        const result = await executeCommand(depCommand, verbose, logs);
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
