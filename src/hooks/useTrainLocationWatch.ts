import { isNil } from 'lodash';
import { useContext, useEffect, useRef } from 'react';

import { getLocation } from '@/api/digitrafficClient';
import { transformLocation } from '@/api/transform';
import { getTrainFromContext, TrainContext, TrainContextProps } from '@/components/TrainData';
import { useSubscription } from '@/features/mqtt';
import { GpsLocation } from '@/types/digitraffic';
import { isNotNil } from '@/utils/misc';
import { adjustTimetableByLocation, fillNewTrainWithDetails } from '@/utils/timetableCalculation';

export default function useTrainLocationWatch(
  departureDate: string | null,
  trainNumber: number | null
) {
  const trainDataRef = useRef<TrainContextProps>();
  const trainDataContext = useContext(TrainContext);

  useEffect(() => {
    trainDataRef.current = trainDataContext;
  }, [trainDataContext]);

  useSubscription<GpsLocation>(
    isNotNil(departureDate) && isNotNil(trainNumber)
      ? `train-locations/${departureDate}/${trainNumber}`
      : null,
    (receivedLocation) => {
      if (isNil(departureDate) || isNil(trainNumber)) {
        return;
      }
      const location = transformLocation(receivedLocation);
      trainDataRef.current?.setLocation(location);
      const train = getTrainFromContext(departureDate, trainNumber, trainDataRef.current ?? null);
      if (train) {
        const fixedTrain = trainDataRef.current
          ? fillNewTrainWithDetails(train, trainDataRef.current)
          : train;
        trainDataRef.current?.setTrain(fixedTrain);
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
      trainDataRef.current?.setLocation(latestLocation);
      const train = getTrainFromContext(departureDate, trainNumber, trainDataRef.current ?? null);
      if (train) {
        const fixedTrain = adjustTimetableByLocation(
          train,
          latestLocation,
          trainDataRef.current?.stations ?? {}
        );
        trainDataRef.current?.setTrain(fixedTrain);
      }
    }
    fetchLocation();
  }, [departureDate, trainNumber]);
}
