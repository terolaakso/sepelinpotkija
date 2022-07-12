import { LatLon } from '@/utils/geography';

export interface Station {
  name: string;
  shortCode: string;
  location: LatLon;
}

export interface StationCollection {
  [key: string]: Station | undefined;
}
