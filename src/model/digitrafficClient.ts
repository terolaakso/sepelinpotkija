import {
  FirstLevelCauseCollection,
  SecondLevelCauseCollection,
  ThirdLevelCauseCollection,
} from '../components/TrainData';
import {
  Station as DigitrafficStation,
  Train as DigitrafficTrain,
  GpsLocation as DigitrafficGpsLocation,
  FirstLevelCause,
  SecondLevelCause,
  ThirdLevelCause,
} from './digitraffic';

import { StationCollection } from './Station';
import { Train } from './Train';
import { TrainLocation } from './TrainLocation';
import { transformLocation, transformStation, transformTrains } from './transform';

const DIGITRAFFIC_API_URL = 'https://rata.digitraffic.fi/api/v1';

export async function getTrain(trainNumber: number, departureDate?: string): Promise<Train | null> {
  try {
    const dateForUrl = departureDate ?? 'latest';
    const url = `${DIGITRAFFIC_API_URL}/trains/${dateForUrl}/${trainNumber}`;
    const response = await fetch(url);
    const digitrafficTrains = (await response.json()) as DigitrafficTrain[];
    const trains = transformTrains(digitrafficTrains);
    return trains.length > 0 ? trains[0] : null;
  } catch (error) {
    return null;
  }
}

export async function getTrainsOfStation(stationCode: string): Promise<Train[]> {
  try {
    const url = `${DIGITRAFFIC_API_URL}/live-trains/station/${stationCode}?include_nonstopping=true`;
    const response = await fetch(url);
    const digitrafficTrains = (await response.json()) as DigitrafficTrain[];
    return transformTrains(digitrafficTrains);
  } catch (error) {
    return [];
  }
}

export async function getLocation(trainNumber: number): Promise<TrainLocation | null> {
  try {
    const url = `${DIGITRAFFIC_API_URL}/train-locations/latest/${trainNumber}`;
    const response = await fetch(url);
    const digitrafficLocations = (await response.json()) as DigitrafficGpsLocation[];
    const locations = digitrafficLocations.map(transformLocation);
    return locations.length > 0 ? locations[0] : null;
  } catch (error) {
    return null;
  }
}

export async function getStations(): Promise<StationCollection> {
  try {
    const url = `${DIGITRAFFIC_API_URL}/metadata/stations`;
    const response = await fetch(url);
    const digitrafficStations = (await response.json()) as DigitrafficStation[];
    const stations = digitrafficStations.map(transformStation);
    const result = Object.fromEntries(stations.map((station) => [station.shortCode, station]));
    return result;
  } catch (error) {
    return {};
  }
}

export async function get1stLevelCauses(): Promise<FirstLevelCauseCollection> {
  try {
    const url = `${DIGITRAFFIC_API_URL}/metadata/cause-category-codes`;
    const response = await fetch(url);
    const causes = (await response.json()) as FirstLevelCause[];
    const result = Object.fromEntries(causes.map((cause) => [cause.id, cause]));
    return result;
  } catch (error) {
    return {};
  }
}

export async function get2ndLevelCauses(): Promise<SecondLevelCauseCollection> {
  try {
    const url = `${DIGITRAFFIC_API_URL}/metadata/detailed-cause-category-codes`;
    const response = await fetch(url);
    const causes = (await response.json()) as SecondLevelCause[];
    const result = Object.fromEntries(causes.map((cause) => [cause.id, cause]));
    return result;
  } catch (error) {
    return {};
  }
}

export async function get3rdLevelCauses(): Promise<ThirdLevelCauseCollection> {
  try {
    const url = `${DIGITRAFFIC_API_URL}/metadata/third-cause-category-codes`;
    const response = await fetch(url);
    const causes = (await response.json()) as ThirdLevelCause[];
    const result = Object.fromEntries(causes.map((cause) => [cause.id, cause]));
    return result;
  } catch (error) {
    return {};
  }
}
