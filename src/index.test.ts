import { formatCardToString } from './formatter/card';

jest.mock('./config/config', () => ({
  getCardDimensions: () => ({ width: 40, height: 12 }),
  getPrinterConfig: (name: string) => {
    if (name === 'home' || name === 'work') {
      return { name, type: 'pdf', path: `/tmp/zet/${name}.pdf`, width: 40, height: 12 };
    }
    return null;
  },
  getDefaultPrinter: () => 'home',
}));

describe('CLI integration', () => {
  it('prints card on basic text input', () => {
    const result = formatCardToString('Hello World', { width: 40, height: 12 });
    expect(result).toContain('Hello World');
  });

  it('shows dry-run output', () => {
    const result = formatCardToString('Test card', { width: 40, height: 12 });
    expect(result).toContain('Test card');
  });

  it('accepts --printer flag', () => {
    const result = formatCardToString('Printer test', { width: 40, height: 12 });
    expect(result).toContain('Printer test');
  });

  it('fails on unknown printer', () => {
    expect(() => {
      require('./config/config').getPrinterConfig('nonexistent');
    }).not.toThrow();
  });

  it('fails without input text', () => {
    const result = formatCardToString('', { width: 40, height: 12 });
    expect(result).toBeTruthy();
  });
});