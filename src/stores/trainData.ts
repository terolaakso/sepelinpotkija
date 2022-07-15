import { isNil } from 'lodash';
import { DateTime } from 'luxon';
import create from 'zustand';

import {
  FirstLevelCauseCollection,
  SecondLevelCauseCollection,
  ThirdLevelCauseCollection,
} from '@/types/digitraffic';
import { StationCollection } from '@/types/Station';
import { Train, TrainCollection } from '@/types/Train';
import { LocationCollection, TrainLocation } from '@/types/TrainLocation';

interface TrainDataStore {
  stations: StationCollection;
  firstLevelCauses: FirstLevelCauseCollection;
  secondLevelCauses: SecondLevelCauseCollection;
  thirdLevelCauses: ThirdLevelCauseCollection;
  trains: TrainCollection;
  locations: LocationCollection;
  setStations: (station: StationCollection) => void;
  setFirstLevelCauses: (causes: FirstLevelCauseCollection) => void;
  setSecondLevelCauses: (causes: SecondLevelCauseCollection) => void;
  setThirdLevelCauses: (causes: ThirdLevelCauseCollection) => void;
  setTrain: (train: Train) => void;
  setLocation: (location: TrainLocation) => void;
}

export const useTrainDataStore = create<TrainDataStore>((set, get) => ({
  stations: {},
  firstLevelCauses: {},
  secondLevelCauses: {},
  thirdLevelCauses: {},
  trains: {},
  locations: {},
  setStations: (stations) => {
    set((state) => ({
      ...state,
      stations: stations,
    }));
  },
  setFirstLevelCauses: (causes) => {
    set((state) => ({
      ...state,
      firstLevelCauses: causes,
    }));
  },
  setSecondLevelCauses: (causes) => {
    set((state) => ({
      ...state,
      secondLevelCauses: causes,
    }));
  },
  setThirdLevelCauses: (causes) => {
    set((state) => ({
      ...state,
      thirdLevelCauses: causes,
    }));
  },
  setTrain: (train: Train) => {
    const { departureDate, trainNumber } = train;
    const key = `${departureDate}-${trainNumber}`;

    set((state) => {
      const oldVersion = state.trains[key];
      if ((oldVersion?.version ?? 0) <= train.version) {
        return {
          ...state,
          trains: { ...state.trains, [key]: train },
        };
      } else {
        console.log(new Date().toLocaleTimeString(), 'Rejected new train!', key);
        return state;
      }
    });
  },
  getLocation: (departureDate: string, trainNumber: number) => {
    const locations = get().locations;
    const location = locations[`${departureDate}-${trainNumber}`] ?? null;
    return location;
  },
  setLocation: (location: TrainLocation) => {
    const { departureDate, trainNumber } = location;
    const key = `${departureDate}-${trainNumber}`;
    set((state) => {
      const oldVersion = state.locations[key];
      if ((oldVersion?.timestamp ?? DateTime.fromMillis(0)) <= location.timestamp) {
        return {
          ...state,
          locations: { ...state.locations, [key]: location },
        };
      } else {
        console.log(new Date().toLocaleTimeString(), 'Rejected new location!', key);
        return state;
      }
    });
  },
}));

export function getTrainFromStore(departureDate: string | null, trainNumber: number | null) {
  if (isNil(departureDate) || isNil(trainNumber)) {
    return null;
  }
  const trains = useTrainDataStore.getState().trains;
  const train = trains[`${departureDate}-${trainNumber}`] ?? null;
  return train;
}

export function getLocationFromStore(departureDate: string, trainNumber: number) {
  const locations = useTrainDataStore.getState().locations;
  const location = locations[`${departureDate}-${trainNumber}`] ?? null;
  return location;
}
