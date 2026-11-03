import { readFileSync, existsSync } from 'fs';

export interface PrinterConfig {
  type: string;
  path: string;
  width: number;
  height: number;
}

export interface CardDimensions {
  width: number;
  height: number;
}

export interface ZetConfig {
  card?: CardDimensions;
  printers?: Record<string, PrinterConfig>;
  default_printer?: string;
}

const DEFAULT_CARD: CardDimensions = { width: 40, height: 12 };

export class ConfigError extends Error {
  constructor(message: string, public readonly file: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ConfigError';
  }
}

// Module-level cache: loaded once, persisted across calls
let cachedConfig: ZetConfig | null = null;

/**
 * Reset the config cache. Useful in tests or when config is modified externally.
 */
export function resetConfigCache(): void {
  cachedConfig = null;
}

/**
 * Load configuration from config.json in the current directory.
 * Returns defaults if the file does not exist.
 * Throws a ConfigError if the file exists but cannot be parsed.
 *
 * The config is loaded once and cached for subsequent calls.
 */
export function loadConfig(): ZetConfig {
  if (cachedConfig !== null) {
    return cachedConfig;
  }
  if (!existsSync('config.json')) {
    cachedConfig = {};
    return cachedConfig;
  }
  try {
    const parsed = JSON.parse(readFileSync('config.json', 'utf-8')) as ZetConfig;
    cachedConfig = parsed;
    return parsed;
  } catch (e) {
    throw new ConfigError('Failed to parse config.json', 'config.json', e);
  }
}

/**
 * Get card dimensions from config, falling back to defaults.
 */
export function getCardDimensions(): CardDimensions {
  const config = loadConfig();
  if (config.card?.width && config.card?.height) {
    return { width: config.card.width, height: config.card.height };
  }
  return { ...DEFAULT_CARD };
}

/**
 * Get a printer configuration by name.
 */
export function getPrinterConfig(name: string): PrinterConfig | null {
  const config = loadConfig();
  return config.printers?.[name] ?? null;
}

/**
 * Get the default printer name.
 */
export function getDefaultPrinter(): string {
  const config = loadConfig();
  return config.default_printer ?? 'default';
}
