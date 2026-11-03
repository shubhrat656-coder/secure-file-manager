const MAP = {
  pending_l1: { label: 'Pending · Level 1', cls: 'bg-amber-100 text-amber-800' },
  pending_l2: { label: 'Pending · Level 2', cls: 'bg-orange-100 text-orange-800' },
  pending_manager: { label: 'Pending · Manager', cls: 'bg-purple-100 text-purple-800' },
  approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rejected', cls: 'bg-rose-100 text-rose-800' },
};

export default function StatusBadge({ status }) {
  const s = MAP[status] || { label: status, cls: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}
