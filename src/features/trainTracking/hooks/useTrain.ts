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
  const connectionRestored = useTrainDataStore((state) => state.connectionRestoredTimestamp);

  useEffect(() => {
    async function fetchTrain() {
      if (isNil(trainNumber)) {
        setFollowedDepartureDate(null);
        return;
      }
      const train = await getTrain(trainNumber, departureDate ?? undefined);
      if (isNil(train)) {
        return;
      }
      const fixedTrain = adjustWithLocationFromStore(train);
      setFollowedDepartureDate(fixedTrain.departureDate);
      setTrain(fixedTrain);
    }

    setFollowedDepartureDate(departureDate);
    fetchTrain();
  }, [departureDate, trainNumber, setTrain, connectionRestored]);

  useTrainDigitrafficWatch(followedDepartureDate, trainNumber);
  useTrainLocationWatch(followedDepartureDate, trainNumber, true, useDeviceLocationForTrain);

  return followedDepartureDate;
}
