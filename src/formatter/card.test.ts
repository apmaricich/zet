import { formatCard, formatCardToString } from './card';

describe('Card formatting', () => {
  const SMALL = { width: 20, height: 4 };

  it('wraps long text', () => {
    const lines = formatCard('This is a very long line that should wrap', SMALL);
    expect(lines.length).toBe(4);
    expect(lines[0].length).toBe(20);
  });

  it('handles empty input', () => {
    const lines = formatCard('', SMALL);
    expect(lines.length).toBe(4);
    expect(lines[0]).toBe(' '.repeat(20));
  });

  it('numbers wrap correctly', () => {
    const input = '1. This is a long numbered item that wraps\n2. Short';
    const lines = formatCard(input, SMALL);
    expect(lines[0]).toMatch(/^1\. This/);
    expect(lines[1]).toMatch(/^\s{4}/);
    expect(lines[2]).toMatch(/^\s{4}/);
    expect(lines[3]).toMatch(/^2\. Short/);
  });

  it('bullets wrap correctly', () => {
    const input = '• This is a long bullet item that wraps';
    const lines = formatCard(input, SMALL);
    expect(lines[0]).toMatch(/^• This/);
    expect(lines[1]).toMatch(/^\s{3}/);
    expect(lines[2]).toMatch(/^\s{3}/);
  });

  it('arrows wrap correctly', () => {
    const input = '-> This is a long arrow item that wraps';
    const lines = formatCard(input, SMALL);
    expect(lines[0]).toMatch(/^-> This/);
    expect(lines[1]).toMatch(/^\s{4}/);
    expect(lines[2]).toMatch(/^\s{4}/);
  });

  it('mixed content works', () => {
    const input = 'Intro text\n1. First item\n2. Second item\n\nOutro';
    const lines = formatCard(input, SMALL);
    expect(lines.length).toBe(4);
  });

  it('clips lines longer than width', () => {
    const lines = formatCard('A'.repeat(100), SMALL);
    for (const line of lines) {
      expect(line.length).toBe(20);
    }
  });

  it('trims to card height', () => {
    const input = '1. one\n2. two\n3. three\n4. four\n5. five\n6. six';
    const lines = formatCard(input, SMALL);
    expect(lines.length).toBe(4);
    expect(lines[0]).toContain('1. one');
    expect(lines[3]).toContain('4. four');
  });

  it('formatCardToString joins with newlines', () => {
    const result = formatCardToString('test', { width: 10, height: 2 });
    expect(result).toContain('test');
  });
});
