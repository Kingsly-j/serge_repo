import type { ReactNode } from "react";

type IconName = "arrow-down" | "arrow-left" | "arrow-right" | "arrow-up-right" | "check" | "home" | "menu" | "close" | "image-plus" | "plus" | "trash" | "upload";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    "arrow-down": <><path d="M12 4v16"/><path d="m6 14 6 6 6-6"/></>,
    "arrow-left": <><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>,
    "arrow-right": <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
    "arrow-up-right": <><path d="M7 17 17 7"/><path d="M7 7h10v10"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9"/><path d="M9 21v-7h6v7"/></>,
    menu: <><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></>,
    close: <><path d="m18 6-12 12"/><path d="m6 6 12 12"/></>,
    "image-plus": <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/><path d="M19 3v6"/><path d="M16 6h6"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    trash: <><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5"/><path d="M14 11v5"/></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export const ArrowDown = (props: { size?: number }) => <Icon name="arrow-down" {...props} />;
export const ArrowLeft = (props: { size?: number }) => <Icon name="arrow-left" {...props} />;
export const ArrowRight = (props: { size?: number }) => <Icon name="arrow-right" {...props} />;
export const ArrowUpRight = (props: { size?: number }) => <Icon name="arrow-up-right" {...props} />;
export const Check = (props: { size?: number }) => <Icon name="check" {...props} />;
export const Home = (props: { size?: number }) => <Icon name="home" {...props} />;
export const Menu = (props: { size?: number }) => <Icon name="menu" {...props} />;
export const X = (props: { size?: number }) => <Icon name="close" {...props} />;
export const ImagePlus = (props: { size?: number }) => <Icon name="image-plus" {...props} />;
export const Plus = (props: { size?: number }) => <Icon name="plus" {...props} />;
export const Trash2 = (props: { size?: number }) => <Icon name="trash" {...props} />;
export const Upload = (props: { size?: number }) => <Icon name="upload" {...props} />;
