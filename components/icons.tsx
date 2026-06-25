import type { SVGProps } from "react";

/* 24×24 viewBox, stroke=currentColor, 1.8 stroke weight, round caps/joins.
   Ported 1:1 from the Octopus Ink design prototype. */

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = { viewBox: "0 0 24 24", fill: "none" };

export const FolderIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

export const FileIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M6 3h8l4 4v14H6z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M14 3v4h4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

export const PlusIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

export const ImportIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M12 3v9m0 0 3.5-3.5M12 12 8.5 8.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 14v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const NewDocIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M6 3h8l4 4v14H6z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M14 3v4h4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M12 11.5v5M9.5 14h5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const FolderArrowIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 13h5m0 0-2-2m2 2-2 2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SearchIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="m20 20-3.5-3.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M14 6l-6 6 6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const EyeIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const CodeIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M9 8l-4 4 4 4M15 8l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SparkIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

export const CaretDownIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M6 9l6 6 6-6"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SaveIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M5 5h11l3 3v11H5z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M8 5v5h7V6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <rect x="8" y="14" width="8" height="5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export const DownloadIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PdfIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M6 3h8l4 4v14H6z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path
      d="M14 3v4h4"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path
      d="M9 14h6M9 17h4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const CopyIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M5 15V6a2 2 0 0 1 2-2h9"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const UndoIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M8 8H5V5M5 8a9 9 0 1 1-2 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const RedoIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M16 8h3V5M19 8a9 9 0 1 0 2 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ListIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M8 7h12M8 12h12M8 17h9M4 7h.01M4 12h.01M4 17h.01"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const OrderedListIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M10 7h10M10 12h10M10 17h10"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M4 6h1v4M4 10h2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 18H4c0-1 2-1.4 2-2.4S5 14.2 4 14.6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const QuoteIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M9 7c-2 1-3 3-3 6h3v4H4v-5c0-3 1.5-5 5-5zM19 7c-2 1-3 3-3 6h3v4h-5v-5c0-3 1.5-5 5-5z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const TextColorIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M5.5 15 10 5h1l4.5 10M7 12h6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="4" y="18" width="16" height="2.6" rx="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const HighlightIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="m9 11-6 6v3h9l3-3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const LinkIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path
      d="M10 14a3 3 0 0 0 4 0l3-3a3 3 0 0 0-4-4l-1 1M14 10a3 3 0 0 0-4 0l-3 3a3 3 0 0 0 4 4l1-1"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

export const ImageIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="9" cy="10" r="1.6" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="m5 17 5-4 4 3 3-2 2 2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);
