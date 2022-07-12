import { useContext, useState } from 'react';

import ErrorBar from '@/components/ErrorBar';
import { getTrainFromContext, TrainContext } from '@/components/TrainData';
import { useInterval } from '@/hooks/useInterval';
import useStationWatch from '@/hooks/useStationWatch';
import useTrain from '@/hooks/useTrain';
import { TrainEvent } from '@/types/TrainEvent';
import { calculateCurrentEventsForTrain } from '@/types/trainTracking';

import BottomBar from './BottomBar';
import Content from './Content';
import TopBar from './TopBar';

export default function TrainTracking() {
  const [trainNumber, setTrainNumber] = useState(1);
  const [events, setEvents] = useState<TrainEvent[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nextStationCode, setNextStationCode] = useState<string | null>(null);
  const trainDataContext = useContext(TrainContext);

  async function startTracking(trainNumber: number) {
    setTrainNumber(trainNumber);
    setErrorMessage(null);
    setIsTracking(true);
  }

  async function stopTracking() {
    setIsTracking(false);
  }

  const departureDate = useTrain(isTracking ? trainNumber ?? null : null);
  useStationWatch(isTracking ? nextStationCode : null);

  const train = getTrainFromContext(departureDate, trainNumber, trainDataContext);

  useInterval(
    () => {
      const { events, nextStationCode } = train
        ? calculateCurrentEventsForTrain(train)
        : { events: [], nextStationCode: null };
      setEvents(events);
      setNextStationCode(nextStationCode);
    },
    isTracking ? 1000 : null
  );

  return (
    <div className="h-screen bg-gray-900 text-gray-300 flex flex-col">
      <TopBar startTracking={startTracking} train={train} isTracking={isTracking} />
      <ErrorBar errorMessage={errorMessage} />
      <Content events={events} />
      <BottomBar isTracking={isTracking} stopTracking={stopTracking} />
    </div>
  );
}
