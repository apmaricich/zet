#!/usr/bin/env node
/**
 * zet - CLI tool for formatting and printing text as index cards.
 *
 * Usage:
 *   zet "text content"
 *   zet "text content" --dry-run
 *   zet "text content" --printer work
 *   zet --text="text content" --dry-run
 */

import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execFileSync } from 'child_process';
import { Command } from 'commander';
import { formatCardToString } from './formatter/card';
import { getCardDimensions, getPrinterConfig, getDefaultPrinter } from './config/config';
import { info, error } from './logging';

/** Current release version */
const VERSION = '0.1.0';

function printHelp() {
  info(`
zet v${VERSION} - Format and print text as index cards

USAGE:
  zet <text> [options]
  zet --text=<text> [options]

OPTIONS:
  --dry-run       Preview the formatted card without printing
  --printer <name>  Use a specific printer (default: ${getDefaultPrinter()})
  --config <path>   Path to config file (default: ./config.json)
  --version       Show version number
  -h, --help      Show this help message

EXAMPLES:
  zet "My note here"
  zet "Shopping list" --dry-run
  zet "Important!" --printer work

PRINTERS:
  Configure printers in config.json under "printers".
  Printer names must match the keys in that section.
`);
}

function printVersion() {
  info(`zet v${VERSION}`);
}

function printTestCard(dryRun: boolean): void {
  const dims = getCardDimensions();

  // Generate test pattern that exceeds expected maximum
  // 50 X characters for header (20 more than the default 40-card width)
  // 15 numbered lines for body (3 more than the default 12-line card height)
  const header = 'X'.repeat(50);

  let body = '';
  for (let i = 1; i <= 15; i++) {
    body += `${i}\n`;
  }

  const text = `${header}\n\n${body}`;

  if (dryRun) {
    console.log('=== Zet Card (test) ===');
    console.log(formatCardToString(text, dims));
    console.log('=== End Card ===');
    return;
  }

  // Send to printer
  const printerName = getDefaultPrinter();

  try {
    const success = sendToPrinter(printerName, text, dims);
    if (!success) {
      error('sendToPrinter failed');
      process.exit(2);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    error(`Error sending to printer: ${msg}`);
    process.exit(3);
  }
}

import type { CardConfig } from './formatter/card';

function sendToPrinter(printerName: string, text: string, dims: CardConfig): boolean {
  const printer = getPrinterConfig(printerName);
  if (!printer) {
    error(`Error: Printer "${printerName}" not found in config.json`);
    return false;
  }

  // Validate printer configuration
  if (!printer.type || !['pdf', 'image'].includes(printer.type)) {
    error(`Error: Printer "${printerName}" has invalid or missing type`);
    return false;
  }
  if (!printer.path) {
    error(`Error: Printer "${printerName}" has invalid or missing path`);
    return false;
  }
  if (typeof printer.width !== 'number' || typeof printer.height !== 'number') {
    error(`Error: Printer "${printerName}" has invalid dimensions`);
    return false;
  }

  info(`Sending to printer: ${printerName} (type: ${printer.type}, path: ${printer.path})`);

  // Format card for printing with proper padding
  const formattedCard = formatCardToString(text, dims);

  // Write card to a temp file
  const fileName = `zet-card-${Date.now()}.txt`;
  const filePath = join(tmpdir(), fileName);

  try {
    writeFileSync(filePath, formattedCard);

    // Use lp command to print
    // Use 3x5 index card paper size in landscape orientation
    // Use array arguments to prevent shell injection via printer.path
    execFileSync('lp', [
      '-d', printer.path,
      '-o', 'media=3x5',
      '-o', 'orientation-requested=4',
      '-o', 'fit-to-page',
      filePath
    ]);
    info(`Print job sent successfully to ${printerName}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    error(`Error sending to printer: ${msg}`);
    return false;
  } finally {
    // Clean up temp file
    try {
      unlinkSync(filePath);
    } catch {
      // Ignore cleanup errors
    }
  }

  return true;
}

function main(): void {
  const program = new Command();

  program
    .name('zet')
    .version(VERSION)
    .description('Format and print text as index cards')
    .option('--dry-run', 'Preview the formatted card without printing')
    .option('--printer <name>', 'Use a specific printer', getDefaultPrinter())
    .option('--config <path>', 'Path to config file', './config.json')
    .option('--header <text>', 'Header text for the card')
    .option('--footer <text>', 'Footer text for the card');

  // Subcommand: test
  program
    .command('test')
    .description('Print a test card')
    .option('--dry-run', 'Preview the test card without printing')
    .action((options) => {
      printTestCard(options.dryRun);
      process.exit(0);
    });

  // Main command with positional text
  program
    .argument('[text...]', 'text content to print')
    .option('--text <content>', 'text content to print')
    .action((textArgs, options) => {
      let text = '';
      if (options.text) {
        text = options.text;
      } else if (textArgs && textArgs.length > 0) {
        text = textArgs.join(' ');
      }

      const header = options.header || '';
      const footer = options.footer || '';
      const dryRun = options.dryRun;
      const printer = options.printer || getDefaultPrinter();

      // Validate input
      if (!text && !header && !footer) {
        error('Error: No text provided.');
        error('Usage: zet <text> [options]');
        process.exit(1);
      }

      // Build the full card text with header and footer
      let cardText = '';
      if (header) {
        cardText += `${header}\n\n`;
      } else {
        cardText += '\n\n';
      }
      if (text) {
        cardText += text;
      }
      if (footer) {
        cardText += '\n\n';
        cardText += footer;
      }

      // Get card dimensions from config
      const dims = getCardDimensions();

      if (dryRun) {
        console.log('=== Zet Card (dry-run) ===');
        console.log(formatCardToString(cardText, dims));
        console.log('=== End Card ===');
        process.exit(0);
      }

      // Send to printer
      const printerName = printer || getDefaultPrinter();

      try {
        const success = sendToPrinter(printerName, cardText, dims);
        if (!success) {
          error('sendToPrinter failed');
          process.exit(2);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        error(`Error sending to printer: ${msg}`);
        process.exit(3);
      }

      process.exit(0);
    });

  program.parse();
}

main();