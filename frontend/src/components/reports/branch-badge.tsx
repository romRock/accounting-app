'use client';

interface BranchBadgeProps {
  code?: string;
}

export default function BranchBadge({ code }: BranchBadgeProps) {
  if (!code) return null;

  return (
    <span
      className="ml-2 inline-flex items-center rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700"
      title={`Branch: ${code}`}
    >
      {code}
    </span>
  );
}
