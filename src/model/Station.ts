import { LatLon } from "./geography";

export interface Station {
  name: string;
  shortCode: string;
  location: LatLon;
}

export interface StationCollection {
  [key: string]: Station;
}
