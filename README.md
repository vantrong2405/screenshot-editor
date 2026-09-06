# VanTrongScreen

A powerful browser extension for capturing and editing screenshots with multiple capture modes, built with WXT and React.

![VanTrongScreen](https://img.shields.io/badge/version-1.2.2-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

### Capture Modes
- **Visible Page** - Capture the currently visible portion of the page
- **Select Area** - Draw a selection rectangle to capture a specific area
- **Full Page** - Capture the entire scrollable page (automatically handles lazy-loading content and sticky headers)

### Editor Tools
- ✂️ **Crop** - Trim your screenshot to focus on what matters
- ✏️ **Pencil** - Freehand drawing for annotations
- ➔ **Arrow** - Point to important elements
- / **Line** - Draw straight lines
- ▢ **Rectangle** - Highlight areas with boxes
- ○ **Circle/Ellipse** - Draw circles and ovals
- T **Text** - Add text annotations with customizable font size
- 🔴 **Blur** - Blur sensitive information

### Text Evidence Generator
Paste a list of texts you need to verify against the current screenshot and click **Generate Evidence**:
- Runs OCR entirely in the browser (local `tesseract.js`, no external API calls)
- Matches each line against **every occurrence** found in the image (exact, case-insensitive, and fuzzy matching)
- Classifies each match as **Found**, **Possible Match**, or **Not Found**
- Draws numbered red/orange rectangles directly on the canvas, reusing the existing layers/undo/redo/export pipeline

### Additional Features
- **Undo/Redo** - Full history support for all edits
- **Zoom Controls** - Unlimited zoom for detailed viewing
- **Color Picker** - Choose any color for your annotations
- **Stroke Width** - Adjustable line thickness
- **Export Options** - Save as PNG or JPEG, or copy to clipboard

## Installation

### From Source (Development)

1. Clone the repository:
   ```bash
   git clone https://github.com/trongdn2405/screenshot-editor.git
   cd screenshot-editor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build for your browser:
   ```bash
   # For Chrome/Edge
   npm run build
   
   # For Edge specifically
   npx wxt build -b edge
   
   # For Firefox
   npm run build:firefox
   ```

4. Load the extension:
   - **Chrome/Edge**: Go to `chrome://extensions` or `edge://extensions`, enable Developer mode, click "Load unpacked", and select the `.output/chrome-mv3` or `.output/edge-mv3` folder
   - **Firefox**: Go to `about:debugging`, click "This Firefox", click "Load Temporary Add-on", and select any file in the `.output/firefox-mv2` folder

### Development Mode

Run the extension in development mode with hot reload:
```bash
npm run dev
```

## Usage

1. Click the extension icon in your browser toolbar
2. Select a capture mode:
   - **Visible Page**: Instantly captures what's visible
   - **Select Area**: Click and drag to select a region
   - **Full Page**: Automatically scrolls and captures the entire page
3. Edit your screenshot using the available tools, or expand **Text Evidence** in the sidebar to auto-verify a list of texts against the screenshot
4. Export via:
   - **Copy** - Copy to clipboard
   - **PNG** - Download as PNG
   - **JPEG** - Download as JPEG

## Tech Stack

- **[WXT](https://wxt.dev/)** - Next-gen Web Extension Framework
- **React 19** - UI Framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tooling
- **Konva / react-konva** - Canvas rendering for the editor
- **tesseract.js** - Local, in-browser OCR for Text Evidence Generator

## Project Structure

```
screenshot-editor/
├── entrypoints/
│   ├── background.ts      # Service worker for capture logic
│   ├── content.ts         # Content script for area selection
│   ├── popup/              # Extension popup UI
│   └── editor/              # Screenshot editor UI
│       └── text-evidence/  # OCR-based Text Evidence Generator (types, normalize, matcher, ocr, annotate, panel)
├── public/
│   ├── icon/                # Extension icons
│   └── tesseract/           # Local OCR worker/core/traineddata assets
├── wxt.config.ts           # WXT configuration
└── package.json
```

## Known Limitations

- Full page capture may not work perfectly on sites with complex infinite scroll (like social media feeds)
- Some sites with strict Content Security Policies may block the content script
- **MSN and similar sites**: Full page capture shows duplicate sticky navigation bars. These sites use JavaScript-controlled positioning instead of CSS `position: fixed/sticky`, making it difficult to detect and hide headers during capture.
- Text Evidence Generator accuracy depends on OCR quality — very small text, unusual fonts, or low-contrast screenshots may reduce match confidence

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

- [ ] **Fix sticky navigation detection for MSN-like sites** - Sites using JavaScript-controlled sticky headers need better detection (shadow DOM inspection, scroll event monitoring, or use image-based duplicate detection)
- [ ] Keyboard shortcuts for tools
- [ ] Shape fill options
- [ ] Multiple text styles (bold, italic)
- [ ] Image filters (brightness, contrast)
- [ ] Cloud storage integration
- [ ] Browser store publication (Chrome Web Store, Firefox Add-ons, Edge Add-ons)

---

Made with ❤️ by [trongdn2405](https://github.com/trongdn2405)
