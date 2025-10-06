import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exec } from 'child_process';
import { installDependencies, type InstallOptions } from '../src/index';

// Mock child_process
vi.mock('child_process');

describe('installDependencies', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Basic Installation', () => {
        it('should install a single dependency successfully', async () => {
            const mockExec = vi.mocked(exec);
            mockExec.mockImplementation((cmd, callback: any) => {
                callback(null, 'added 1 package', '');
                return {} as any;
            });

            const options: InstallOptions = {
                dependencies: [{ name: 'lodash' }],
                verbose: false
            };

            const result = await installDependencies(options);

            expect(result.success).toBe(true);
            expect(result.details).toHaveLength(1);
            expect(result.details[0].name).toBe('lodash');
            expect(result.details[0].success).toBe(true);
        });

        it('should install multiple dependencies', async () => {
            const mockExec = vi.mocked(exec);
            mockExec.mockImplementation((cmd, callback: any) => {
                callback(null, 'added 1 package', '');
                return {} as any;
            });

            const options: InstallOptions = {
                dependencies: [
                    { name: 'lodash' },
                    { name: 'axios' },
                    { name: 'express' }
                ],
                verbose: false
            };

            const result = await installDependencies(options);

            expect(result.success).toBe(true);
            expect(result.details).toHaveLength(3);
            expect(mockExec).toHaveBeenCalledTimes(3);
        });
    });

    describe('Global Options', () => {
        it('should apply global options to all dependencies by default', async () => {
            const mockExec = vi.mocked(exec);
            mockExec.mockImplementation((cmd, callback: any) => {
                callback(null, 'success', '');
                return {} as any;
            });

            const options: InstallOptions = {
                globalOptions: ['--save-dev'],
                dependencies: [{ name: 'lodash' }],
                verbose: false
            };

            await installDependencies(options);

            expect(mockExec).toHaveBeenCalledWith(
                expect.stringContaining('--save-dev'),
                expect.any(Function)
            );
        });

        it('should combine global and specific options when override is false', async () => {
            const mockExec = vi.mocked(exec);
            mockExec.mockImplementation((cmd, callback: any) => {
                callback(null, 'success', '');
                return {} as any;
            });

            const options: InstallOptions = {
                globalOptions: ['--save-dev'],
                dependencies: [
                    { name: 'lodash', options: ['--no-save'], override: false }
                ],
                verbose: false
            };

            await installDependencies(options);

            const callArg = mockExec.mock.calls[0][0] as string;
            expect(callArg).toContain('--save-dev');
            expect(callArg).toContain('--no-save');
        });

        it('should use only specific options when override is true', async () => {
            const mockExec = vi.mocked(exec);
            mockExec.mockImplementation((cmd, callback: any) => {
                callback(null, 'success', '');
                return {} as any;
            });

            const options: InstallOptions = {
                globalOptions: ['--save-dev'],
                dependencies: [
                    { name: 'lodash', options: ['--no-save'], override: true }
                ],
                verbose: false
            };

            await installDependencies(options);

            const callArg = mockExec.mock.calls[0][0] as string;
            expect(callArg).not.toContain('--save-dev');
            expect(callArg).toContain('--no-save');
        });
    });

    describe('Error Handling', () => {
        it('should handle installation errors correctly', async () => {
            const mockExec = vi.mocked(exec);
            mockExec.mockImplementation((cmd, callback: any) => {
                callback(new Error('npm install failed'), '', 'error output');
                return {} as any;
            });

            const options: InstallOptions = {
                dependencies: [{ name: 'invalid-package' }],
                verbose: false
            };

            const result = await installDependencies(options);

            expect(result.success).toBe(false);
            expect(result.details[0].success).toBe(false);
            expect(result.details[0].message).toContain('npm install failed');
        });

        it('should continue installing other packages after one fails', async () => {
            const mockExec = vi.mocked(exec);
            let callCount = 0;
            mockExec.mockImplementation((cmd, callback: any) => {
                callCount++;
                if (callCount === 1) {
                    callback(new Error('first failed'), '', '');
                } else {
                    callback(null, 'success', '');
                }
                return {} as any;
            });

            const options: InstallOptions = {
                dependencies: [
                    { name: 'invalid-package' },
                    { name: 'valid-package' }
                ],
                verbose: false
            };

            const result = await installDependencies(options);

            expect(result.success).toBe(false);
            expect(result.details[0].success).toBe(false);
            expect(result.details[1].success).toBe(true);
        });
    });

    describe('Input Validation', () => {
        it('should reject invalid package names with special characters', async () => {
            const mockExec = vi.mocked(exec);

            const options: InstallOptions = {
                dependencies: [
                    { name: 'valid-package' },
                    { name: 'invalid; rm -rf /' },
                    { name: 'malicious$(whoami)' }
                ],
                verbose: false
            };

            mockExec.mockImplementation((cmd, callback: any) => {
                callback(null, 'success', '');
                return {} as any;
            });

            const result = await installDependencies(options);

            expect(result.success).toBe(false);
            expect(result.details).toHaveLength(3);
            expect(result.details[0].success).toBe(true);
            expect(result.details[1].success).toBe(false);
            expect(result.details[1].message).toContain('Invalid dependency name');
            expect(result.details[2].success).toBe(false);
            expect(result.details[2].message).toContain('Invalid dependency name');
            
            // Should only call exec for valid package
            expect(mockExec).toHaveBeenCalledTimes(1);
        });

        it('should accept valid package names including scoped packages', async () => {
            const mockExec = vi.mocked(exec);
            mockExec.mockImplementation((cmd, callback: any) => {
                callback(null, 'success', '');
                return {} as any;
            });

            const options: InstallOptions = {
                dependencies: [
                    { name: '@types/node' },
                    { name: 'lodash' },
                    { name: 'package-name' },
                    { name: 'package_name' },
                    { name: 'package.name' }
                ],
                verbose: false
            };

            const result = await installDependencies(options);

            expect(result.success).toBe(true);
            expect(result.details.every(d => d.success)).toBe(true);
            expect(mockExec).toHaveBeenCalledTimes(5);
        });
    });

    describe('Verbose Option', () => {
        it('should respect verbose: false and not log to console', async () => {
            const consoleSpy = vi.spyOn(console, 'log');
            const mockExec = vi.mocked(exec);
            mockExec.mockImplementation((cmd, callback: any) => {
                callback(null, 'success', '');
                return {} as any;
            });

            const options: InstallOptions = {
                dependencies: [{ name: 'lodash' }],
                verbose: false
            };

            await installDependencies(options);

            expect(consoleSpy).not.toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should log to console when verbose: true', async () => {
            const consoleSpy = vi.spyOn(console, 'log');
            const mockExec = vi.mocked(exec);
            mockExec.mockImplementation((cmd, callback: any) => {
                callback(null, 'success', '');
                return {} as any;
            });

            const options: InstallOptions = {
                dependencies: [{ name: 'lodash' }],
                verbose: true
            };

            await installDependencies(options);

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should default to verbose: true when not specified', async () => {
            const consoleSpy = vi.spyOn(console, 'log');
            const mockExec = vi.mocked(exec);
            mockExec.mockImplementation((cmd, callback: any) => {
                callback(null, 'success', '');
                return {} as any;
            });

            const options: InstallOptions = {
                dependencies: [{ name: 'lodash' }]
            };

            await installDependencies(options);

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Logs', () => {
        it('should capture logs in the result', async () => {
            const mockExec = vi.mocked(exec);
            mockExec.mockImplementation((cmd, callback: any) => {
                callback(null, 'package installed', '');
                return {} as any;
            });

            const options: InstallOptions = {
                dependencies: [{ name: 'lodash' }],
                verbose: false
            };

            const result = await installDependencies(options);

            expect(result.logs).toBeTruthy();
            expect(result.logs).toContain('command:');
            expect(result.logs).toContain('lodash');
        });
    });

    describe('Injection & Edge Cases', () => {
        it('[+] should accept directory traversal pattern "../evil" (reveals lax name validation)', async () => {
            const mockExec = vi.mocked(exec);
            mockExec.mockImplementation((cmd, callback: any) => {
                callback(null, 'added 1 package', '');
                return {} as any;
            });

            const options: InstallOptions = {
                dependencies: [{ name: '../evil' }],
                verbose: false
            };

            const result = await installDependencies(options);

            expect(result.details).toHaveLength(1);
            expect(result.details[0].name).toBe('../evil');
            expect(result.details[0].success).toBe(true);
            expect(mockExec).toHaveBeenCalledTimes(1);
        });

        it('[-] should reject uppercase long flags like "--Save"', async () => {
            const mockExec = vi.mocked(exec);
            mockExec.mockImplementation(() => { throw new Error('exec should not be called'); });

            const options: InstallOptions = {
                dependencies: [{ name: 'lodash', options: ['--Save'] }],
                verbose: false
            };

            const result = await installDependencies(options);

            expect(result.details[0].success).toBe(false);
            expect(result.details[0].message).toContain('Invalid options');
            expect(mockExec).not.toHaveBeenCalled();
        });

        it('[-] should reject options containing dangerous metacharacters ("--no-save; rm -rf /")', async () => {
            const mockExec = vi.mocked(exec);
            mockExec.mockImplementation(() => { throw new Error('exec should not be called'); });

            const options: InstallOptions = {
                dependencies: [{ name: 'lodash', options: ['--no-save; rm -rf /'] }],
                verbose: false
            };

            const result = await installDependencies(options);

            expect(result.details[0].success).toBe(false);
            expect(result.details[0].message).toContain('Invalid options');
            expect(mockExec).not.toHaveBeenCalled();
        });

        it('[+] should accept scoped package with traversal "@scope/../evil" (reveals lax name validation)', async () => {
            const mockExec = vi.mocked(exec);
            mockExec.mockImplementation((cmd, callback: any) => {
                callback(null, 'added 1 package', '');
                return {} as any;
            });

            const options: InstallOptions = {
                dependencies: [{ name: '@scope/../evil' }],
                verbose: false
            };

            const result = await installDependencies(options);

            expect(result.details).toHaveLength(1);
            expect(result.details[0].name).toBe('@scope/../evil');
            expect(result.details[0].success).toBe(true);
            expect(mockExec).toHaveBeenCalledTimes(1);
        });

        it('[-] should reject invalid global options (should block all installs)', async () => {
            const mockExec = vi.mocked(exec);
            mockExec.mockImplementation(() => { throw new Error('exec should not be called'); });

            const options: InstallOptions = {
                globalOptions: ['--save-dev', '; rm -rf /'],
                dependencies: [{ name: 'lodash' }],
                verbose: false
            };

            const result = await installDependencies(options);

            expect(result.success).toBe(false);
            expect(result.details[0].success).toBe(false);
            expect(result.details[0].message).toContain('Invalid options');
            expect(mockExec).not.toHaveBeenCalled();
        });
    });
});
