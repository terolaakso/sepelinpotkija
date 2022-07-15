import { isNil } from 'lodash';
import { useEffect } from 'react';

import { getLocation } from '@/api/digitrafficClient';
import { transformLocation } from '@/api/transform';
import { useSubscription } from '@/features/mqtt';
import { getTrainFromStore, useTrainDataStore } from '@/stores/trainData';
import { GpsLocation } from '@/types/digitraffic';
import { isNotNil } from '@/utils/misc';
import { adjustTimetableByLocation, fillNewTrainWithDetails } from '@/utils/timetableCalculation';

export default function useTrainLocationWatch(
  departureDate: string | null,
  trainNumber: number | null
) {
  const setTrain = useTrainDataStore((state) => state.setTrain);
  const setLocation = useTrainDataStore((state) => state.setLocation);

  useSubscription<GpsLocation>(
    isNotNil(departureDate) && isNotNil(trainNumber)
      ? `train-locations/${departureDate}/${trainNumber}`
      : null,
    (receivedLocation) => {
      if (isNil(departureDate) || isNil(trainNumber)) {
        return;
      }
      const location = transformLocation(receivedLocation);
      setLocation(location);
      const train = getTrainFromStore(departureDate, trainNumber);
      if (train) {
        const fixedTrain = fillNewTrainWithDetails(train);
        setTrain(fixedTrain);
      }
    }
  );

  useEffect(() => {
    async function fetchLocation() {
      if (isNil(departureDate) || isNil(trainNumber)) {
        return;
      }
      console.log(new Date().toLocaleTimeString(), 'Fetching initial location');

      const latestLocation = await getLocation(trainNumber);
      if (!latestLocation) {
        return;
      }
      setLocation(latestLocation);
      const train = getTrainFromStore(departureDate, trainNumber);
      if (train) {
        const fixedTrain = adjustTimetableByLocation(train, latestLocation);
        setTrain(fixedTrain);
      }
    }
    fetchLocation();
  }, [departureDate, trainNumber, setLocation, setTrain]);
}
