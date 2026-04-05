interface StatusBadgeProps {
  status: 'draft' | 'processing' | 'completed';
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const variants = {
    draft: {
      bg: 'bg-gray-100 border border-gray-200',
      text: 'text-gray-600',
      label: label || 'Brouillon',
    },
    processing: {
      bg: 'bg-amber-50 border border-amber-200',
      text: 'text-amber-700',
      label: label || 'En cours',
    },
    completed: {
      bg: 'bg-emerald-50 border border-emerald-200',
      text: 'text-emerald-700',
      label: label || 'Termine',
    },
  };

  const variant = variants[status];

  return (
    <span className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${variant.bg} ${variant.text}`}>
      {variant.label}
    </span>
  );
}
