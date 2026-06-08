import { isEntryUpdated } from '@/lib/utils';

interface UpdatedEntryBadgeProps {
  createdAt?: string | null;
  updatedAt?: string | null;
  className?: string;
}

export default function UpdatedEntryBadge({
  createdAt,
  updatedAt,
  className = '',
}: UpdatedEntryBadgeProps) {
  if (!isEntryUpdated(createdAt, updatedAt)) return null;

  return (
    <span
      className={`ml-1.5 inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ${className}`}
      title="This entry was updated after creation"
    >
      U
    </span>
  );
}
