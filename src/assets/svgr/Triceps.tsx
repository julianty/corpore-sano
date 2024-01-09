import type { SVGProps } from "react";
const SvgTriceps = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 394 928"
    className="muscle-svg"
    {...props}
  >
    <path
      fill="none"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
      d="M92.82 221.51c8.97 3.75 9.84 17.06 8.97 21.39-.87 4.34-18.8 44.25-22.56 47.14S34.7 315.2 32.97 318.67c-1.74 3.47-9.74 3.81-10.6 12.16-.87 8.38-6.73-.09-5.86-6.74s-1.47-15.25 2-25.95 6.45-25.19 8.38-31.81c2.03-6.94 0-16.2 5.21-22.85 5.2-6.65 6.07-14.46 17.35-18.79 11.28-4.34 18.51-8.68 26.6-8.68 8.1 0 7.81 1.74 16.77 5.5"
    />
  </svg>
);
export default SvgTriceps;
