```markdown
# Dynamic Installer

[![npm version](https://img.shields.io/npm/v/dynamic-installer.svg)](https://www.npmjs.com/package/dynamic-installer)
[![License](https://img.shields.io/npm/l/dynamic-installer.svg)](https://www.npmjs.com/package/dynamic-installer)

**Dynamic Installer** is a flexible, lightweight library for installing npm dependencies on the fly with custom options. Perfect for secure development environments where you might want to install libraries without altering the `package.json` (using options like `--no-save`) or to apply specific options to each dependency dynamically.

## Security Warning ⚠️

> **Warning**: This utility injects commands directly into the shell and is designed for secure, controlled development environments only. Avoid using it in production or in any exposed context, as it could be vulnerable to command injection.

## Features

- Install dependencies dynamically with global or dependency-specific options.
- All npm `install` options are supported, as they are passed as strings directly to the npm command.
- Supports usage of options like `--no-save` to avoid modifying the `package.json`.
- Handles installation asynchronously, with results available via `await` or `.then()` for flexibility.

## Supported Options

All options available to the npm `install` command can be used with Dynamic Installer, including:

- `--save-dev`, `--save-optional`, `--no-save`, `--global`: Control how dependencies are stored.
- `--legacy-peer-deps`, `--force`: Manage dependency compatibility.
  
You can find the complete list of options in the [npm install documentation](https://docs.npmjs.com/cli/v9/commands/npm-install).

## Installation

Install `dynamic-installer` via npm:

```bash
npm install dynamic-installer
```

## Usage

Import the library's `installDependencies` function to start using it.

```javascript
import { installDependencies } from 'dynamic-installer';
```

### Basic Usage

You can use `installDependencies` by passing a configuration object with `globalOptions` and an array of `dependencies`. Each dependency can have its own specific options, and you can control if global options are overridden or combined.

#### Example

```javascript
const options = {
  globalOptions: '--save-dev',
  dependencies: [
    { name: 'eslint', options: '--global' },
    { name: 'lodash', options: '--no-save', override: true },
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

#### Example Explanation

- `globalOptions` is applied by default to all dependencies unless overridden.
- `eslint` installs with its own `--global` option, ignoring the global option due to `override: true`.
- `lodash` combines its specific option `--no-save` with the global `--save-dev` option since `override` is `false`.
- `mocha` uses only the global option `--save-dev` as no specific options are defined.

### Output

The promise resolves to an object with:
- `success`: Boolean indicating if all installations were successful.
- `details`: Array with individual statuses and messages for each dependency.

## API

### `installDependencies(options)`

- **`options`** (Object): Configuration object containing:
  - **`globalOptions`** (String): Global options applied to all dependencies unless overridden.
  - **`dependencies`** (Array of Objects): Each object can have:
    - **`name`** (String): Name of the dependency (required).
    - **`options`** (String): Specific options for this dependency (optional).
    - **`override`** (Boolean): Whether to override `globalOptions`. Defaults to `true`.

Returns: A Promise that resolves to an object with `success` (Boolean) and `details` (Array) on completion.

## License

Licensed under the MIT License.
```