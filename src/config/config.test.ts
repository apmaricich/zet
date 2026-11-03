import { loadConfig, resetConfigCache, ConfigError, getCardDimensions, getPrinterConfig, getDefaultPrinter } from './config';
import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'fs';

// Track whether there was an original config file and its contents
const originalHadFile = existsSync('config.json');
const originalContent = originalHadFile ? readFileSync('config.json', 'utf-8') : null;

function withConfig(content: string, fn: () => void) {
  writeFileSync('config.json', content);
  resetConfigCache();
  try {
    fn();
  } finally {
    restoreConfig();
  }
}

function withoutConfig(fn: () => void) {
  if (existsSync('config.json')) {
    unlinkSync('config.json');
  }
  resetConfigCache();
  try {
    fn();
  } finally {
    restoreConfig();
  }
}

function restoreConfig() {
  if (originalHadFile && originalContent !== null) {
    writeFileSync('config.json', originalContent);
  } else {
    if (existsSync('config.json')) {
      unlinkSync('config.json');
    }
  }
  resetConfigCache();
}

// Clean up after all tests
afterAll(() => restoreConfig());

describe('loadConfig', () => {
  it('returns empty object when no config.json exists', () => {
    withoutConfig(() => {
      const config = loadConfig();
      expect(config).toEqual({});
    });
  });

  it('parses valid JSON config', () => {
    withConfig(JSON.stringify({
      card: { width: 50, height: 15 },
      printers: { test: { type: 'pdf', path: '/tmp/test.pdf', width: 50, height: 15 } },
      default_printer: 'test'
    }), () => {
      const config = loadConfig();
      expect(config.card?.width).toBe(50);
      expect(config.default_printer).toBe('test');
      expect(config.printers?.test?.path).toBe('/tmp/test.pdf');
    });
  });

  it('throws ConfigError when config.json is malformed', () => {
    withConfig('{invalid json', () => {
      expect(() => loadConfig()).toThrow(ConfigError);
    });
  });

  it('throws ConfigError with cause property', () => {
    withConfig('{"incomplete":', () => {
      try {
        loadConfig();
        throw new Error('Expected ConfigError');
      } catch (e) {
        expect(e).toBeInstanceOf(ConfigError);
        expect((e as ConfigError).cause).toBeDefined();
      }
    });
  });

  it('throws ConfigError with file property set', () => {
    withConfig('not json at all', () => {
      try {
        loadConfig();
        throw new Error('Expected ConfigError');
      } catch (e) {
        expect((e as ConfigError).file).toBe('config.json');
      }
    });
  });

  it('caches config after first load', () => {
    withConfig(JSON.stringify({ card: { width: 10, height: 20 } }), () => {
      const config1 = loadConfig();
      const config2 = loadConfig();
      // Same object reference = caching
      expect(config1).toBe(config2);
    });
  });

  it('returns cached config even when file changes on disk', () => {
    withConfig(JSON.stringify({ card: { width: 10, height: 10 } }), () => {
      const config1 = loadConfig();
      expect(config1.card?.width).toBe(10);

      // Modify file on disk
      writeFileSync('config.json', JSON.stringify({ card: { width: 99, height: 99 } }));

      // Still returns cached value
      const config2 = loadConfig();
      expect(config2).toBe(config1);
      expect(config2.card?.width).toBe(10);
    });
  });

  it('resetConfigCache forces reload from disk', () => {
    withConfig(JSON.stringify({ card: { width: 10, height: 10 } }), () => {
      const config1 = loadConfig();
      expect(config1.card?.width).toBe(10);

      // Modify file on disk
      writeFileSync('config.json', JSON.stringify({ card: { width: 99, height: 99 } }));
      resetConfigCache();

      const config2 = loadConfig();
      expect(config2).not.toBe(config1);
      expect(config2.card?.width).toBe(99);
    });
  });
});

describe('getCardDimensions', () => {
  it('returns default dimensions when no config file exists', () => {
    withoutConfig(() => {
      const dims = getCardDimensions();
      expect(dims).toEqual({ width: 40, height: 12 });
    });
  });

  it('returns default dimensions when config has no card section', () => {
    withConfig(JSON.stringify({}), () => {
      const dims = getCardDimensions();
      expect(dims).toEqual({ width: 40, height: 12 });
    });
  });

  it('returns custom dimensions from config', () => {
    withConfig(JSON.stringify({ card: { width: 100, height: 30 } }), () => {
      const dims = getCardDimensions();
      expect(dims).toEqual({ width: 100, height: 30 });
    });
  });

  it('throws when config is malformed', () => {
    withConfig('{malformed', () => {
      expect(() => getCardDimensions()).toThrow(ConfigError);
    });
  });
});

describe('getPrinterConfig', () => {
  it('returns null for unknown printer', () => {
    withConfig(JSON.stringify({}), () => {
      const printer = getPrinterConfig('unknown');
      expect(printer).toBeNull();
    });
  });

  it('returns printer config by name', () => {
    withConfig(JSON.stringify({
      printers: { home: { type: 'pdf', path: '/tmp/home.pdf', width: 40, height: 12 } }
    }), () => {
      const printer = getPrinterConfig('home');
      expect(printer?.path).toBe('/tmp/home.pdf');
      expect(printer?.type).toBe('pdf');
    });
  });

  it('throws when config is malformed', () => {
    withConfig('{broken', () => {
      expect(() => getPrinterConfig('any')).toThrow(ConfigError);
    });
  });
});

describe('getDefaultPrinter', () => {
  it('returns default printer name when not configured', () => {
    withConfig(JSON.stringify({}), () => {
      const printer = getDefaultPrinter();
      expect(printer).toBe('default');
    });
  });

  it('returns configured default printer', () => {
    withConfig(JSON.stringify({ default_printer: 'work' }), () => {
      const printer = getDefaultPrinter();
      expect(printer).toBe('work');
    });
  });
});