import { SVGProps } from "react";

const ZoomOutIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg {...props}><path d="M3 8c0-.28.22-.5.5-.5h9a.5.5 0 010 1h-9A.5.5 0 013 8z"></path></svg>
  );
};

export default ZoomOutIcon;