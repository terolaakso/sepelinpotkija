import { isNil } from 'lodash';
import { useEffect, useState } from 'react';

import { getTrain } from '@/api/digitrafficClient';
import { useTrainDataStore } from '@/stores/trainData';
import { adjustWithLocationFromStore } from '@/utils/timetableCalculation';

import useTrainWatch from './useTrainDigitrafficWatch';
import useTrainLocationWatch from './useTrainLocationWatch';

export default function useTrain(
  trainNumber: number | null,
  departureDate: string | null,
  useDeviceLocationForTrain: boolean
) {
  const [followedDepartureDate, setFollowedDepartureDate] = useState<string | null>(null);
  const setTrain = useTrainDataStore((state) => state.setTrain);

  useEffect(() => {
    async function fetchTrain() {
      if (isNil(trainNumber)) {
        setFollowedDepartureDate(null);
        return;
      }
      const train = await getTrain(trainNumber, departureDate ?? undefined);
      if (!train) {
        setFollowedDepartureDate(null);
        return;
      }
      const fixedTrain = adjustWithLocationFromStore(train);
      setFollowedDepartureDate(fixedTrain.departureDate);
      setTrain(fixedTrain);
    }

    setFollowedDepartureDate(departureDate ?? null);
    fetchTrain();
  }, [departureDate, trainNumber, setTrain]);

  useTrainWatch(followedDepartureDate, trainNumber);
  useTrainLocationWatch(followedDepartureDate, trainNumber, true, useDeviceLocationForTrain);

  return followedDepartureDate;
}
