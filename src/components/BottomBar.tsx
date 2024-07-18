export interface BottomBarProps {
  isTracking: boolean;
  stopTracking: () => void;
}

export default function BottomBar({ isTracking, stopTracking }: BottomBarProps) {
  return (
    <div className="bg-gray-800">
      {isTracking && (
        <div className="flex justify-around">
          <button type="button" className="px-2 border-0" onClick={stopTracking}>
            Stop
          </button>
        </div>
      )}
    </div>
  );
}
