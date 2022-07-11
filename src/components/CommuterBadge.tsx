export interface CommuterBadgeProps {
  lineId: string | null;
}

export default function CommuterBadge({ lineId }: CommuterBadgeProps) {
  if (!lineId) {
    return null;
  }
  return <small className="bg-gray-300 text-gray-900 pl-1 pr-1 rounded-sm mr-1">{lineId}</small>;
}
