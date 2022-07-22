import { isNil } from 'lodash';
import { useEffect, useState } from 'react';

import { getTrain } from '@/api/digitrafficClient';
import { useTrainDataStore } from '@/stores/trainData';
import { adjustWithLocationFromStore } from '@/utils/timetableCalculation';

import useTrainLocationWatch from './useTrainLocationWatch';
import useTrainWatch from './useTrainWatch';

export default function useTrain(trainNumber: number | null, departureDate?: string | null) {
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
    console.log(new Date().toLocaleTimeString(), 'Calling useTrain/useEffect');
    setFollowedDepartureDate(departureDate ?? null);
    fetchTrain();
  }, [departureDate, trainNumber, setTrain]);

  useTrainLocationWatch(followedDepartureDate, trainNumber);
  useTrainWatch(followedDepartureDate, trainNumber);

  return followedDepartureDate;
}
