import { DateTime } from 'luxon';
import { useContext, useEffect, useRef, useState } from 'react';

import { TrainContext, TrainContextProps } from '@/components/TrainData';
import { getTrainsOfStation } from '@/types/digitrafficClient';
import { fillNewTrainWithDetails } from '@/types/timetableCalculation';

import { useInterval } from './useInterval';

const FETCH_INTERVAL_MINUTES = 1;

export default function useStationWatch(stationCode: string | null) {
  const trainDataRef = useRef<TrainContextProps>();
  const trainDataContext = useContext(TrainContext);
  const previousFetchTimestampRef = useRef(DateTime.fromMillis(0));
  const [currentStation, setCurrentStation] = useState('');

  useEffect(() => {
    trainDataRef.current = trainDataContext;
  }, [trainDataContext]);

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
        const fixedTrain = trainDataRef.current
          ? fillNewTrainWithDetails(train, trainDataRef.current)
          : train;
        trainDataRef.current?.setTrain(fixedTrain);
      });
    },
    stationCode !== null ? 1000 : null
  );
}
