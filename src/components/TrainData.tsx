import { isNil } from "lodash";
import { createContext, useEffect, useState } from "react";
import { getStations } from "../model/digitrafficClient";
import { StationCollection } from "../model/Station";
import { Train, TrainCollection } from "../model/Train";
import { LocationCollection, TrainLocation } from "../model/TrainLocation";

export interface TrainContextProps {
  stations: StationCollection;
  trains: TrainCollection;
  locations: LocationCollection;
  setLocation: (location: TrainLocation) => void;
  setTrain: (train: Train) => void;
}

export const TrainContext = createContext<TrainContextProps>({
  stations: {},
  trains: {},
  locations: {},
  setLocation: () => {},
  setTrain: () => {},
});

export interface TrainDataProps {
  children: React.ReactNode;
}

export default function TrainData({ children }: TrainDataProps) {
  function setLocation(location: TrainLocation) {
    const { departureDate, trainNumber } = location;
    const key = `${departureDate}-${trainNumber}`;
    setState((prevState) => ({
      ...prevState,
      locations: { ...prevState.locations, [key]: location },
    }));
  }
  function setTrain(train: Train) {
    const { departureDate, trainNumber } = train;
    const key = `${departureDate}-${trainNumber}`;
    setState((prevState) => ({
      ...prevState,
      trains: { ...prevState.trains, [key]: train },
    }));
  }

  const [state, setState] = useState<TrainContextProps>({
    stations: {},
    trains: {},
    locations: {},
    setLocation,
    setTrain,
  });

  useEffect(() => {
    async function fetchStations() {
      const stations = await getStations();
      setState((prevState) => ({
        ...prevState,
        stations,
      }));
    }
    fetchStations();
  }, []);
  return (
    <TrainContext.Provider value={state}>{children}</TrainContext.Provider>
  );
}

export function getTrainFromContext(
  departureDate: string,
  trainNumber: number,
  context: TrainContextProps | null
): Train | null {
  if (isNil(context)) {
    return null;
  }
  const { trains } = context;
  const train = trains[`${departureDate}-${trainNumber}`] ?? null;
  return train;
}

export function getLocationFromContext(
  departureDate: string,
  trainNumber: number,
  context: TrainContextProps | null
): TrainLocation | null {
  if (isNil(context)) {
    return null;
  }
  const { locations } = context;
  const location = locations[`${departureDate}-${trainNumber}`] ?? null;
  return location;
}
