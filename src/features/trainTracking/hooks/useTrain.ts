import { isNil } from 'lodash';
import { useEffect, useState } from 'react';

import { getTrain } from '@/api/digitrafficClient';
import { useTrainDataStore } from '@/stores/trainData';
import { adjustWithLocationFromStore } from '@/utils/timetableCalculation';

import useTrainDigitrafficWatch from './useTrainDigitrafficWatch';
import useTrainLocationWatch from './useTrainLocationWatch';

export default function useTrain(
  trainNumber: number | null,
  departureDate: string | null,
  useDeviceLocationForTrain: boolean
) {
  const [followedDepartureDate, setFollowedDepartureDate] = useState<string | null>(null);
  const setTrain = useTrainDataStore((state) => state.setTrain);
  const setTrackedTrain = useTrainDataStore((state) => state.setTrackedTrain);
  const connectionRestored = useTrainDataStore((state) => state.connectionRestoredTimestamp);

  useEffect(() => {
    async function fetchTrain() {
      if (isNil(trainNumber)) {
        setFollowedDepartureDate(null);
        setTrackedTrain(null);
        return;
      }
      const train = await getTrain(trainNumber, departureDate ?? undefined);
      if (isNil(train)) {
        return;
      }
      setTrackedTrain(train);
      const fixedTrain = adjustWithLocationFromStore(train);
      setFollowedDepartureDate(fixedTrain.departureDate);
      setTrain(fixedTrain);
    }

    setFollowedDepartureDate(departureDate);
    fetchTrain();
  }, [departureDate, trainNumber, setTrain, setTrackedTrain, connectionRestored]);

  useTrainDigitrafficWatch(followedDepartureDate, trainNumber);
  useTrainLocationWatch(followedDepartureDate, trainNumber, true, useDeviceLocationForTrain);

  return followedDepartureDate;
}
