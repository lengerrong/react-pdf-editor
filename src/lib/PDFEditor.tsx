import "./PDFEditor.module.css";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { DocumentInitParameters, TypedArray } from "pdfjs-dist/types/src/display/api";

import ZoomOutIcon from "./icons/ZoomOutIcon";
import ZoomInIcon from "./icons/ZoomInIcon";
import PrintIcon from "./icons/PrintIcon";
import usePrint from "./hooks/usePring";

export interface PDFFormFields {
    [x: string]: string;
}

export interface PDFEditorRef {
  formFields: PDFFormFields;
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
  type: "text" | "checkbox";
  value: string | "Off" | "On";
  defaultValue: string;
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
}

const cdnworker = "https://unpkg.com/pdfjs-dist/build/pdf.worker.min.mjs";
GlobalWorkerOptions.workerSrc = cdnworker;

export const PDFEditor = forwardRef<PDFEditorRef, PDFEditorProps>((props, ref) => {
  const { src, workerSrc } = props;
  const divRef = useRef<HTMLDivElement>(null);
  const [maxPageWidth, setMaxPageWidth] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(6);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy>();
  const [docReady, setDocReady] = useState(false);
  const [pages, setPages] = useState<PDFPageAndFormFields[]>();

  useEffect(() => {
  // use cdn pdf.worker.min.mjs if not set
  GlobalWorkerOptions.workerSrc = workerSrc || cdnworker;
  }, [workerSrc]);

  useEffect(() => {
    const loadDocument = async () => {
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
        pageDivContainer?.querySelectorAll("input").forEach((input) => {
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
    renderPages(zoomLevels[zoomLevel]);
  }, [pages, renderPages, zoomLevel]);

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

  // expose formFields value
  useImperativeHandle(ref, () => ({
    formFields: divRef.current?.querySelectorAll("input")
      ? Array.from(divRef.current.querySelectorAll("input"))
          .map(
            (field) =>
              ({
                [field.name]:
                  field.type === "text"
                    ? field.value
                    : field.checked
                    ? "On"
                    : "Off",
              } as PDFFormFields)
          )
          .reduce((result, currentObject) => {
            return { ...result, ...currentObject };
          }, {})
      : {},
  }));

  // use react-print for the pdf print
  const onPrint = usePrint(divRef);

  return (
    <div className="relative flex h-full max-h-[100rem] w-full flex-col overflow-auto">
      <div className="bg-pdf-toolbar pure-white sticky top-0 flex h-10 w-full items-center justify-center px-4">
        <button
          className="bg-pdf-toolbar hover:bg-pdf-button my-2 h-8 w-9 flex items-center justify-center border-0 px-0"
          title="Zoom Out"
          onClick={() => setZoomLevel(zoomLevel - 1)}
          disabled={zoomLevel <= 0}
          type="button"
        >
          <ZoomOutIcon className={"h-4 w-4 cursor-pointer"} />
        </button>
        <button
          title="Zoom In"
          className="bg-pdf-toolbar hover:bg-pdf-button my-2 h-8 w-9 flex items-center justify-center border-0 px-0"
          onClick={() => setZoomLevel(zoomLevel + 1)}
          disabled={zoomLevel >= zoomLevels.length - 1}
          type="button"
        >
          <ZoomInIcon className={"h-4 w-4 cursor-pointer"} />
        </button>
        <button
          title="Print"
          className="bg-pdf-toolbar hover:bg-pdf-button my-2 h-8 w-9 flex items-center justify-center border-0 px-0"
          onClick={onPrint}
          type="button"
        >
          <PrintIcon className={"h-5 w-5 cursor-pointer"} />
        </button>
      </div>
      <div
        ref={divRef}
        className="bg-pdf-content flex flex-col items-center overflow-auto px-4 py-2"
      >
        {pages &&
          pages.length > 0 &&
          pages
            .filter((page) => !page.proxy?.destroyed)
            .map((page) => (
              <div
                id={"page_div_container_" + page.proxy.pageNumber}
                key={"page_" + page.proxy.pageNumber}
                className="relative"
              >
                <canvas id={"page_canvas_" + page.proxy.pageNumber} />
                {page.fields &&
                  page.fields.map((field) => (
                    <input
                      type={field.type}
                      defaultValue={field.value}
                      name={field.name}
                      key={field.name}
                      className="bg-pdf-input focus:bg-pure-white absolute border-x-0 border-t-0 border-b focus:border-2 focus:border-dotted"
                    />
                  ))}
              </div>
            ))}
      </div>
    </div>
  );
});

export default PDFEditor;
