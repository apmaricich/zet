import { debug, info, warn, error, setLogLevel, getLogLevel, LogLevel } from './logging';

describe('logging', () => {
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    setLogLevel(LogLevel.DEBUG);
  });

  afterEach(() => {
    consoleDebugSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('logs at all severity levels', () => {
    debug('debug message');
    info('info message');
    warn('warn message');
    error('error message');

    expect(consoleDebugSpy).toHaveBeenCalledWith(
      expect.stringContaining('[DEBUG] debug message'),
    );
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] info message'),
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[WARN] warn message'),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR] error message'),
    );
  });

  it('log levels include ISO timestamp', () => {
    info('test');
    const call = consoleInfoSpy.mock.calls[0][0];
    expect(call).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('filters by log level', () => {
    setLogLevel(LogLevel.WARN);
    debug('should be filtered');
    info('should be filtered');
    warn('should appear');
    error('should appear');

    expect(consoleDebugSpy).not.toHaveBeenCalled();
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  it('getLogLevel returns current level', () => {
    setLogLevel(LogLevel.ERROR);
    expect(getLogLevel()).toBe(LogLevel.ERROR);
  });

  it('LogLevel enum has correct numeric values', () => {
    expect(LogLevel.DEBUG).toBe(0);
    expect(LogLevel.INFO).toBe(1);
    expect(LogLevel.WARN).toBe(2);
    expect(LogLevel.ERROR).toBe(3);
  });
});
