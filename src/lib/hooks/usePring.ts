import { useReactToPrint } from "react-to-print";
import { MutableRefObject, useCallback } from "react";

export interface PrintEventHandlers {
  onAfterPrint?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBeforeGetContent?: () => void | Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBeforePrint?: () => void | Promise<any>;
  onPrintError?: (
    errorLocation: "onBeforeGetContent" | "onBeforePrint" | "print",
    error: Error
  ) => void;
}

const usePrint = (
  ref: MutableRefObject<HTMLElement | null>,
  handlers: PrintEventHandlers = {}
): (() => void) => {
  const { onAfterPrint, onBeforePrint, onBeforeGetContent, onPrintError } =
    handlers;

  const getContent: () => HTMLElement | null = useCallback<
    () => HTMLElement | null
  >(() => {
    return ref.current;
  }, [ref]);

  const reactPrint = (target: HTMLIFrameElement) => {
    target.contentWindow?.print();
    return Promise.resolve(true);
  };

  return useReactToPrint({
    print: typeof window !== "undefined" ? reactPrint : undefined,
    content: getContent,
    copyStyles: true,
    removeAfterPrint: false,
    onAfterPrint,
    onBeforePrint,
    onBeforeGetContent,
    onPrintError,
    pageStyle: `
      body {
        margin: 0px;
      }
      
      @page {
        size: A4;
      }
    
      @media all {
        .pagebreak {
          display: none;
        }
      }
    
      @media print {
        .pagebreak {
          page-break-before: always;
        }
      }
      
      @media print {
        body {
          position: absolute;
          top: 0px;
          left: 0px;
        }
        body * {
          visibility: visible !important;
        }
        .pagebreak {
          page-break-before: always;
        }
      }
    `,
  });
};

export default usePrint;
