import { isNil } from 'lodash';
import { DateTime, Duration } from 'luxon';
import { useState } from 'react';

import { getLocation } from '@/api/digitrafficClient';
import { useInterval } from '@/hooks/useInterval';
import { useTrainDataStore } from '@/stores/trainData';
import { isNotNil } from '@/utils/misc';
import { adjustTimetableByLocation } from '@/utils/timetableCalculation';

const STALLED_THRESHOLD = Duration.fromDurationLike({ minutes: 1 });
const STALLED_CHECK_INTERVAL = Duration.fromDurationLike({ minutes: 1 });

export default function useStalledTrainsRescue(checkIntervalMs: number | null) {
  const getTrain = useTrainDataStore((state) => state.getTrain);
  const setTrain = useTrainDataStore((state) => state.setTrain);
  const setLocation = useTrainDataStore((state) => state.setLocation);
  const [previousRun, setPreviousRun] = useState(DateTime.fromMillis(0));

  useInterval(async () => {
    async function fetchAndStoreLocation(departureDate: string, trainNumber: number) {
      const latestLocation = await getLocation(trainNumber);
      if (isNil(latestLocation)) {
        return;
      }
      setLocation(latestLocation);
      const train = getTrain(departureDate, trainNumber);
      if (isNotNil(train)) {
        const fixedTrain = adjustTimetableByLocation(train, latestLocation);
        setTrain(fixedTrain);
      }
    }

    const now = DateTime.now();
    if (now.diff(previousRun) < STALLED_CHECK_INTERVAL) {
      return;
    }
    const trains = Object.values(useTrainDataStore.getState().trains).filter(isNotNil);
    if (trains.length > 0) {
      setPreviousRun(now);
    }
    const stalledTrains = trains.filter((train) => {
      const index = train.latestActualTimeIndex + 1;

      if (index < train.timetableRows.length) {
        return train.timetableRows[index].time.plus(STALLED_THRESHOLD) < now;
      }
      return false;
    });
    const updates = stalledTrains.map((train) =>
      fetchAndStoreLocation(train.departureDate, train.trainNumber)
    );
    await Promise.allSettled(updates);
  }, checkIntervalMs);
}
