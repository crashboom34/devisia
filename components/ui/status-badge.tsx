interface StatusBadgeProps {
  status: 'draft' | 'processing' | 'completed';
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const variants = {
    draft: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      label: label || 'Brouillon',
    },
    processing: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      label: label || 'En cours',
    },
    completed: {
      bg: 'bg-green-100',
      text: 'text-status-success',
      label: label || 'Terminé',
    },
  };

  const variant = variants[status];

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${variant.bg} ${variant.text}`}>
      {variant.label}
    </span>
  );
}
