import { isNil } from 'lodash';
import { DateTime, Duration } from 'luxon';

import { getLocation } from '@/api/digitrafficClient';
import { useInterval } from '@/hooks/useInterval';
import { useTrainDataStore } from '@/stores/trainData';
import { isNotNil } from '@/utils/misc';
import { adjustTimetableByLocation } from '@/utils/timetableCalculation';

const STALLED_THRESHOLD = Duration.fromDurationLike({ minutes: 1 });

export default function useStalledTrainsRescue(checkIntervalMs: number | null) {
  const getTrain = useTrainDataStore((state) => state.getTrain);
  const setTrain = useTrainDataStore((state) => state.setTrain);
  const setLocation = useTrainDataStore((state) => state.setLocation);

  useInterval(async () => {
    async function fetchAndStoreLocation(departureDate: string, trainNumber: number) {
      const latestLocation = await getLocation(trainNumber);
      if (isNil(latestLocation)) {
        return;
      }
      setLocation(latestLocation);
      const train = getTrain(departureDate, trainNumber);
      if (isNotNil(train)) {
        const adjustmentResult = adjustTimetableByLocation(train, latestLocation);
        setTrain(adjustmentResult.train);
      }
    }

    const now = DateTime.now();
    const oldGpsFixLimit = now.minus(STALLED_THRESHOLD);
    const trains = Object.values(useTrainDataStore.getState().trains).filter(isNotNil);
    const stalledTrains = trains
      .filter((train) => {
        return isNil(train.gpsFixAttemptTimestamp) || train.gpsFixAttemptTimestamp < oldGpsFixLimit;
      })
      .filter((train) => {
        const index = train.latestActualTimeIndex + 1;

        if (index < train.timetableRows.length) {
          return train.timetableRows[index].time.plus(STALLED_THRESHOLD) < now;
        }
        return false;
      });
    if (stalledTrains.length > 0) {
      console.log(
        new Date().toLocaleTimeString(),
        'Rescuing stalled trains:',
        stalledTrains.map((train) => train.trainNumber)
      );
    }
    const updates = stalledTrains.map((train) =>
      fetchAndStoreLocation(train.departureDate, train.trainNumber)
    );
    await Promise.allSettled(updates);
  }, checkIntervalMs);
}
