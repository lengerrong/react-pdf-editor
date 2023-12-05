import styles from "./PDFEditor.module.css";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  getDocument,
  GlobalWorkerOptions,
  PDFDocumentProxy,
  PDFPageProxy,
} from "pdfjs-dist";
import {
  DocumentInitParameters,
  TypedArray,
} from "pdfjs-dist/types/src/display/api";
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFOptionList, PDFRadioGroup, PDFTextField } from 'pdf-lib';

import ZoomOutIcon from "./icons/ZoomOutIcon";
import ZoomInIcon from "./icons/ZoomInIcon";
import PrintIcon from "./icons/PrintIcon";
import usePrint from "./hooks/usePring";
import SaveAsIcon from "./icons/SaveAsIcon";

export interface PDFFormFields {
  [x: string]: string;
}

export interface PDFEditorRef {
  formFields: PDFFormFields;
}

interface ComboboxItem {
  exportValue: string;
  displayValue: string;
}

interface PDFFormRawField {
  editable: boolean;
  hidden: boolean;
  id: string;
  multiline: boolean;
  name: string;
  page: number;
  password: boolean;
  rect: number[];
  type: "text" | "checkbox" | "combobox";
  value: string | "Off" | "On";
  defaultValue: string | "Off" | "On";
  // combobox items
  items?: ComboboxItem[];
  // TBD: actions, charLimit, combo, fillColor, rotation, strokeColor
}

interface PDFFormRawFields {
  [x: string]: PDFFormRawField[];
}

interface PDFPageAndFormFields {
  proxy: PDFPageProxy;
  fields?: PDFFormRawField[];
}

const zoomLevels = [
  0.67, 0.75, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 3.5, 4.0,
];

export interface PDFEditorProps {
  /**
   * src - Can be a URL where a PDF file is located, a typed array (Uint8Array)
   *       already populated with data, or a parameter object.
   */
  src: string | URL | TypedArray | ArrayBuffer | DocumentInitParameters;
  /**
   * - A string containing the path and filename
   * of the worker file.
   *
   * NOTE: The `workerSrc` option should always be set, in order to prevent any
   * issues when using the PDF.js library.
   */
  workerSrc?: string;
  /**
   * This callback is triggered when the user initiates a save action.
   * If the onSave prop is not set, the save button will function similarly to the 'Save as' button in a browser's internal PDF extension.
   * The default behavior is to trigger the browser's download functionality, allowing the user to save the PDF file to their local machine.
   *
   * @param pdfBytes A Uint8Array representing the binary data of the PDF file.
   * @param formFields An object of type PDFFormFields containing information about the form fields within the PDF.
   * @returns
   */
  onSave?: (pdfBytes: Uint8Array, formFields: PDFFormFields) => void;
}

const cdnworker = "https://unpkg.com/pdfjs-dist/build/pdf.worker.min.mjs";
GlobalWorkerOptions.workerSrc = cdnworker;

export const PDFEditor = forwardRef<PDFEditorRef, PDFEditorProps>(
  (props, ref) => {
    const { src, workerSrc, onSave } = props;
    const divRef = useRef<HTMLDivElement>(null);
    const [maxPageWidth, setMaxPageWidth] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(6);
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy>();
    const [docReady, setDocReady] = useState(false);
    const [pages, setPages] = useState<PDFPageAndFormFields[]>();
    const [pagesReady, setPagesReady] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
      // use cdn pdf.worker.min.mjs if not set
      GlobalWorkerOptions.workerSrc = workerSrc || cdnworker;
    }, [workerSrc]);

    useEffect(() => {
      const loadDocument = async () => {
        setDocReady(false);
        setPdfDoc(await getDocument(src).promise);
        setDocReady(true);
      };
      loadDocument();
      return () => {
        if (pdfDoc) {
          pdfDoc.destroy();
          setPdfDoc(undefined);
          setDocReady(false);
        }
      };
      // since getDocument is async api
      // pdfDoc is keeping change while loading the pdf
      // intend not include pdfDoc as dep to avoid endless loop in this effect hook
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src]);

    useEffect(() => {
      const loadFormFieldsAndPages = async () => {
        if (pdfDoc) {
          const rawFormFields =
            (await pdfDoc.getFieldObjects()) as PDFFormRawFields;
          const rawPages: PDFPageAndFormFields[] = [];
          setPagesReady(false);
          for (let i = 1; i <= pdfDoc?.numPages; i++) {
            const proxy = await pdfDoc.getPage(i);
            const fields = Object.values(rawFormFields).flatMap((rawFields) =>
              rawFields.filter(
                (rawField) =>
                  rawField.editable &&
                  !rawField.hidden &&
                  // form field page index start from 0
                  // while page proxy pageNumber index start from 1
                  rawField.page === proxy.pageNumber - 1
              )
            );
            rawPages.push({ proxy, fields });
          }
          setPages(rawPages);
          setPagesReady(true);
        }
      };
      loadFormFieldsAndPages();
      // intend not include pdfDoc, since it is a proxy
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [docReady]);

    const renderPages = useCallback(
      (scale: number) => {
        let maxPageActualWidth = 0;
        pages?.forEach((page) => {
          const viewport = page.proxy.getViewport({ scale });
          const actualWidth = page.proxy.getViewport({ scale: 1.0 }).width;
          if (actualWidth > maxPageActualWidth) {
            maxPageActualWidth = actualWidth;
          }
          const sourceCanvas = divRef.current?.querySelector(
            "canvas#page_canvas_" + page.proxy.pageNumber
          ) as HTMLCanvasElement;
          if (sourceCanvas) {
            const sourceContext = sourceCanvas.getContext("2d");
            /**
             * The devicePixelRatio property in JavaScript provides the ratio of physical pixels to CSS pixels on a device.
             * A value of 2 on your Mac likely means that your display has a high-resolution, also known as a "Retina" display.
             */
            const ratio = window.devicePixelRatio || 1;
            /**
             * Canvas Sizing: The width and height attributes determine the actual pixel dimensions of the canvas.
             */
            sourceCanvas.height = viewport.height * ratio;
            sourceCanvas.width = viewport.width * ratio;
            /**
             * The style.width and style.height properties control the size of the canvas as it is rendered on the page.
             */
            sourceCanvas.style.width = viewport.width + "px";
            sourceCanvas.style.height = viewport.height + "px";
            /**
             * for "Retina" display, 2 phsyical pixels equal to 1 CSS pixels
             */
            if (sourceContext) {
              page.proxy.render({
                canvasContext: sourceContext,
                viewport: page.proxy.getViewport({
                  scale: scale * ratio, // draw ratio pixels into Canvas
                }),
              });
            }
          }
          const pageDivContainer = divRef.current?.querySelector(
            "div#page_div_container_" + page.proxy.pageNumber
          ) as HTMLDivElement;
          pageDivContainer?.querySelectorAll("input, select").forEach((e) => {
            const input = e as HTMLInputElement;
            const rect = page.fields
              ?.find((field) => field.name === input.name)
              ?.rect?.map((x) => x * scale);
            if (rect) {
              // rect are [llx, lly, urx, ury]
              /**
               * llx: Lower-left x-coordinate (horizontal position of the lower-left corner).
               * lly: Lower-left y-coordinate (vertical position of the lower-left corner).
               * urx: Upper-right x-coordinate (horizontal position of the upper-right corner).
               * ury: Upper-right y-coordinate (vertical position of the upper-right corner).
               */
              input.style.left = rect[0] + "px";
              /**
               * The coordinate system used in many graphics-related contexts, including PDF,
               * often has the origin (0,0) located at the bottom-left corner, with the y-axis increasing upwards.
               * This convention is known as the Cartesian coordinate system.
               */
              input.style.top = viewport.height - rect[3] + "px";
              input.style.width = rect[2] - rect[0] + "px";
              input.style.height = rect[3] - rect[1] + "px";
            }
          });
        });
        if (maxPageWidth === 0) {
          setMaxPageWidth(maxPageActualWidth);
        }
      },
      // intend not include maxPageWidth, once the first loop set the max page width is enough
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [pages]
    );

    useEffect(() => {
      if (pagesReady) {
        renderPages(zoomLevels[zoomLevel]);
      }
    }, [pagesReady, renderPages, zoomLevel]);

    // re-calculate view scale level on window resize event.
    const resetViewScale = useCallback(
      (divWidth: number | undefined) => {
        if (divWidth && maxPageWidth) {
          const scaleValue = divWidth / maxPageWidth;
          let minDifference = Infinity;
          let closestZoomLevel;
          for (let i = 0; i < zoomLevels.length; i++) {
            const difference = Math.abs(scaleValue - zoomLevels[i]);
            if (difference < minDifference) {
              minDifference = difference;
              closestZoomLevel = i;
            }
          }
          setZoomLevel(closestZoomLevel || 6);
        }
      },
      [maxPageWidth]
    );

    useEffect(() => {
      const handleResize = () => {
        resetViewScale(divRef?.current?.offsetWidth);
      };
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, [resetViewScale]);

    const getAllFieldsValue = () => {
      const fieldElements = divRef?.current?.querySelectorAll("input, select");
      return fieldElements ? Array.from(fieldElements).map(e => {
        const field = e as HTMLInputElement;
        const selectElement = (e as HTMLSelectElement);
        let value = field.value;
        switch (field.type) {
          case "checkbox":
            value = field.checked ? "On" : "Off";
            break;
          case "combobox":
            value = selectElement.options[selectElement.selectedIndex].value;
            break;
          default:
            break;
        }
        return {
          [field.name]: value
        } as PDFFormFields;
      }).reduce((result, currentObject) => {
        return { ...result, ...currentObject };
      }, {}) : {};
    }

    // expose formFields value
    useImperativeHandle(ref, () => ({
      formFields: getAllFieldsValue(),
    }));

    // use react-print for the pdf print
    const onPrint = usePrint(divRef);

    const onPrintClicked = () => {
      onPrint();
    }

    const downloadPDF = (data: Blob, fileName: string) => {
      // Create a temporary anchor element
      const downloadLink = document.createElement('a');
      downloadLink.href = window.URL.createObjectURL(data);
      downloadLink.download = fileName || "download.pdf";

      // Append the anchor to the body and trigger a click
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // Clean up: Remove the anchor after the click event
      document.body.removeChild(downloadLink);

      // Release the blob URL
      window.URL.revokeObjectURL(downloadLink.href);
    };

    const saveFileUsingFilePicker = async (data: Uint8Array, fileName: string) => {
      try {
        const blob = new Blob([data], { type: 'application/pdf' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { showSaveFilePicker } = window as any;
        if (showSaveFilePicker) {
          // Request a file handle using showSaveFilePicker
          const fileHandle = await showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: 'PDF Documents',
                accept: {
                  'application/pdf': ['.pdf'],
                },
              },
            ],
          });

          // Create a writable stream from the file handle
          const writable = await fileHandle.createWritable();

          // Write the blob data to the stream
          await writable.write(blob);

          // Close the stream to finish writing
          await writable.close();
        } else {
          downloadPDF(blob, fileName);
        }
      } catch (e: unknown) {
        console.error(e);
      }
    };

    const onSaveAs = async () => {
      setIsSaving(true);
      const originData = await pdfDoc?.getData();
      if (originData) {
        const libDoc = await PDFDocument.load(originData);
        const form = libDoc.getForm();
        form.getDropdown
        const formFields = getAllFieldsValue();
        if (form) {
          for (const field of form.getFields()) {
            const value = formFields[field.getName()];
            if (field instanceof PDFTextField) {
              (field as PDFTextField).setText(value);
            } else if (field instanceof PDFCheckBox) {
              if (value === "On") {
                (field as PDFCheckBox).check();
              } else {
                (field as PDFCheckBox).uncheck();
              }
            } else if (field instanceof PDFDropdown) {
              (field as PDFDropdown).select(value);
            } else if (field instanceof PDFOptionList) {
              // FIXME...not render the input elements for this part field yet
              // TODO... handle multiple select, choice type in pdf.js
            } else if (field instanceof PDFRadioGroup) {
              // TODO... handle A set of radio buttons where users can select only one option from the group.
              // Specifically, for a radio button in a radio group, the fieldFlags property of the field object may contain the RADIO flag.
            }
          }
          const savedData = await libDoc.save();
          if (onSave) {
            onSave(savedData, formFields);
          } else {
            // default behavior, save to local machine
            // Trigger the save-as dialog
            let fileName = "download.pdf";
            if (typeof src === "string") {
              const url = (src as string);
              if (url.lastIndexOf("/") >= 0) {
                fileName = url.substring(url.lastIndexOf("/") + 1);
              }
            } else if (src instanceof URL) {
              const url = src.href;
              if (url.lastIndexOf("/") >= 0) {
                fileName = url.substring(url.lastIndexOf("/") + 1);
              }
            }
            await saveFileUsingFilePicker(savedData, fileName || "download.pdf");
          }
        }
      }
      setIsSaving(false);
    }

    if (!docReady || !pagesReady)
      return null;
    
    return (
      <div className={styles.rootContainer}>
        <div className={styles.toolbarContainer}>  
          <button
            className={styles.toolbarButton}
            title="Zoom Out"
            onClick={() => setZoomLevel(zoomLevel - 1)}
            disabled={zoomLevel <= 0}
            type="button"
          >
            <ZoomOutIcon className={styles.svgIcon} />
          </button>
          <button
            title="Zoom In"
            className={styles.toolbarButton}
            onClick={() => setZoomLevel(zoomLevel + 1)}
            disabled={zoomLevel >= zoomLevels.length - 1}
            type="button"
          >
            <ZoomInIcon className={styles.svgIcon} />
          </button>
          <button
            title="Print"
            className={styles.toolbarButton}
            onClick={onPrintClicked}
            type="button"
          >
            <PrintIcon className={styles.svgMediumIcon} />
          </button>
          <button
            title="Save as"
            className={styles.toolbarButton}
            onClick={onSaveAs}
            type="button"
            disabled={isSaving}
          >
            <SaveAsIcon className={styles.svgMediumIcon} />
          </button>
        </div>
        <div
          ref={divRef}
          className={styles.pdfContainer}
        >
          {pages &&
            pages.length > 0 &&
            pages
              .filter((page) => !page.proxy?.destroyed)
              .map((page) => (
                <div
                  id={"page_div_container_" + page.proxy.pageNumber}
                  key={"page_" + page.proxy.pageNumber}
                  className={styles.pdfPageContainer}
                >
                  <canvas id={"page_canvas_" + page.proxy.pageNumber} />
                  {page.fields &&
                    page.fields.map((field) => {
                      if (field.type === "combobox")
                        return (
                          <select
                            name={field.name}
                            title={field.name}
                            key={field.name}
                            defaultValue={field.defaultValue}
                            className={styles.pdfSelect}
                          >
                            {field.items?.map((item) => (
                              <option
                                key={item.exportValue}
                                value={item.exportValue}
                              >
                                {item.displayValue}
                              </option>
                            ))}
                          </select>
                        );
                      return (
                        <input
                          type={field.type}
                          defaultValue={field.defaultValue}
                          name={field.name}
                          key={field.name}
                          className={styles.pdfInput}
                        />
                      );
                    })}
                </div>
              ))}
        </div>
      </div>
    );
  }
);

export default PDFEditor;
