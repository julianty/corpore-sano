import type { SVGProps } from "react";
const SvgBodyOutlineBack = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={1000} height={1000} {...props}>
    <path
      fill="none"
      stroke="#000"
      strokeLinecap="round"
      strokeWidth={3}
      d="M723.36 52.89c-2.33.12-7.9 1.55-12.36 3.04-3.21 1.1-11.97 5.76-13.4 6.69-3.34 2.21-7.69 7.3-9.56 10.62-1.89 3.48-3.99 10.07-4.35 15-.47 6.88.61 22.38 1.99 32.92 1.02 8.12 3.27 27.19 3.6 32.41.31 4.9.16 10.33-.92 13.15-1.18 2.97-5.23 8.18-8.11 10.8-4.96 4.41-21.48 14.38-26.86 16.67-6.64 2.78-20.27 5.05-27.62 7.96-2.94 1.18-10.06 4.64-12.6 6.15-3.24 1.96-9.53 7.2-12.56 10.49-4.7 5.14-10.4 14.05-18.05 27.13-1.74 2.84-7.06 11.25-8.15 12.74-.08.11-6.25 6.83-8.02 9.66-4.31 7.07-8.9 17.15-12.2 26.57-3.39 10.5-6.76 23.81-8.06 31.96-.99 6.66-2.6 20.95-3.22 28.65-1.07 17.94-.93 48.13-.46 64.11.51 16.29.45 52.5-.26 66.02-1.02 15.88-.98 22.99.57 28.8.44 1.55 1.85 4.65 2.91 6.25 1.11 1.6 4.16 4.35 5.86 5.3 2.86 1.52 11.52 3.44 15.32 3.71 3.77.22 11.47-1.92 15.26-4.28.7-.45 8.31-5.63 11.99-8.7 2.01-1.73 3.53-3.43 3.99-4.79.91-2.86.35-11.21-.23-14.94-.87-5.28-3.51-12.06-5.74-14.56-1.14-1.22-3.82-3.14-5.28-3.77-1.61-.68-5.53-1.29-6.64-1.61-1.55-.48-4.11-2.62-4.92-4.18-1.37-2.78-2.06-9.4-1.96-12.28.21-5.5 10.39-60.4 11.05-66.14.33-2.96.62-11.19.11-13.98-.17-.94-1.91-5.4-1.86-6.34.09-1.28 1.42-3.99 2.36-5.1 2.14-2.4 8.89-7.97 10.47-9.55 5.13-5.17 14.89-19.16 20.47-28.81 2.18-3.84 6.28-11.84 6.5-12.48.62-1.73.98-5.64 1.32-6.61.4-1.12 1.29-.53 2.23 1.28.11.2 13.09 24.63 15.21 29 2.1 4.34 5.55 12.25 6.88 15.78 1.6 4.31 3.93 12.79 4.22 16.94.23 3.89-2.13 11.22-2.52 13.13-.61 3.01-.72 9.88.03 13.19.2.88 1.78 6.25 2.03 7.48.71 3.7.02 10.59-1.15 14.6-.88 2.88-4.58 11.74-5.44 14.39-1.1 3.44-2.19 9.87-2.06 12.81.07 1.62 1.26 9.25.41 14.39-.79 4.6-5.39 20.87-7.69 28.19-2.81 8.38-8.49 25.43-11.08 33.71-2.29 7.92-6.64 24.93-7.9 32.13-1.58 9.17-2.27 20.64-2.23 31.35.12 6.37.91 22.54 1.41 27.15.78 7 3.77 19.01 6.35 26.46 2.1 5.81 7.7 20.38 8.7 26.55 1.22 7.94.54 24.36-.44 31.63-.84 6.09-3.91 21-6.45 31.18-2.07 8.4-4.75 25.27-5.31 33.56-.53 8.06-.16 25.11.86 33.63 1.54 12.51 10.98 48.07 14.06 60.95 2.84 13.14 5.21 28.5 4.71 33.69-.31 2.89-2.22 8.71-4.15 11.38-2.17 2.91-10.62 8.22-12.31 9.29-.99.62-3.77 2.49-5.11 3.48-2.5 1.92-4.43 4.16-4.25 5.52.25 1.47 1.98 3.32 3.72 4.25 9.79 4.93 23.61 10.7 29.76 11.98 5.39 1.07 13.23.91 17.3-.06 3.83-.99 6.59-3.04 6.94-4.17.28-1.03-.6-4.64-.61-8.67-.05-4.6 1.96-25.22.98-31.18-.4-2.34-2.73-7.87-3.06-11.33-.41-4.58.33-20.36.95-28.32.92-9.91 3.55-24.93 5.65-32.19 1.16-3.95 3.86-11.46 5.42-15.05 1.68-3.83 6.32-12.48 6.91-13.69 1.59-3.29 4-10.75 4.73-14.63 1.32-7.24.95-23.48-.6-32.16-.69-3.81-5.92-26.79-6.79-32.63-.51-3.54-1.17-10.82-1.13-14.05.09-5.84 3.19-14.12 6.99-26.73 4.04-14.5 12.61-46.41 17.15-63.81 1.95-8.5 5.12-24.29 6.33-31.58 1.74-11.89 2.72-28.61 1.87-36.65-.86-8.1-.61-14.56-.19-17.51.22-1.52 1.23-3.34 2.55-4.26 1.27-.83 5.27-1.38 7.31-1.09 1.95.32 4.55 2.1 5.3 3.47.24.49.98 6.87.95 9.88-.06 3.25-1.7 22.39-.79 33.04.65 7.48 3.71 25.42 5.31 33.18 3.45 15.17 22.86 86.17 23.68 88.81.8 2.53 3.88 10.14 4.05 10.74.74 2.74.22 8.85-.45 13.46-1.05 6.38-5.52 29.4-5.84 31.32-1.49 8.95-2.39 25.8-1.78 33.86.66 8.27 3.9 21.78 7.31 30.84 2.44 6.76 7 19.8 9.44 27.49 2.77 9.07 6.16 24.01 6.76 30.44.33 3.84.01 11.05-1.13 15.3-1.2 4.4-2.09 10.43-1.79 13.5.18 1.79 2.3 10.03 2.1 15.8-.12 2.98-1.01 9.43-2.1 15.06-.86 4.74-.37 10.88 1.01 12.85.82 1.08 3.09 2.51 4.61 2.85 3.94.8 22.97-3 34.01-6.48 6.98-2.32 13.03-4.68 15.3-6.3 1.03-.78 2.33-2.43 2.46-3.22.12-1.07-.72-3.15-1.77-4.26-1.75-1.77-11.84-7.17-14.61-9.45-3.21-2.69-7.14-8.39-8.34-11.38-1.06-2.72-2.17-8.71-2.25-12.1-.1-6.58 2-21.3 4.2-32.62 2.31-10.69 12.44-48.53 14.06-62.45.89-7.82 1.17-24.85.4-32.95-.42-4.2-1.74-12.51-2.65-16.6-.79-3.54-6.17-23.75-7.42-30.81-1.28-7.32-2.52-23.44-1.68-31.62.61-5.56 5.1-22.01 6.96-28.61 2.07-6.69 7.47-23.56 7.99-26.01 1.41-6.82 2.28-21.72 2.25-30.42-.21-8.44-1.42-27.48-2.13-33.87-1.17-9.17-4.16-24.12-6.28-31.22-4.34-13.82-15.9-50.32-17.31-56.4-.8-3.47-2.03-10.94-2.21-14.5-.12-2.46.24-10.79-.05-14.44-.62-7.23-5.77-23.55-6.26-28-.43-4.26 1.01-12.24 1.11-14.49.26-6.36-2.68-24.33-2.87-30.16-.09-3.4.45-10.78 1.02-13.52 1.45-6.69 8.8-20.2 14.09-28.05 4.8-7.1 10.13-16.34 10.8-18.71.31-1.05 1.01-4.2 1.6-3.73.53.49 10.63 22.21 12.97 26.49 2.01 3.66 6.58 10.65 9.17 13.93 2.98 3.74 11.69 10.85 12.06 11.16 2.36 1.92 6.13 6.52 6.78 9 .49 2.08-1.65 8.75-1.49 12.85.28 6.46 2.82 20.08 5.52 31.45 2.1 8.71 5.8 26.55 6.45 32.91.53 5.37.18 13.12-.59 16.39-.8 3.14-3.84 8.31-6.26 9.72-.9.51-4.18 2.04-5.59 3.1-2.66 2.03-6.95 7.33-8.82 10.8-1.88 3.56-4.21 10.88-4.54 14.46-.15 1.73-.1 5.85.12 7.44.31 2.05 1.56 5.36 2.67 6.92 2.1 2.86 8.37 6.83 11.94 8.2 3.89 1.47 12.04 3.29 15.99 3.56 2.11.12 5.69-.2 7.86-.73 3.77-.97 9.41-4.82 12.87-7.79 1.36-1.21 3.03-3.4 3.65-4.89.76-1.92-.69-21.77-.81-24.66-.33-8.38 1.86-49.69 2.93-65.82.42-8.16.84-23.66.83-31.95-.27-10.62-1.13-23.42-2.16-32.86-2.13-17.34-7.13-46.6-9.52-55.34-1.81-6.64-6.99-25.48-8.79-29.92-1.49-3.57-4.75-8.15-7.21-9.94-4.1-3-13.72-16.24-18.94-23.99-7.87-12.17-14.31-21.4-19.11-26.86-2.77-3.1-9.71-9.07-13.22-10.82-3.42-1.65-19.05-5.32-27.11-6.37-3.85-.53-9.95-2.52-12.67-4.13-2.42-1.46-8.91-7.36-10.81-8.77-2.4-1.77-7.4-5.11-11.54-7.43-3.35-1.94-7.03-6.17-8.09-8.79-.96-2.49-1.85-7.95-1.83-11.48.08-6.68 2.66-24.35 3.96-32.06 2.77-15.23 4.26-25.82 4.06-32.81-.14-3.9-1.5-11.96-3.12-15.65-1.84-4.04-6.14-8.54-10.49-12.05-2.26-1.81-8.51-6.28-12.11-8-3.35-1.55-11.36-2.88-13.64-2.78Z"
    />
  </svg>
);
export default SvgBodyOutlineBack;
