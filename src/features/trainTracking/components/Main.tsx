import { useState } from 'react';

import ErrorBar from '@/components/ErrorBar';
import { useInterval } from '@/hooks/useInterval';
import useStation from '@/hooks/useStation';
import { useTrainDataStore } from '@/stores/trainData';

import BottomBar from '../../../components/BottomBar';
import useTrackSegmentExtras from '../hooks/useTrackSegmentExtras';
import useTrain from '../hooks/useTrain';
import useTrainDigitrafficLocationWatch from '../hooks/useTrainDigitrafficLocationWatch';
import { TrackingEvent } from '../types/TrackingEvent';
import { calculateCurrentEventsForTrain } from '../utils/trainTracking';

import Content from './Content';
import TopBar from './TopBar';

export default function TrainTracking() {
  const [trainNumber, setTrainNumber] = useState(1);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nextStationCode, setNextStationCode] = useState<string | null>(null);
  const [nextTrain, setNextTrain] = useState<{
    departureDate: string | null;
    trainNumber: number | null;
  }>({ departureDate: null, trainNumber: null });

  const getTrain = useTrainDataStore((state) => state.getTrain);

  const departureDate = useTrain(isTracking ? trainNumber ?? null : null, null, true);
  useStation(isTracking ? nextStationCode : null);
  useTrainDigitrafficLocationWatch(
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

  function startTracking(trainNumber: number) {
    setTrainNumber(trainNumber);
    setErrorMessage(null);
    setIsTracking(true);
    setEvents([]);
    setNextStationCode(null);
    setNextTrain({ departureDate: null, trainNumber: null });
  }

  function stopTracking() {
    setIsTracking(false);
  }

  return (
    <div className="h-screen flex flex-col">
      <TopBar startTracking={startTracking} train={train} isTracking={isTracking} />
      <ErrorBar errorMessage={errorMessage} />
      <Content events={events} />
      <BottomBar isTracking={isTracking} stopTracking={stopTracking} />
    </div>
  );
}
