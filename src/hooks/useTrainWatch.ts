import { isNil } from 'lodash';
import { useContext, useEffect, useRef } from 'react';

import { transformTrains } from '@/api/transform';
import { TrainContext, TrainContextProps } from '@/components/TrainData';
import { useSubscription } from '@/features/mqtt';
import { Train as DigitrafficTrain } from '@/types/digitraffic';
import { isNotNil } from '@/utils/misc';
import { fillNewTrainWithDetails } from '@/utils/timetableCalculation';

export default function useTrainWatch(departureDate: string | null, trainNumber: number | null) {
  const trainDataRef = useRef<TrainContextProps>();
  const trainDataContext = useContext(TrainContext);

  useEffect(() => {
    trainDataRef.current = trainDataContext;
  }, [trainDataContext]);

  useSubscription<DigitrafficTrain>(
    isNotNil(departureDate) && isNotNil(trainNumber)
      ? `trains/${departureDate}/${trainNumber}/#`
      : null,
    (receivedTrain) => {
      if (isNil(departureDate) || isNil(trainNumber)) {
        return;
      }
      const transformedTrain = transformTrains([receivedTrain])[0];
      const fixedTrain = trainDataRef.current
        ? fillNewTrainWithDetails(transformedTrain, trainDataRef.current)
        : transformedTrain;
      trainDataRef.current?.setTrain(fixedTrain);
    }
  );
}
