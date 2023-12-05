# React PDF Editor

React PDF Editor is a React library built with Vite.

Normally PDF is used as a final publishing format. However PDF has an option to be used as an entry form.

This library is designed for PDFs used as entry forms, allowing users to edit and save form fields within the PDF in any react application.

## Features

- Render PDF files using [PDF.js](https://mozilla.github.io/pdf.js/).
- Enable users to edit form fields within the PDF.
- Save edited PDFs with modified form data via [pdf-lib](https://github.com/Hopding/pdf-lib.git).

## Installation

```bash
npm install react-pdf-editor
```

## Usage

```typescript
import React from "react"
import ReactDOM from "react-dom/client"

// import styles of react-pdf-editor only once
import "react-pdf-editor/dist/style.css"
import PDFEditor from "react-pdf-editor"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PDFEditor src="/form.pdf" />
  </React.StrictMode>,
);
```

## Props

| Prop | Type | Comments |
|-----------------|-----------------|-----------------|
| src    | ```string \| URL \| TypedArray \| ArrayBuffer \| DocumentInitParameters```, required |Can be a URL where a PDF file is located, a typed array (Uint8Array) already populated with data, or a parameter object. |
| workerSrc    | ```string```, optional    | A string containing the path and filename of the worker file. use [pdf.worker.min.mjs CDN](https://unpkg.com/pdfjs-dist/build/pdf.worker.min.mjs) by default if not set. |
| onSave | ```(pdfBytes: Uint8Array, formFields: PDFFormFields) => void```, optional| a callback function that allows you to handle the save functionality when the user interacts with the save button. This callback is triggered when the user initiates a save action. If the onSave prop is not set, the save button will function similarly to the 'Save as' button in a browser's internal PDF extension. The default behavior is to trigger the browser's download functionality, allowing the user to save the PDF file to their local machine.|

## Exposed Data

- formFields, ```interface PDFFormFields {
  [x: string]: string;
}```, the edited form data

example
```typescript
import PDFEditor, { PDFEditorRef } from "react-pdf-editor"

const App = () => {
  const ref = useRef<PDFEditorRef>(null);
  ref.current?.formFields;
  return <PDFEditor src="/form.pdf" ref={ref} />
}
```

## Development

Clone the repository:
```bash
git clone https://github.com/lengerrong/react-pdf-editor.git
cd react-pdf-editor
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```
Open your browser and go to http://localhost:5173 to see the example.

## Acknowledgments

[PDF.js](https://mozilla.github.io/pdf.js/) is a Portable Document Format (PDF) viewer that is built with HTML5.

[pdf-lib](https://github.com/Hopding/pdf-lib.git) Create and modify PDF documents in any JavaScript environment.

## License

[Apache](LICENSE)

## Support

For any questions, issues, or feature requests, please [open an issue](https://github.com/lengerrong/react-pdf-editor/issues).