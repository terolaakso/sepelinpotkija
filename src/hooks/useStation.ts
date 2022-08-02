import { isNil } from 'lodash';
import { DateTime } from 'luxon';
import { useRef, useState } from 'react';

import { getTrainsOfStation } from '@/api/digitrafficClient';
import { transformTrains } from '@/api/transform';
import { useSubscription } from '@/features/mqtt';
import { useTrainDataStore } from '@/stores/trainData';
import { Train as DigitrafficTrain } from '@/types/digitraffic';
import { isNotNil } from '@/utils/misc';
import { adjustWithLocationFromStore } from '@/utils/timetableCalculation';

import { useInterval } from './useInterval';

const FETCH_INTERVAL_MINUTES = 5;

export default function useStation(stationCode: string | null) {
  const previousFetchTimestampRef = useRef(DateTime.fromMillis(0));
  const [currentStation, setCurrentStation] = useState('');
  const setTrain = useTrainDataStore((state) => state.setTrain);
  const setTrains = useTrainDataStore((state) => state.setTrains);

  useSubscription<DigitrafficTrain>(
    isNotNil(stationCode) ? `trains-by-station/${stationCode}` : null,
    (receivedTrain) => {
      if (isNil(stationCode)) {
        return;
      }
      const train = transformTrains([receivedTrain])[0];
      const fixedTrain = adjustWithLocationFromStore(train);
      setTrain(fixedTrain);
    }
  );

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
      const fixedTrains = trains.map(adjustWithLocationFromStore);
      setTrains(fixedTrains);
    },
    stationCode !== null ? 1000 : null
  );
}
