import { isNil } from 'lodash';

import { transformTrains } from '@/api/transform';
import { useSubscription } from '@/features/mqtt';
import { useTrainDataStore } from '@/stores/trainData';
import { Train as DigitrafficTrain } from '@/types/digitraffic';
import { isNotNil } from '@/utils/misc';
import { fillNewTrainWithDetails } from '@/utils/timetableCalculation';

export default function useTrainWatch(departureDate: string | null, trainNumber: number | null) {
  const setTrain = useTrainDataStore((state) => state.setTrain);

  useSubscription<DigitrafficTrain>(
    isNotNil(departureDate) && isNotNil(trainNumber)
      ? `trains/${departureDate}/${trainNumber}/#`
      : null,
    (receivedTrain) => {
      if (isNil(departureDate) || isNil(trainNumber)) {
        return;
      }
      const transformedTrain = transformTrains([receivedTrain])[0];
      const fixedTrain = fillNewTrainWithDetails(transformedTrain);
      setTrain(fixedTrain);
    }
  );
}
