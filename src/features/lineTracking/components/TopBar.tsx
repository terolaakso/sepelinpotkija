import { useTrainDataStore } from '@/stores/trainData';
import { Station } from '@/types/Station';

import LineInputForm from './LineInputForm';

export interface TopBarProps {
  isTracking: boolean;
  trackedStationCode1: string | null;
  trackedStationCode2: string | null;
  location: number;
  startTracking: (station1: Station, station2: Station, location: number) => void;
}

export default function TopBar({
  isTracking,
  startTracking,
  trackedStationCode1,
  trackedStationCode2,
  location,
}: TopBarProps) {
  const stationCollection = useTrainDataStore.getState().stations;
  const selectedStation1 = stationCollection[trackedStationCode1 ?? ''];
  const selectedStation2 = stationCollection[trackedStationCode2 ?? ''];

  return (
    <div className="bg-gray-800">
      {!isTracking ? (
        <LineInputForm
          trackedStationCode1={trackedStationCode1}
          trackedStationCode2={trackedStationCode2}
          trackedLocation={location}
          startTracking={startTracking}
        />
      ) : (
        <div className="flex gap-1 px-1">
          <div>{selectedStation1?.name}</div>
          <div className="flex flex-1">
            <div style={{ flex: location }}></div>
            <div>❋</div>
            <div style={{ flex: 100 - location }}></div>
          </div>
          <div>{selectedStation2?.name}</div>
        </div>
      )}
    </div>
  );
}
