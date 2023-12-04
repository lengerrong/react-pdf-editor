import { SVGProps } from "react";

const ZoomInIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg {...props}><path d="M8 2.5a.5.5 0 00-1 0V7H2.5a.5.5 0 000 1H7v4.5a.5.5 0 001 0V8h4.5a.5.5 0 000-1H8V2.5z"></path></svg>
  );
};

export default ZoomInIcon;