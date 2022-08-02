import { isNil, pickBy } from 'lodash';
import { DateTime } from 'luxon';
import create from 'zustand';

import { TrackSegmentCollection } from '@/features/trainTracking';
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
  extras: TrackSegmentCollection;
  setStations: (station: StationCollection) => void;
  setFirstLevelCauses: (causes: FirstLevelCauseCollection) => void;
  setSecondLevelCauses: (causes: SecondLevelCauseCollection) => void;
  setThirdLevelCauses: (causes: ThirdLevelCauseCollection) => void;
  getTrain: (departureDate: string | null, trainNumber: number | null) => Train | null;
  setTrain: (train: Train) => void;
  setTrains: (trains: Train[]) => void;
  getLocation: (departureDate: string, trainNumber: number) => TrainLocation | null;
  setLocation: (location: TrainLocation) => void;
  setExtras: (extras: TrackSegmentCollection) => void;
}

const MAX_TRAIN_AGE_MINUTES = 6;
const MAX_LOCATION_AGE_MINUTES = 1;

export const useTrainDataStore = create<TrainDataStore>((set, get) => {
  function cleanup(state: TrainDataStore) {
    const oldestTrainTimestampToKeep = DateTime.now().minus({ minutes: MAX_TRAIN_AGE_MINUTES });
    const trainsToKeep = pickBy(
      state.trains,
      (train) => (train?.timestamp ?? DateTime.fromMillis(0)) >= oldestTrainTimestampToKeep
    );
    const oldestLocationTimestampToKeep = DateTime.now().minus({
      minutes: MAX_LOCATION_AGE_MINUTES,
    });
    const locationsToKeep = pickBy(
      state.locations,
      (location) => (location?.timestamp ?? DateTime.fromMillis(0)) >= oldestLocationTimestampToKeep
    );
    return {
      ...state,
      trains: trainsToKeep,
      locations: locationsToKeep,
    };
  }

  return {
    stations: {},
    firstLevelCauses: {},
    secondLevelCauses: {},
    thirdLevelCauses: {},
    trains: {},
    locations: {},
    extras: {},
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
    getTrain: (departureDate: string | null, trainNumber: number | null) => {
      if (isNil(departureDate) || isNil(trainNumber)) {
        return null;
      }
      const trains = get().trains;
      const train = trains[`${departureDate}-${trainNumber}`] ?? null;
      return train;
    },
    setTrain: (train: Train) => {
      const { departureDate, trainNumber } = train;
      const key = `${departureDate}-${trainNumber}`;
      set((state) => {
        const cleanedState = cleanup(state);
        const oldVersion = cleanedState.trains[key];
        if ((oldVersion?.version ?? 0) <= train.version) {
          return {
            ...cleanedState,
            trains: { ...cleanedState.trains, [key]: train },
          };
        } else {
          return cleanedState;
        }
      });
    },
    setTrains: (trains: Train[]) => {
      set((state) => {
        const cleanedState = cleanup(state);

        const newState = trains.reduce((accState, train) => {
          const { departureDate, trainNumber } = train;
          const key = `${departureDate}-${trainNumber}`;
          const oldVersion = accState.trains[key];
          if (oldVersion?.version ?? 0 <= train.version) {
            return {
              ...accState,
              trains: { ...accState.trains, [key]: train },
            };
          } else {
            return accState;
          }
        }, cleanedState);

        return newState;
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
        const cleanedState = cleanup(state);
        const oldVersion = cleanedState.locations[key];
        if ((oldVersion?.timestamp ?? DateTime.fromMillis(0)) <= location.timestamp) {
          return {
            ...cleanedState,
            locations: { ...cleanedState.locations, [key]: location },
          };
        } else {
          return cleanedState;
        }
      });
    },
    setExtras: (extras: TrackSegmentCollection) => {
      set((state) => ({
        ...state,
        extras,
      }));
    },
  };
});
