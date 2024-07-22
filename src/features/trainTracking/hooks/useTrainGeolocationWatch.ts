import { isNil } from 'lodash';
import { useEffect, useRef } from 'react';

import { useTrainDataStore } from '@/stores/trainData';
import { TrainLocation } from '@/types/TrainLocation';
import { isNotNil } from '@/utils/misc';
import { adjustTimetableByLocation } from '@/utils/timetableCalculation';

import useGeolocationWatchPosition from '../hooks/useGeolocationWatchPosition';
import { transformGeolocation } from '../utils/locations';

export default function useTrainGeolocationWatch(
  departureDate: string | null,
  trainNumber: number | null,
  onLocationReceived?: (newLocation: TrainLocation) => void
) {
  const getTrain = useTrainDataStore((state) => state.getTrain);
  const setTrain = useTrainDataStore((state) => state.setTrain);
  const setLocation = useTrainDataStore((state) => state.setLocation);

  const savedOnLocationReceived = useRef(onLocationReceived);
  useEffect(() => {
    savedOnLocationReceived.current = onLocationReceived;
  }, [onLocationReceived]);

  const isWatching = isNotNil(departureDate) && isNotNil(trainNumber);

  useGeolocationWatchPosition(isWatching, (receivedLocation) => {
    if (isNil(departureDate) || isNil(trainNumber)) {
      return;
    }
    const location = transformGeolocation(departureDate, trainNumber, receivedLocation);
    setLocation(location);
    const train = getTrain(departureDate, trainNumber);
    if (train) {
      const adjustmentResult = adjustTimetableByLocation(train, location);
      setTrain(adjustmentResult.train);
      savedOnLocationReceived.current?.(location);
    }
  });
}
