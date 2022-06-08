import { isNil } from "lodash";
import { createContext, useEffect, useState } from "react";
import {
  FirstLevelCause,
  SecondLevelCause,
  ThirdLevelCause,
} from "../model/digitraffic";
import {
  get1stLevelCauses,
  get2ndLevelCauses,
  get3rdLevelCauses,
  getStations,
} from "../model/digitrafficClient";
import { StationCollection } from "../model/Station";
import { Train, TrainCollection } from "../model/Train";
import { LocationCollection, TrainLocation } from "../model/TrainLocation";

export interface FirstLevelCauseCollection {
  [id: number]: FirstLevelCause | undefined;
}

export interface SecondLevelCauseCollection {
  [id: number]: SecondLevelCause | undefined;
}

export interface ThirdLevelCauseCollection {
  [id: number]: ThirdLevelCause | undefined;
}

export interface TrainContextProps {
  stations: StationCollection;
  trains: TrainCollection;
  locations: LocationCollection;
  firstLevelCauses: FirstLevelCauseCollection;
  secondLevelCauses: SecondLevelCauseCollection;
  thirdLevelCauses: ThirdLevelCauseCollection;
  setLocation: (location: TrainLocation) => void;
  setTrain: (train: Train) => void;
}

export const TrainContext = createContext<TrainContextProps>({
  stations: {},
  trains: {},
  locations: {},
  firstLevelCauses: {},
  secondLevelCauses: {},
  thirdLevelCauses: {},
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
    const oldVersion = state.trains[key];
    if ((oldVersion?.version ?? 0) <= train.version) {
      setState((prevState) => ({
        ...prevState,
        trains: { ...prevState.trains, [key]: train },
      }));
    }
  }

  const [state, setState] = useState<TrainContextProps>({
    stations: {},
    trains: {},
    locations: {},
    firstLevelCauses: {},
    secondLevelCauses: {},
    thirdLevelCauses: {},
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
    async function fetch1stLevelCauses() {
      const causes = await get1stLevelCauses();
      setState((prevState) => ({
        ...prevState,
        firstLevelCauses: causes,
      }));
    }
    async function fetch2ndLevelCauses() {
      const causes = await get2ndLevelCauses();
      setState((prevState) => ({
        ...prevState,
        secondLevelCauses: causes,
      }));
    }
    async function fetch3rdLevelCauses() {
      const causes = await get3rdLevelCauses();
      setState((prevState) => ({
        ...prevState,
        thirdLevelCauses: causes,
      }));
    }
    fetchStations();
    fetch1stLevelCauses();
    fetch2ndLevelCauses();
    fetch3rdLevelCauses();
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
