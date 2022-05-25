import { createContext, useEffect, useState } from "react";
import { getStations } from "./digitrafficClient";
import { Station, StationCollection } from "./Station";

export interface TrainContextProps {
  stations: StationCollection;
}

export const TrainContext = createContext<TrainContextProps>({
  stations: {},
});

export interface TrainDataProps {
  children: React.ReactNode;
}

export default function TrainData({ children }: TrainDataProps) {
  const [state, setState] = useState<TrainContextProps>({
    stations: {},
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
