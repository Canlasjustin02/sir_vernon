import { type JSX } from "react";

type PageFooterProps = {
  className?: string;
};

export default function PageFooter({ className = "" }: PageFooterProps): JSX.Element {
  return (
    <footer
      className={`w-full border-t border-slate-200 bg-white/80 p-4 flex items-center justify-center h-full ${className}`}
      aria-hidden="true"
    >
      <div className="h-0" />
    </footer>
  );
}