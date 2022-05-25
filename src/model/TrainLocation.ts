import { DateTime } from "luxon";
import { LatLon } from "./geography";

export interface TrainLocation {
  trainNumber: number;
  departureDate: string;
  timestamp: DateTime;
  location: LatLon;
  speed: number;
}
