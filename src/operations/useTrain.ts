import { isNil } from 'lodash';
import { useContext, useEffect, useRef, useState } from 'react';
import { TrainContext, TrainContextProps } from '../components/TrainData';
import { getTrain } from '../model/digitrafficClient';
import { fillNewTrainWithDetails } from '../model/timetableCalculation';
import useTrainLocationWatch from './useTrainLocationWatch';
import useTrainWatch from './useTrainWatch';

export default function useTrain(trainNumber: number | null, departureDate?: string | null) {
  const trainDataRef = useRef<TrainContextProps>();
  const trainDataContext = useContext(TrainContext);
  const [followedDepartureDate, setFollowedDepartureDate] = useState<string | null>(null);

  useEffect(() => {
    trainDataRef.current = trainDataContext;
  }, [trainDataContext]);

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
      const fixedTrain = trainDataRef.current
        ? fillNewTrainWithDetails(train, trainDataRef.current)
        : train;
      setFollowedDepartureDate(fixedTrain.departureDate);
      trainDataRef.current?.setTrain(fixedTrain);
    }

    setFollowedDepartureDate(departureDate ?? null);
    fetchTrain();
  }, [departureDate, trainNumber]);

  useTrainLocationWatch(followedDepartureDate, trainNumber);
  useTrainWatch(followedDepartureDate, trainNumber);

  return followedDepartureDate;
}
