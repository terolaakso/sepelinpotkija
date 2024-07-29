import { Station } from '@/types/Station';
import { StationSegmentLocation } from '@/utils/geography';

export interface LocationOnLine extends StationSegmentLocation {
  station1: Station;
  station2: Station;
}

export interface LocationOnLineError {
  error: string;
}

export type LocationOnLineResult = LocationOnLine | LocationOnLineError;

export function isSuccess(result: LocationOnLineResult): result is LocationOnLine {
  return (result as LocationOnLineError).error === undefined;
}

export function isError(result: LocationOnLineResult): result is LocationOnLineError {
  return (result as LocationOnLineError).error !== undefined;
}
