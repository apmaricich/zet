# zet

A modern CLI tool for formatting and printing text as 3x5 index cards.

## Features

- Format text with line wrapping and list detection (numbered, bullet, arrow)
- Print to any system printer using the `lp` command
- Configurable card dimensions and printer settings via `config.json`
- Dry-run mode to preview formatted output
- Printer test mode with test pattern generation

## Installation

Install globally using npm:

```bash
npm install -g zet
```

Or clone the repository and install locally:

```bash
git clone https://github.com/apmaricich/zet.git
cd zet
npm install
npm run build
```

## Usage

### Basic Printing

```bash
# Simple text printing
zet "Hello, World!"

# Custom message
zet "Your order is ready!"
```

### Command-Line Options

```bash
zet TEXT [OPTIONS]

Options:
  --text TEXT          Text content (alternative to positional argument)
  --header TEXT        Header text for the card
  --footer TEXT        Footer text for the card
  --dry-run            Preview formatted card without printing
  --printer NAME       Use a specific printer (default: from config)
  --config PATH        Path to config file (default: ./config.json)
  --version            Show version number
  -h, --help           Show help message
```

### Examples

```bash
# Basic printing with header and footer
zet "Receipt items here" --header "My Store" --footer "Thanks!"

# Dry-run to preview formatted output
zet "Test message" --dry-run

# Specify printer by name
zet "Order #12345" --printer work

# Print a test card (stress-test pattern)
zet test
zet test --dry-run
```

## Configuration

Create a `config.json` file in your project directory:

```json
{
  "card": {
    "width": 45,
    "height": 16
  },
  "printers": {
    "home": {
      "type": "pdf",
      "path": "HP_OfficeJet_Pro_8020_series__836CC5___911_",
      "width": 4.75,
      "height": 3.0
    },
    "work": {
      "type": "pdf",
      "path": "/work/printer",
      "width": 4.75,
      "height": 3.0
    }
  },
  "default_printer": "home"
}
```

### Card Dimensions

```json
{
  "card": {
    "width": 40,
    "height": 12
  }
}
```

Default: 40 characters wide × 12 lines tall.

### Printer Configuration

```json
{
  "printers": {
    "default": {
      "type": "pdf",
      "path": "My_Printer_Name",
      "width": 4.75,
      "height": 3.0
    }
  }
}
```

Printer path is the name used by the `lp` command on your system. Find printer names with:

```bash
lpstat -p
```

## Development

### Running Tests

```bash
npm test
```

### Code Formatting and Linting

```bash
npm run lint
npm run lint:fix
```

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev "text to print" -- --dry-run
```

## How It Works

1. Text is parsed and formatted into a fixed-size card layout
2. List items (numbered, bulleted, arrow) are detected and indented appropriately
3. Lines are wrapped to fit the card width
4. Formatted card is written to a temporary file
5. The `lp` command sends the file to the specified printer with 3x5 paper settings

## License

MIT License - See LICENSE file for details.