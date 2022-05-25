import {
  Station as DigitrafficStation,
  Train as DigitrafficTrain,
} from "./digitraffic";
import { Station, StationCollection } from "./Station";
import { Train } from "./Train";
import { transformStation, transformTrains } from "./transform";

const DIGITRAFFIC_API_URL = "https://rata.digitraffic.fi/api/v1";

export async function getTrain(trainNumber: number): Promise<Train | null> {
  try {
    const url = `${DIGITRAFFIC_API_URL}/live-trains/${trainNumber}`;
    const response = await fetch(url);
    const digitrafficTrains = (await response.json()) as DigitrafficTrain[];
    const trains = transformTrains(digitrafficTrains);
    return trains.length > 0 ? trains[0] : null;
  } catch (error) {
    // TODO: Do we need some reaction to lost connections?
    return null;
  }
}

export async function getStations(): Promise<StationCollection> {
  try {
    const url = `${DIGITRAFFIC_API_URL}/metadata/stations`;
    const response = await fetch(url);
    const digitrafficStations = (await response.json()) as DigitrafficStation[];
    const stations = digitrafficStations.map(transformStation);
    const result = Object.fromEntries(
      stations.map((station) => [station.shortCode, station])
    );
    return result;
  } catch (error) {
    return {};
  }
}
