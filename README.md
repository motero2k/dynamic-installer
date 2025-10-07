# Dynamic Installer

[![npm version](https://img.shields.io/npm/v/dynamic-installer.svg)](https://www.npmjs.com/package/dynamic-installer)
[![License](https://img.shields.io/npm/l/dynamic-installer.svg)](https://www.npmjs.com/package/dynamic-installer)
[![Github](https://img.shields.io/badge/GitHub-Repository-blue.svg)](https://github.com/motero2k/dynamic-installer)

**Dynamic Installer** is a library that allows you to **programmatically install npm dependencies** through code. It is ideal for **secure development environments**, enabling you to install dependencies using code instead of running `npm install` directly in the shell.

## Security Warning ⚠️

> **Warning**: This utility injects commands directly into the shell and is designed for secure, controlled development environments only. Avoid using it in production or in any exposed context, as it could be vulnerable to command injection.

## Features
>
> Refer to the [**CHANGELOG**](CHANGELOG.md) for updates and changes.

- **Programmatic npm installations**: Control installation options programmatically.
- **Global or dependency-specific options**: Pass global options like `--no-save` that apply to all libraries, or specify options for each individual dependency.
- **CommonJS and ESM support**: Compatible with both module systems.
- **Verbose option**: Enable detailed logging of the installation process.
- **TypeScript support**: Written in TypeScript with full type definitions included.
- **Input validation**: Protects against command injection attacks.

## Installation

Install `dynamic-installer` via npm:

```bash
npm install dynamic-installer
```

## Usage

Import the library's `installDependencies` function to start using it:

```javascript
import { installDependencies } from 'dynamic-installer';
```

### TypeScript Support

The library is written in TypeScript and includes full type definitions:

```typescript
import { installDependencies, type InstallOptions, type InstallationResult } from 'dynamic-installer';

const options: InstallOptions = {
  globalOptions: ['--save-dev'], // <-- now an array of option tokens
  dependencies: [
    { name: 'lodash' }
  ],
  verbose: true
};

const result: InstallationResult = await installDependencies(options);
```

The `installDependencies` function accepts a configuration object containing global options (as an array of strings) and a list of dependencies with specific options.

```javascript
const options = {
  globalOptions: ['--save-dev'],
  verbose: true,
  dependencies: [
    { name: 'eslint', options: ['--ignore-scripts'] },
    { name: 'lodash', options: ['--no-save'], override: true },
    { name: 'mocha' }
  ]
};

// With async/await
const result = await installDependencies(options);
if (result.success) {
    console.log('All dependencies installed successfully!');
} else {
    console.error('Some dependencies failed to install:', result.details);
}

// Or using .then()
installDependencies(options)
    .then(result => {
        if (result.success) {
            console.log('All dependencies installed successfully!');
        } else {
            console.error('Some dependencies failed to install:', result.details);
        }
    });
```

### Example Explanation

- **`globalOptions`** are applied to all dependencies by default, unless explicitly overridden.
- **`eslint`** installs using its own `--ignore-scripts` option combined with `globalOptions` since `override` is not set (defaults to `false`).
- **`lodash`** installs using only `--no-save` (ignoring `globalOptions`) since `override` is set to `true`.
- **`mocha`** defaults to using only the `globalOptions`.

### Output

The function returns a Promise resolving to an object with:

- **`success`**: Boolean indicating if all installations were successful.
- **`details`**: Array containing individual installation results for each dependency.
- **`logs`**: String with detailed logs of the installation process.
- **`logsArray`**: Array of individual log lines (exact order as emitted).

## API

### `installDependencies(options)`

- **`options`** (Object): A configuration object containing:
  - **`globalOptions`** (Array of Strings): Options applied globally to all dependencies (e.g. ['--save-dev']). Each token will be validated; using an array avoids ambiguity when composing commands.
  - **`dependencies`** (Array of Objects): List of dependencies, each with:
    - **`name`** (String): Dependency name (required).
    - **`options`** (Array of Strings): Specific options for this dependency (each token as a string, optional).
    - **`override`** (Boolean): Set to `true` to use only dependency-specific options, ignoring `globalOptions`. Defaults to `false`.
  - **`verbose`** (Boolean): Enable detailed logging to the console. Defaults to `true`.

Returns: A Promise resolving to an object with `success`, `details`, `logs`, and `logsArray`.

### Option & Name Validation (important)

- Options are validated token-by-token:
  - Short flags: -D, -g, etc. (regex: ^-[A-Za-z]+$)
  - Long flags: must be lower-case letters and hyphens only (regex: ^--[a-z]+(?:-[a-z]+)*$). Uppercase long flags like `--Save` will be rejected.
  - Tokens containing disallowed shell metacharacters (e.g. ; & | $ ` < > * ? ( ) { } [ ] ~ \ ) are rejected.
- Package names are validated by a conservative regex that permits letters, numbers, @, -, _, ., and `/`. Note: at the time of writing this README the validation allows patterns such as "../evil" or "@scope/../evil". Treat this as a known laxity and avoid passing untrusted input as package names.

## Supported Options

All common npm `install` options that match the permitted token patterns are supported, including:

- `--save-dev`, `--save-optional`, `--no-save`, `--global`
- `--legacy-peer-deps`, `--force`

Refer to the [npm install documentation](https://docs.npmjs.com/cli/v9/commands/npm-install) for a complete list of options, and ensure tokens follow the validation rules above.

## License

Licensed under the MIT License.

## Contact

email: [Manuel Otero](mailto:motero2k@outlook.com)
