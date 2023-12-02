import styles from "./PDFEditor.module.css";

export interface PDFEditorProps {}

export function PDFEditor(props: PDFEditorProps) {
  return (
    <div className={styles["container"]}>
      <h1>Welcome to PDFEditor!{JSON.stringify(props)}</h1>
    </div>
  );
}

export default PDFEditor;
