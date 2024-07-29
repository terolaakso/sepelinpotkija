import { isNil } from 'lodash';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';

import ErrorBar from '@/components/ErrorBar';
import StationPicker from '@/components/StationPicker';
import { useTrainDataStore } from '@/stores/trainData';
import { Station } from '@/types/Station';
import { getCurrentLocation } from '@/utils/geolocation';
import { isNotNil } from '@/utils/misc';
import { getNearestStations } from '@/utils/stations';

import { isSuccess } from '../types/LocationOnLine';
import { getAdjacentStationsFromTimetable, getLocationOnLine } from '../utils/lineTracking';

export interface LineInputFormProps {
  trackedStationCode1: string | null;
  trackedStationCode2: string | null;
  trackedLocation: number;
  startTracking: (station1: Station, station2: Station, location: number) => void;
}

export default function LineInputForm({
  trackedStationCode1,
  trackedStationCode2,
  trackedLocation,
  startTracking,
}: LineInputFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStation1, setSelectedStation1] = useState<Station | null>(null);
  const [selectedStation2, setSelectedStation2] = useState<Station | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [nearestStations, setNearestStations] = useState<Station[]>([]);
  const [adjacentStations, setAdjacentStations] = useState<Station[]>([]);
  const stationCollection = useTrainDataStore((state) => state.stations);
  const [didFetchNearestStations, setDidFetchNearestStations] = useState(false);
  const [initialPopulationDone, setInitialPopulationDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const populateAdjacentStations = useCallback(
    async (station: Station | null) => {
      if (isNotNil(station)) {
        const adjacents = await getAdjacentStationsFromTimetable(station, stationCollection);
        setAdjacentStations(adjacents);
        if (
          adjacents.length > 0 &&
          isNotNil(selectedStation2) &&
          !adjacents.includes(selectedStation2)
        ) {
          setSelectedStation2(null);
        }
      } else {
        setAdjacentStations([]);
      }
    },
    [selectedStation2, stationCollection]
  );

  useEffect(() => {
    async function getLocation() {
      try {
        setIsLoading(true);
        const position = await getCurrentLocation();
        const top3Stations = getNearestStations(stationCollection, position, 3);
        setNearestStations(top3Stations);
      } catch (error) {
        setNearestStations([]);
      } finally {
        setIsLoading(false);
        setDidFetchNearestStations(true);
      }
    }

    if (initialPopulationDone || Object.values(stationCollection).length === 0) {
      return;
    }
    if (!didFetchNearestStations) {
      getLocation();
    }
    if (isNotNil(trackedStationCode1) && isNil(selectedStation1)) {
      const station = stationCollection[trackedStationCode1] ?? null;
      if (isNotNil(station)) {
        setSelectedStation1(station);
      }
      populateAdjacentStations(station);
    }
    if (isNotNil(trackedStationCode2) && isNil(selectedStation2)) {
      const station = stationCollection[trackedStationCode2];
      if (isNotNil(station)) {
        setSelectedStation2(station);
      }
    }
    if (isNotNil(trackedLocation) && isNil(selectedLocation)) {
      setSelectedLocation(trackedLocation);
    }
    setInitialPopulationDone(true);
  }, [
    stationCollection,
    didFetchNearestStations,
    trackedStationCode1,
    selectedStation1,
    trackedStationCode2,
    selectedStation2,
    trackedLocation,
    selectedLocation,
    initialPopulationDone,
    populateAdjacentStations,
  ]);

  const nonNullLocation = selectedLocation ?? 50;

  function onLocationChanged(event: ChangeEvent<HTMLInputElement>) {
    const value = parseInt(event.target.value);
    setSelectedLocation(isNaN(value) ? 50 : value);
  }

  function showLocation() {
    if (isNotNil(selectedStation1) && isNotNil(selectedStation2)) {
      startTracking(selectedStation1, selectedStation2, nonNullLocation);
    }
  }

  async function getPosition() {
    setIsLoading(true);
    const location = await getLocationOnLine();
    if (isSuccess(location)) {
      startTracking(location.station1, location.station2, Math.round(location.location * 100));
    } else {
      setErrorMessage(location.error);
    }
    setIsLoading(false);
  }

  function isValid() {
    return isNotNil(selectedStation1) && isNotNil(selectedStation2) && isNotNil(selectedLocation);
  }

  async function onStation1Change(station: Station | null) {
    if (station !== selectedStation1) {
      setSelectedStation1(station);
      populateAdjacentStations(station);
    }
  }

  if (!initialPopulationDone) {
    return null;
  }

  return (
    <div className="p-1">
      <form className="max-w-screen-xl flex flex-col gap-1">
        <div className="flex portrait:flex-col flex-row gap-1">
          <div className="flex-1">
            <StationPicker
              id="selectStation1"
              groupName="Lähimmät liikennepaikat"
              isLoading={isLoading}
              onSelectedStationChange={onStation1Change}
              defaultStation={selectedStation1}
              stationsForGroup={nearestStations}
            ></StationPicker>
          </div>
          <div className="flex flex-col flex-1">
            <label htmlFor="inputLocation" className="text-sm">
              Sijainti liikennepaikkojen välillä
            </label>
            <input
              className=""
              id="inputLocation"
              type="range"
              min="0"
              max="100"
              step="1"
              required
              value={nonNullLocation}
              onChange={onLocationChanged}
            />
            <div className="text-center tabular-nums">
              {nonNullLocation} / {100 - nonNullLocation}
            </div>
          </div>
          <div className="flex-1">
            <StationPicker
              id="selectStation2"
              groupName="Viereiset liikennepaikat"
              isLoading={isLoading}
              onSelectedStationChange={setSelectedStation2}
              defaultStation={selectedStation2}
              stationsForGroup={adjacentStations}
            ></StationPicker>
          </div>
        </div>
        <div className="flex justify-around">
          <button
            type="button"
            onClick={showLocation}
            className="bg-gray-700 px-2"
            disabled={!isValid()}
          >
            Seuraa
          </button>
          <button type="button" onClick={getPosition} className="bg-gray-700 px-2">
            Käytä nykyistä sijaintia
          </button>
        </div>
        <ErrorBar errorMessage={errorMessage}></ErrorBar>
      </form>
    </div>
  );
}
