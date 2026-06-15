'use client';

interface BranchBadgeProps {
  code?: string;
}

export default function BranchBadge({ code }: BranchBadgeProps) {
  if (!code) return null;

  const label = code.length <= 3 ? code : code.slice(0, 2).toUpperCase();

  return (
    <span
      className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-orange-100 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700"
      title={code}
    >
      {label}
    </span>
  );
}
