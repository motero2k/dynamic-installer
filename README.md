# Dynamic Installer

[![npm version](https://img.shields.io/npm/v/dynamic-installer.svg)](https://www.npmjs.com/package/dynamic-installer)
[![License](https://img.shields.io/npm/l/dynamic-installer.svg)](https://www.npmjs.com/package/dynamic-installer)

**Dynamic Installer** is a library that allows you to **programmatically install npm dependencies** through code. It is ideal for **secure development environments**, enabling you to install dependencies using code instead of running `npm install` directly in the shell.

## Security Warning ⚠️

> **Warning**: This utility injects commands directly into the shell and is designed for secure, controlled development environments only. Avoid using it in production or in any exposed context, as it could be vulnerable to command injection.

## Features
> Refer to the [**CHANGELOG**](CHANGELOG.md) for updates and changes.

- **Programmatic npm installations**: Control installation options programmatically.
- **Global or dependency-specific options**: Pass global options like `--no-save` that apply to all libraries, or specify options for each individual dependency.
- **CommonJS and ESM support**: Compatible with both module systems.
- **Verbose option**: Enable detailed logging of the installation process.

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


The `installDependencies` function accepts a configuration object containing global options and a list of dependencies with specific options.

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

### Example Explanation

- **`globalOptions`** are applied to all dependencies by default, unless explicitly overridden.
- **`eslint`** installs using its own `--global` option and ignores `globalOptions`.
- **`lodash`** combines `--no-save` with the global option `--save-dev` since `override` is set to `false`.
- **`mocha`** defaults to using only the `globalOptions`.

### Output

The function returns a Promise resolving to an object with:
- **`success`**: Boolean indicating if all installations were successful.
- **`details`**: Array containing individual installation results for each dependency.
- **`logs`**: String with detailed logs of the installation process.

## API

### `installDependencies(options)`

- **`options`** (Object): A configuration object containing:
  - **`globalOptions`** (String): Options applied globally to all dependencies.
  - **`dependencies`** (Array of Objects): List of dependencies, each with:
    - **`name`** (String): Dependency name (required).
    - **`options`** (String): Specific options for this dependency (optional).
    - **`override`** (Boolean): Set to `true` to use only dependency-specific options, ignoring `globalOptions`. Defaults to `false`.

Returns: A Promise resolving to an object with `success` and `details`.

## Supported Options

All npm `install` options are supported, including:
- `--save-dev`, `--save-optional`, `--no-save`, `--global`: Control how dependencies are stored.
- `--legacy-peer-deps`, `--force`: Manage compatibility and dependency issues.

Refer to the [npm install documentation](https://docs.npmjs.com/cli/v9/commands/npm-install) for a complete list of options.

## License

Licensed under the MIT License.

## Contact

email: [Manuel Otero](mailto:motero2k@outlook.com)
