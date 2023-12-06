# React PDF Editor

React PDF Editor is a React library developed with Vite, leveraging the capabilities of [PDF.js](https://mozilla.github.io/pdf.js/) and [pdf-lib](https://github.com/Hopding/pdf-lib.git) for enhanced functionality.

[PDF.js](https://mozilla.github.io/pdf.js/) ensures precise rendering of PDFs using the Canvas API. Typically, PDFs serve as final publishing formats, but they can also function as entry forms.
However, when used as entry forms, the rendered pages by [PDF.js](https://mozilla.github.io/pdf.js/) limit user interaction.

Notably, users can interact with PDF forms when rendered by the browser's built-in PDF plugin extension. 
However, relying on the browser extension introduces a drawback — your React app lacks a mechanism to collect the form data edited by users for further utilization within the application. 

React PDF Editor addresses this limitation, providing a solution tailored for PDFs used as entry forms.
It enables users to seamlessly edit and save form fields within the PDF, ensuring compatibility with any React application while overcoming the data collection challenge associated with browser extensions.

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

## Live Demo

[react-pdf-editor Demo](https://react-pdf-editor-lengerrong.vercel.app)

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