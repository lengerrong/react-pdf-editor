import React, { useRef } from "react"
import ReactDOM from "react-dom/client"
import PDFEditor, { PDFEditorRef } from "./src/lib/PDFEditor"

const App = () => {
  const ref = useRef<PDFEditorRef>(null);
  return <PDFEditor src="/form.pdf" ref={ref} />
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
