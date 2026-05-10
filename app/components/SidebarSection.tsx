import { useState } from "react";

export function SidebarSection({
  label,
  children,
  defaultCollapsed = false,
}: {
  label: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="border-b border-outline-variant">
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 pt-2 pb-1 text-2xs text-outline-variant uppercase tracking-[0.04em] hover:text-on-surface-variant transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span>{label}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ${collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"}`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
