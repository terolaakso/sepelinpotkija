import { DateTime } from 'luxon';

import { LatLon } from '@/utils/geography';

export interface TrainLocation {
  trainNumber: number;
  departureDate: string;
  timestamp: DateTime;
  location: LatLon;
  speed: number;
}

export interface LocationCollection {
  [departureDate_number: string]: TrainLocation | undefined;
}
