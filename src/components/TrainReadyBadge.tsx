export interface TrainReadyBadgeProps {
  isReady: boolean;
}

export default function TrainReadyBadge({ isReady }: TrainReadyBadgeProps) {
  if (!isReady) {
    return null;
  }
  return <small className="rounded-full border-gray-300 border-1 px-1 h-max">Lähtövalmis</small>;
}
