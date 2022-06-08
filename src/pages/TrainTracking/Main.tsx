import { useState } from "react";
import { TrainEvent } from "../../model/TrainEvent";
import {
  calculateCountdown,
  calculateCurrentEventsForTrain,
} from "../../model/trainTracking";
import { useInterval } from "../../operations/useInterval";
import useStationWatch from "../../operations/useStationWatch";
import useTrain from "../../operations/useTrain";
import BottomBar from "./BottomBar";
import Content from "./Content";
import TopBar from "./TopBar";

export default function TrainTracking() {
  const [trainNumber, setTrainNumber] = useState(1);
  const [events, setEvents] = useState<TrainEvent[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nextStationCode, setNextStationCode] = useState<string | null>(null);

  async function startTracking(trainNumber: number) {
    setTrainNumber(trainNumber);
    setErrorMessage(null);
    setIsTracking(true);
  }

  async function stopTracking() {
    setIsTracking(false);
  }

  const train = useTrain(isTracking ? trainNumber ?? null : null);
  useStationWatch(isTracking ? nextStationCode : null);

  useInterval(
    () => {
      const { events, nextStationCode } = train
        ? calculateCurrentEventsForTrain(train)
        : { events: [], nextStationCode: null };
      const withCountdown = calculateCountdown(events);
      setEvents(withCountdown);
      setNextStationCode(nextStationCode);
    },
    isTracking ? 1000 : null
  );

  return (
    <div className="h-screen bg-gray-900 text-gray-300 flex flex-col">
      <TopBar
        startTracking={startTracking}
        train={train}
        isTracking={isTracking}
      />
      <ErrorMessage errorMessage={errorMessage} />
      <Content events={events} />
      <BottomBar isTracking={isTracking} stopTracking={stopTracking} />
    </div>
  );
}

interface ErrorProps {
  errorMessage: string | null;
}

function ErrorMessage({ errorMessage }: ErrorProps) {
  if (!errorMessage) {
    return null;
  }
  return <div className="bg-red-700 m-1 px-1"> {errorMessage}</div>;
}
