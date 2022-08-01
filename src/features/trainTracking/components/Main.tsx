import { useState } from 'react';

import ErrorBar from '@/components/ErrorBar';
import { useInterval } from '@/hooks/useInterval';
import useStationWatch from '@/hooks/useStationWatch';
import { useTrainDataStore } from '@/stores/trainData';

import useTrackSegmentExtras from '../hooks/useTrackSegmentExtras';
import useTrain from '../hooks/useTrain';
import useTrainLocationWatch from '../hooks/useTrainDigitrafficLocationWatch';
import { TrainEvent } from '../types/TrainEvent';
import { calculateCurrentEventsForTrain } from '../utils/trainTracking';

import BottomBar from './BottomBar';
import Content from './Content';
import TopBar from './TopBar';

export default function TrainTracking() {
  const [trainNumber, setTrainNumber] = useState(1);
  const [events, setEvents] = useState<TrainEvent[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nextStationCode, setNextStationCode] = useState<string | null>(null);
  const [nextTrain, setNextTrain] = useState<{
    departureDate: string | null;
    trainNumber: number | null;
  }>({ departureDate: null, trainNumber: null });

  const getTrain = useTrainDataStore((state) => state.getTrain);

  const departureDate = useTrain(isTracking ? trainNumber ?? null : null, null, true);
  useStationWatch(isTracking ? nextStationCode : null);
  useTrainLocationWatch(
    isTracking ? nextTrain.departureDate : null,
    isTracking ? nextTrain.trainNumber : null
  );
  useTrackSegmentExtras();

  const train = getTrain(departureDate, trainNumber);

  useInterval(
    () => {
      const { events, nextStationCode, nextTrain } = train
        ? calculateCurrentEventsForTrain(train)
        : { events: [], nextStationCode: null, nextTrain: null };
      setEvents(events);
      setNextStationCode(nextStationCode);
      setNextTrain(
        nextTrain
          ? { departureDate: nextTrain.departureDate, trainNumber: nextTrain.trainNumber }
          : { departureDate: null, trainNumber: null }
      );
    },
    isTracking ? 1000 : null
  );

  async function startTracking(trainNumber: number) {
    setTrainNumber(trainNumber);
    setErrorMessage(null);
    setIsTracking(true);
    setEvents([]);
  }

  async function stopTracking() {
    setIsTracking(false);
  }

  return (
    <div className="h-screen bg-gray-900 text-gray-300 flex flex-col">
      <TopBar startTracking={startTracking} train={train} isTracking={isTracking} />
      <ErrorBar errorMessage={errorMessage} />
      <Content events={events} />
      <BottomBar isTracking={isTracking} stopTracking={stopTracking} />
    </div>
  );
}
