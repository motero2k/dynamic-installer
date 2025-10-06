// Requires Node.js >= 18.0.0
import { exec } from 'child_process';

/**
 * Interface for dependency configuration
 */
export interface Dependency {
    name: string;
    options?: string[]; // changed to array of option tokens
    override?: boolean;
}

/**
 * Interface for installation options
 */
export interface InstallOptions {
    globalOptions?: string[];
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
    logsArray: string[];
}

/**
 * Interface for command execution result
 */
interface CommandResult {
    success: boolean;
    message: string;
    logs: string;
}

// Regex for allowed package names: only @, letters, numbers, -, _, ., /
const PACKAGE_NAME_REGEX = /^[@a-zA-Z0-9._/-]+$/;

// Regex for allowed option tokens
const SHORT_FLAG_REGEX = /^-[A-Za-z]+$/;
const LONG_FLAG_REGEX = /^--[a-z]+(?:-[a-z]+)*$/;

// Disallowed shell metacharacters
const DISALLOWED_CHARS_REGEX = /[;&|$`<>\\*?\(\)\{\}\[\]~]/;

/**
 * Simple logger: appends message to logs array and optionally prints to console.
 */
function logMessage(message: string, verbose: boolean, logs: string[]): void {
    logs.push(message);
    if (verbose) {
        console.log(message);
    }
}

/**
 * Validates a dependency name to prevent command injection.
 */
function isValidDependencyName(name: string): boolean {
    return PACKAGE_NAME_REGEX.test(name);
}

/**
 * Validates option tokens strictly by regex.
 * Returns array of valid tokens or null if any token is invalid.
 */
function validateOptionTokens(tokens: string[]): string[] | null {
    for (const token of tokens) {
        if (
            !(
                SHORT_FLAG_REGEX.test(token) ||
                LONG_FLAG_REGEX.test(token)
            ) ||
            DISALLOWED_CHARS_REGEX.test(token)
        ) {
            return null;
        }
    }
    return tokens;
}

/**
 * Parses and validates options which may be provided as an array of tokens
 * or as a space-separated string. Returns validated tokens or null if invalid.
 */
function parseAndValidateOptions(options?: string | string[]): string[] | null {
    if (!options) return [];
    if (Array.isArray(options)) {
        return validateOptionTokens(options);
    }
    const tokens = options.split(/\s+/).filter(Boolean);
    return validateOptionTokens(tokens);
}

/**
 * Executes a shell command and returns a promise with the success status and message.
 */
function executeCommand(command: string, verbose: boolean, logs: string[]): Promise<CommandResult> {
    return new Promise((resolve) => {
        exec(command, (error, stdout, stderr) => {
            logMessage(`command: ${command}`, verbose, logs);

            const success = !error;
            const message = error ? error.message : (stdout || stderr);

            logMessage(`stdout: ${stdout}`, verbose, logs);
            logMessage(`stderr: ${stderr}`, verbose, logs);
            logMessage(`error: ${error ? error.message : 'none'}`, verbose, logs);
            logMessage(`success: ${success}, message: ${message}`, verbose, logs);

            resolve({ success, message, logs: logs.join('\n') });
        });
    });
}

/**
 * Installs a list of npm dependencies with specified global and individual options.
 */
export async function installDependencies(options: InstallOptions): Promise<InstallationResult> {
    const { dependencies, globalOptions = [], verbose = true } = options;
    const logs: string[] = [];
    const results: InstallResult[] = [];

    for (const dep of dependencies) {
        const { name, override = false } = dep;
        // dep.options is now string[] | undefined
        // pass directly to parser which accepts array or string
        const depOptionsVal = dep.options;

        // Validate dependency name
        if (!isValidDependencyName(name)) {
            const errorMessage = `Invalid dependency name: ${name}`;
            logMessage(errorMessage, verbose, logs);
            results.push({ name, success: false, message: errorMessage });
            continue;
        }

        // Validate global options
        // IMPORTANT: don't coerce null -> [] here; if validation fails we must get `null`
        // so the later error branch can detect invalid global options.
        const validGlobalOptions = globalOptions ? validateOptionTokens(globalOptions) : [];

        // Validate dependency options
        const validDepOptions = parseAndValidateOptions(depOptionsVal);

        if (
            (override && validDepOptions === null) ||
            (!override && (validGlobalOptions === null || validDepOptions === null))
        ) {
            const errorMessage = `Invalid options for dependency: ${name}`;
            logMessage(errorMessage, verbose, logs);
            results.push({ name, success: false, message: errorMessage });
            continue;
        }

        // Build final options
        const finalOptions = override
            ? validDepOptions!
            : [...(validGlobalOptions ?? []), ...validDepOptions!];

        // Build command
        const depCommand = ['npm install', name, ...finalOptions].join(' ').trim();

        // Run command and capture result
        const result = await executeCommand(depCommand, verbose, logs);
        results.push({ name, success: result.success, message: result.message });
    }

    const overallSuccess = results.every(result => result.success);

    return {
        success: overallSuccess,
        details: results,
        logs: logs.join('\n'),
        logsArray: logs
    };
}
