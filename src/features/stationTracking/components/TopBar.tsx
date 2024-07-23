import { isNil } from 'lodash';
import { useEffect, useState } from 'react';

import StationPicker from '@/components/StationPicker';
import { useTrainDataStore } from '@/stores/trainData';
import { Station } from '@/types/Station';
import { getCurrentLocation } from '@/utils/geolocation';
import { isNotNil } from '@/utils/misc';
import { getNearestStations } from '@/utils/stations';

export interface TopBarProps {
  isTracking: boolean;
  trackedStationCode: string | null;
  startTracking: (station: Station) => void;
}

export default function TopBar({ isTracking, trackedStationCode, startTracking }: TopBarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [didFetchNearestStations, setDidFetchNearestStations] = useState(false);
  const [nearestStations, setNearestStations] = useState<Station[]>([]);
  const stationCollection = useTrainDataStore.getState().stations;
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  useEffect(() => {
    async function getLocation() {
      try {
        setIsLoading(true);
        const position = await getCurrentLocation();
        const top3Stations = getNearestStations(stationCollection, position, 3);
        setNearestStations(top3Stations);
      } catch (error) {
        setNearestStations([]);
      } finally {
        setIsLoading(false);
        setDidFetchNearestStations(true);
      }
    }

    if (Object.values(stationCollection).length > 0) {
      if (!isTracking && !didFetchNearestStations) {
        getLocation();
      } else if (isNotNil(trackedStationCode) && isNil(selectedStation)) {
        const station = stationCollection[trackedStationCode];
        if (isNotNil(station)) {
          setSelectedStation(station);
        }
      }
    }
  }, [stationCollection, trackedStationCode, selectedStation, isTracking, didFetchNearestStations]);

  function onStartTrackingClick() {
    if (isNotNil(selectedStation)) {
      startTracking(selectedStation);
    }
  }

  return (
    <div className="bg-gray-800 px-1">
      {!isTracking ? (
        <form className="max-w-screen-xl">
          <div className="flex flex-col mb-1">
            <StationPicker
              id="selectAsema"
              groupName="Lähimmät liikennepaikat"
              isLoading={isLoading}
              selectedStation={selectedStation}
              stationsForGroup={nearestStations}
              onSelectedStationChange={setSelectedStation}
            />
          </div>
          <div className="flex justify-around py-1">
            <button
              type="button"
              onClick={onStartTrackingClick}
              className="bg-gray-700 px-2"
              disabled={isNil(selectedStation)}
            >
              Seuraa
            </button>
          </div>
        </form>
      ) : (
        <div>{selectedStation?.name}</div>
      )}
    </div>
  );
}
