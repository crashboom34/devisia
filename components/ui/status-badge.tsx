interface StatusBadgeProps {
  status: 'draft' | 'processing' | 'completed';
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const variants = {
    draft: {
      bg: 'bg-slate-500/15 border border-slate-500/30',
      text: 'text-slate-300',
      label: label || 'Brouillon',
    },
    processing: {
      bg: 'bg-amber-500/15 border border-amber-500/30',
      text: 'text-amber-400',
      label: label || 'En cours',
    },
    completed: {
      bg: 'bg-emerald-500/15 border border-emerald-500/30',
      text: 'text-emerald-400',
      label: label || 'Terminé',
    },
  };

  const variant = variants[status];

  return (
    <span className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${variant.bg} ${variant.text}`}>
      {variant.label}
    </span>
  );
}
