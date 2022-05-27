import { DateTime } from "luxon";

export interface TrainEvent {
  name: string;
  time: DateTime;
  departureTime: DateTime | null;
  eventType: TrainEventType;
  lineId: string | null;
  lateMinutes: number | null;
  countdown: string;
  relativeProgress: number;
}

export enum TrainEventType {
  Stop = "Stop",
  Station = "Station",
  Detail = "Detail",
  Train = "Train",
}
