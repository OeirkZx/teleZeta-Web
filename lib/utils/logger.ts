const isDev = process.env.NODE_ENV === 'development';
export const log = isDev
  ? (...args: unknown[]) => console.log('[TeleZeta]', ...args)
  : () => {};
export const logError = isDev
  ? (...args: unknown[]) => console.error('[TeleZeta]', ...args)
  : () => {};
export const logWarn = isDev
  ? (...args: unknown[]) => console.warn('[TeleZeta]', ...args)
  : () => {};
