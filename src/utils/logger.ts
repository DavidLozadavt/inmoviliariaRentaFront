/**
 * Conditional logger — only outputs in development mode.
 * Use this instead of raw console.log to prevent data leaks in production.
 */
const isDev = import.meta.env.DEV;

const logger = {
    log: (...args: unknown[]): void => {
        if (isDev) console.log(...args);
    },
    info: (...args: unknown[]): void => {
        if (isDev) console.info(...args);
    },
    warn: (...args: unknown[]): void => {
        if (isDev) console.warn(...args);
    },
    error: (...args: unknown[]): void => {
        if (isDev) console.error(...args);
    },
    group: (label: string): void => {
        if (isDev) console.group(label);
    },
    groupEnd: (): void => {
        if (isDev) console.groupEnd();
    },
};

export default logger;
