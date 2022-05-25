import { useEffect, useState } from "react";
import { getTrain } from "../../model/digitrafficClient";
import { Train } from "../../model/Train";
import { TrainEvent } from "../../model/TrainEvent";
import {
  calculateCountdown,
  calculateCurrentEventsForTrain,
} from "../../model/trainTracking";
import { useInterval } from "../../operations/useInterval";
import useTrainWatch from "../../operations/useTrainWatch";
import BottomBar from "./BottomBar";
import Content from "./Content";
import TopBar from "./TopBar";

export default function TrainTracking() {
  const [train, setTrain] = useState<Train | null>(null);
  const [events, setEvents] = useState<TrainEvent[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function startTracking(trainNumber: number) {
    const train = await getTrain(trainNumber);
    setTrain(train);
    if (!train) {
      setErrorMessage("Junan tietoja ei löydy");
      return;
    }
    setErrorMessage(null);
    setIsTracking(true);
  }

  async function stopTracking() {
    setIsTracking(false);
  }

  useEffect(() => {
    const events = train ? calculateCurrentEventsForTrain(train) : [];
    const withCountdown = calculateCountdown(events);
    setEvents(withCountdown);
  }, [train]);

  useInterval(
    () => {
      const updated = calculateCountdown(events);
      setEvents(updated);
    },
    isTracking ? 1000 : null
  );

  useTrainWatch(isTracking ? train : null, (updatedTrain) => {
    console.log("train updated with new location");
    setTrain(updatedTrain);
  });

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
