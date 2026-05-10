export function SidebarItem({
  label,
  count,
  meta,
}: {
  label: string;
  count?: number;
  meta?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-1 text-xs text-on-surface-variant">
      <span>{label}</span>
      <span className="flex gap-1.5 text-outline text-xs">
        {meta && <span className="text-primary">{meta}</span>}
        {count !== undefined && count > 0 && <span>{count} atrib</span>}
      </span>
    </div>
  );
}
