interface StatBlockProps {
  value: string;
  label: string;
}

export function StatBlock({ value, label }: StatBlockProps) {
  return (
    <div className="text-center">
      <div className="text-4xl sm:text-5xl font-bold text-brand-green mb-2">
        {value}
      </div>
      <div className="text-gray-500 text-sm sm:text-base">
        {label}
      </div>
    </div>
  );
}
