import { DateTime } from 'luxon';
import { useRef, useState } from 'react';

import { getTrainsOfStation } from '@/api/digitrafficClient';
import { useTrainDataStore } from '@/stores/trainData';
import { adjustWithLocationFromStore } from '@/utils/timetableCalculation';

import { useInterval } from './useInterval';

const FETCH_INTERVAL_MINUTES = 1;

export default function useStationWatch(stationCode: string | null) {
  const previousFetchTimestampRef = useRef(DateTime.fromMillis(0));
  const [currentStation, setCurrentStation] = useState('');
  const setTrain = useTrainDataStore((state) => state.setTrain);

  useInterval(
    async () => {
      const now = DateTime.now();
      if (
        stationCode === null ||
        (stationCode === currentStation &&
          now.diff(previousFetchTimestampRef.current).as('minutes') < FETCH_INTERVAL_MINUTES)
      ) {
        return;
      }
      console.log(new Date().toLocaleTimeString(), `Fetching trains for station ${stationCode}`);
      previousFetchTimestampRef.current = now;
      setCurrentStation(stationCode);
      const trains = await getTrainsOfStation(stationCode);
      trains.forEach((train) => {
        const fixedTrain = adjustWithLocationFromStore(train);
        setTrain(fixedTrain);
      });
    },
    stationCode !== null ? 1000 : null
  );
}
