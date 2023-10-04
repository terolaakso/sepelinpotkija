import { isNil } from 'lodash';
import { useEffect, useRef, useState } from 'react';

import { getLocation } from '@/api/digitrafficClient';
import { transformLocation } from '@/api/transform';
import { useSubscription } from '@/features/mqtt';
import { useTrainDataStore } from '@/stores/trainData';
import { GpsLocation } from '@/types/digitraffic';
import { TrainLocation } from '@/types/TrainLocation';
import { LatLon } from '@/utils/geography';
import { isNotNil } from '@/utils/misc';
import { adjustTimetableByLocation } from '@/utils/timetableCalculation';

export default function useTrainDigitrafficLocationWatch(
  departureDate: string | null,
  trainNumber: number | null,
  onLocationReceived?: (newLocation: TrainLocation) => void,
  onInvalidLocationReceived?: () => void
) {
  const [previousLocation, setPreviousLocation] = useState<LatLon | null>(null);
  const getTrain = useTrainDataStore((state) => state.getTrain);
  const setTrain = useTrainDataStore((state) => state.setTrain);
  const setLocation = useTrainDataStore((state) => state.setLocation);

  const savedOnLocationReceived = useRef(onLocationReceived);
  useEffect(() => {
    savedOnLocationReceived.current = onLocationReceived;
  }, [onLocationReceived]);

  useSubscription<GpsLocation>(
    isNotNil(departureDate) && isNotNil(trainNumber)
      ? `train-locations/${departureDate}/${trainNumber}`
      : null,
    (receivedLocation) => {
      if (isNil(departureDate) || isNil(trainNumber)) {
        return;
      }
      const location = transformLocation(receivedLocation);
      if (
        location.location.lat === previousLocation?.lat &&
        location.location.lon === previousLocation?.lon &&
        location.speed > 0
      ) {
        onInvalidLocationReceived?.();
        return;
      }
      setLocation(location);
      setPreviousLocation(location.location);
      const train = getTrain(departureDate, trainNumber);
      if (train) {
        const fixedTrain = adjustTimetableByLocation(train, location);
        setTrain(fixedTrain);
        savedOnLocationReceived.current?.(location);
      }
    }
  );

  useEffect(() => {
    async function fetchLocation() {
      if (isNil(departureDate) || isNil(trainNumber)) {
        return;
      }
      const latestLocation = await getLocation(trainNumber);
      if (!latestLocation) {
        return;
      }
      setLocation(latestLocation);
      const train = getTrain(departureDate, trainNumber);
      if (train) {
        const fixedTrain = adjustTimetableByLocation(train, latestLocation);
        setTrain(fixedTrain);
        savedOnLocationReceived.current?.(latestLocation);
      }
    }
    fetchLocation();
  }, [departureDate, trainNumber, getTrain, setLocation, setTrain]);
}
