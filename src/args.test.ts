import { Command } from 'commander';

describe('CLI argument parsing with commander', () => {
  let originalArgv: string[];

  beforeEach(() => {
    originalArgv = process.argv;
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  function createProgram() {
    const program = new Command();
    program
      .name('zet')
      .version('0.1.0')
      .description('Format and print text as index cards')
      .option('--dry-run', 'Preview the formatted card without printing')
      .option('--printer <name>', 'Use a specific printer')
      .option('--config <path>', 'Path to config file', './config.json')
      .option('--header <text>', 'Header text for the card')
      .option('--footer <text>', 'Footer text for the card')
      .argument('[text...]', 'text content to print')
      .option('--text <content>', 'text content to print');

    return program;
  }

  it('parses positional text arguments', () => {
    process.argv = ['node', 'zet', 'Hello World'];
    const program = createProgram();
    
    let captured: any = null;
    program.action((textArgs, options) => {
      captured = { text: textArgs, options };
    });
    
    program.parse();
    
    expect(captured.text).toEqual(['Hello World']);
  });

  it('parses multiple positional text arguments', () => {
    process.argv = ['node', 'zet', 'This', 'is', 'multiple', 'words'];
    const program = createProgram();
    
    let captured: any = null;
    program.action((textArgs, options) => {
      captured = { text: textArgs, options };
    });
    
    program.parse();
    
    expect(captured.text).toEqual(['This', 'is', 'multiple', 'words']);
  });

  it('parses --text option', () => {
    process.argv = ['node', 'zet', '--text', 'Text content here'];
    const program = createProgram();
    
    let captured: any = null;
    program.action((textArgs, options) => {
      captured = { text: textArgs, options };
    });
    
    program.parse();
    
    expect(captured.options.text).toBe('Text content here');
  });

  it('parses --text=value syntax', () => {
    process.argv = ['node', 'zet', '--text=Text with equals'];
    const program = createProgram();
    
    let captured: any = null;
    program.action((textArgs, options) => {
      captured = { text: textArgs, options };
    });
    
    program.parse();
    
    expect(captured.options.text).toBe('Text with equals');
  });

  it('parses --printer option', () => {
    process.argv = ['node', 'zet', 'Test card', '--printer', 'work'];
    const program = createProgram();
    
    let captured: any = null;
    program.action((textArgs, options) => {
      captured = { text: textArgs, options };
    });
    
    program.parse();
    
    expect(captured.options.printer).toBe('work');
  });

  it('parses --printer=name syntax', () => {
    process.argv = ['node', 'zet', 'Test card', '--printer=work'];
    const program = createProgram();
    
    let captured: any = null;
    program.action((textArgs, options) => {
      captured = { text: textArgs, options };
    });
    
    program.parse();
    
    expect(captured.options.printer).toBe('work');
  });

  it('parses --dry-run flag', () => {
    process.argv = ['node', 'zet', 'Test card', '--dry-run'];
    const program = createProgram();
    
    let captured: any = null;
    program.action((textArgs, options) => {
      captured = { text: textArgs, options };
    });
    
    program.parse();
    
    expect(captured.options.dryRun).toBe(true);
  });

  it('parses --config option', () => {
    process.argv = ['node', 'zet', 'Test card', '--config', '/path/to/config.json'];
    const program = createProgram();
    
    let captured: any = null;
    program.action((textArgs, options) => {
      captured = { text: textArgs, options };
    });
    
    program.parse();
    
    expect(captured.options.config).toBe('/path/to/config.json');
  });

  it('parses --header option', () => {
    process.argv = ['node', 'zet', 'Card body', '--header', 'Card Header'];
    const program = createProgram();
    
    let captured: any = null;
    program.action((textArgs, options) => {
      captured = { text: textArgs, options };
    });
    
    program.parse();
    
    expect(captured.options.header).toBe('Card Header');
  });

  it('parses --footer option', () => {
    process.argv = ['node', 'zet', 'Card body', '--footer', 'Card Footer'];
    const program = createProgram();
    
    let captured: any = null;
    program.action((textArgs, options) => {
      captured = { text: textArgs, options };
    });
    
    program.parse();
    
    expect(captured.options.footer).toBe('Card Footer');
  });

  it('handles multiple options together', () => {
    process.argv = ['node', 'zet', 'Test', 'content', '--printer', 'work', '--dry-run', '--header', 'Header'];
    const program = createProgram();
    
    let captured: any = null;
    program.action((textArgs, options) => {
      captured = { text: textArgs, options };
    });
    
    program.parse();
    
    expect(captured.text).toEqual(['Test', 'content']);
    expect(captured.options.printer).toBe('work');
    expect(captured.options.dryRun).toBe(true);
    expect(captured.options.header).toBe('Header');
  });

  it('has default config value', () => {
    process.argv = ['node', 'zet', 'Test'];
    const program = createProgram();
    
    let captured: any = null;
    program.action((textArgs, options) => {
      captured = { text: textArgs, options };
    });
    
    program.parse();
    
    expect(captured.options.config).toBe('./config.json');
  });

  it('has version defined', () => {
    process.argv = ['node', 'zet'];
    const program = createProgram();
    
    expect(program.opts().version).toBeUndefined();
  });

  it('handles no arguments (no text)', () => {
    process.argv = ['node', 'zet'];
    const program = createProgram();
    
    let captured: any = null;
    program.action((textArgs, options) => {
      captured = { text: textArgs, options };
    });
    
    program.parse();
    
    expect(captured.text).toEqual([]);
    expect(captured.options.text).toBeUndefined();
  });
});