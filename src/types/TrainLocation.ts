import { DateTime } from 'luxon';

import { LatLon } from '@/utils/geography';

export interface LocationAndSpeed {
  location: LatLon;
  speed: number;
  timestamp: DateTime;
}

export interface TrainLocation extends LocationAndSpeed {
  trainNumber: number;
  departureDate: string;
}

export interface LocationCollection {
  [departureDate_number: string]: TrainLocation | undefined;
}
