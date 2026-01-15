/**
 * Logger utility that silences debug output in production.
 * Use logger.debug() for development-only logging.
 * Use logger.warn() and logger.error() for important messages that should always show.
 */

const isDev = import.meta.env.DEV

export const logger = {
  /** Debug logging - only shows in development */
  debug: (module: string, ...args: unknown[]) => {
    if (isDev) console.log(`[${module}]`, ...args)
  },
  /** Warning logging - always shows */
  warn: (module: string, ...args: unknown[]) => {
    console.warn(`[${module}]`, ...args)
  },
  /** Error logging - always shows */
  error: (module: string, ...args: unknown[]) => {
    console.error(`[${module}]`, ...args)
  },
}
