import React from "react"
import ReactDOM from "react-dom/client"
import PDFEditor from "./src/lib/PDFEditor"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PDFEditor src="/form.pdf" />
    <div></div>
  </React.StrictMode>,
);
