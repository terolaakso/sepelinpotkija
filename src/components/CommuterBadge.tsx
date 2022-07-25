export interface CommuterBadgeProps {
  lineId: string | null;
}

export default function CommuterBadge({ lineId }: CommuterBadgeProps) {
  if (!lineId) {
    return null;
  }
  return (
    <span>
      <small className="bg-gray-300 text-gray-900 px-1 rounded-sm mr-1">{lineId}</small>
    </span>
  );
}
