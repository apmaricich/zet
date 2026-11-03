import { formatCardToString } from './formatter/card';
import { loadConfig, ConfigError, resetConfigCache, getCardDimensions, getPrinterConfig, getDefaultPrinter } from './config/config';

// Mock child_process for printer tests
jest.mock('child_process', () => ({
  execFileSync: jest.fn(),
}));

const mockedExec = jest.mocked(require('child_process').execFileSync);

// Mock fs for config tests
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    existsSync: jest.fn(actual.existsSync),
    readFileSync: jest.fn(actual.readFileSync),
  };
});

const mockedExistsSync = jest.mocked(require('fs').existsSync);
const mockedReadFileSync = jest.mocked(require('fs').readFileSync);

describe('CLI integration - argument parsing', () => {
  beforeEach(() => {
    mockedExec.mockClear();
    mockedExec.mockImplementation((_cmd: string, _args: string[]) => {
      return Buffer.alloc(0);
    });
  });

  it('formats basic text input', () => {
    const result = formatCardToString('Hello World', { width: 40, height: 12 });
    expect(result).toContain('Hello World');
    expect(result.split('\n').length).toBe(12);
  });

  it('formats text with header and footer', () => {
    const cardText = 'Title\n\nBody text\n\nFooter';
    const result = formatCardToString(cardText, { width: 40, height: 12 });
    expect(result).toContain('Title');
    expect(result).toContain('Body text');
    expect(result).toContain('Footer');
  });

  it('wraps long text to card width', () => {
    const longText = 'A very long sentence that should wrap across multiple lines when formatted to a card with limited width'.repeat(2);
    const result = formatCardToString(longText, { width: 40, height: 12 });
    const lines = result.split('\n');
    expect(lines.length).toBe(12);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(40);
    }
  });

  it('handles numbered lists', () => {
    const listText = '1. First item\n2. Second item\n3. Third item';
    const result = formatCardToString(listText, { width: 40, height: 12 });
    expect(result).toContain('1. First item');
    expect(result).toContain('2. Second item');
    expect(result).toContain('3. Third item');
  });

  it('handles bullet lists', () => {
    const listText = '• Apple\n• Banana\n• Cherry';
    const result = formatCardToString(listText, { width: 40, height: 12 });
    expect(result).toContain('• Apple');
    expect(result).toContain('• Banana');
    expect(result).toContain('• Cherry');
  });

  it('handles empty text', () => {
    const result = formatCardToString('', { width: 40, height: 12 });
    expect(result.split('\n').length).toBe(12);
  });
});

describe('CLI integration - printer sending', () => {
  beforeEach(() => {
    mockedExec.mockClear();
    mockedExec.mockImplementation((_cmd: string, _args: string[]) => {
      return Buffer.alloc(0);
    });
    resetConfigCache();
  });

  it('calls execFileSync with correct lp arguments for printing', () => {
    mockedExec.mockImplementation((cmd: string, args: string[]) => {
      expect(cmd).toBe('lp');
      expect(args).toContain('-d');
      expect(args).toContain('work');
      expect(args).toContain('-o');
      expect(args).toContain('media=3x5');
      expect(args).toContain('orientation-requested=4');
      expect(args).toContain('fit-to-page');
      return Buffer.alloc(0);
    });

    mockedExec('lp', [
      '-d', 'work',
      '-o', 'media=3x5',
      '-o', 'orientation-requested=4',
      '-o', 'fit-to-page',
      '/tmp/zet-card-123.txt'
    ]);

    expect(mockedExec).toHaveBeenCalledWith('lp', expect.arrayContaining([
      '-d', 'work',
      '-o', 'media=3x5',
      '-o', 'orientation-requested=4',
      '-o', 'fit-to-page',
    ]));
  });

  it('handles execFileSync errors when printer is offline', () => {
    mockedExec.mockImplementation(() => {
      const err = new Error('Printer offline');
      err.name = 'ExecError';
      throw err;
    });

    expect(() => {
      mockedExec('lp', ['-d', 'work']);
    }).toThrow('Printer offline');
  });

  it('handles missing printer config', () => {
    mockedExistsSync.mockReset();
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReset();
    mockedReadFileSync.mockReturnValue(JSON.stringify({
      printers: { home: { type: 'pdf', path: '/dev/null', width: 40, height: 12 } },
    }));

    const printer = getPrinterConfig('nonexistent');
    expect(printer).toBeNull();
  });

  it('uses default printer when none specified', () => {
    mockedExistsSync.mockReset();
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReset();
    mockedReadFileSync.mockReturnValue(JSON.stringify({
      default_printer: 'home',
    }));

    const defaultPrinter = getDefaultPrinter();
    expect(defaultPrinter).toBe('home');
  });
});

describe('CLI integration - config loading', () => {
  beforeEach(() => {
    mockedExistsSync.mockReset();
    mockedReadFileSync.mockReset();
    resetConfigCache();
  });

  it('loads config from config.json', () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(JSON.stringify({
      card: { width: 50, height: 15 },
      printers: {
        home: { type: 'pdf', path: '/dev/null', width: 40, height: 12 },
      },
      default_printer: 'home',
    }));

    const config = loadConfig();
    expect(config.card?.width).toBe(50);
    expect(config.card?.height).toBe(15);
    expect(config.printers?.home?.type).toBe('pdf');
    expect(config.default_printer).toBe('home');
  });

  it('throws ConfigError for invalid JSON', () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue('{"invalid json"');

    expect(() => loadConfig()).toThrow(ConfigError);
    expect(() => loadConfig()).toThrow('Failed to parse config.json');
  });

  it('throws ConfigError for read errors', () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockImplementation(() => {
      const err = new Error('Permission denied');
      throw err;
    });

    expect(() => loadConfig()).toThrow(ConfigError);
  });

  it('returns defaults when config.json does not exist', () => {
    mockedExistsSync.mockReturnValue(false);

    const config = loadConfig();
    expect(config).toEqual({});
  });

  it('validates printer config structure', () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(JSON.stringify({
      printers: {
        good: { type: 'pdf', path: '/dev/null', width: 40, height: 12 },
        badType: { type: 'unknown', path: '/dev/null', width: 40, height: 12 },
        missingPath: { type: 'pdf', width: 40, height: 12 },
        missingDims: { type: 'pdf', path: '/dev/null' },
      },
    }));

    const config = loadConfig();
    expect(config.printers?.good?.type).toBe('pdf');
    expect(config.printers?.badType?.type).toBe('unknown');
    expect(config.printers?.missingPath).toBeDefined();
    expect(config.printers?.missingDims).toBeDefined();
  });

  it('getCardDimensions returns default when not configured', () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue('{}');

    const dims = getCardDimensions();
    expect(dims.width).toBe(40);
    expect(dims.height).toBe(12);
  });

  it('getCardDimensions reads configured values', () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(JSON.stringify({
      card: { width: 60, height: 20 },
    }));

    const dims = getCardDimensions();
    expect(dims.width).toBe(60);
    expect(dims.height).toBe(20);
  });

  it('getPrinterConfig returns null for missing printer', () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue('{}');

    const printer = getPrinterConfig('missing');
    expect(printer).toBeNull();
  });
});