import { DateTime } from 'luxon';

import { TrainLocation } from '@/types/TrainLocation';

export function trainLocationFixture(props?: Partial<TrainLocation>): TrainLocation {
  return {
    ...defaultTrainLocation(),
    ...props,
  };
}

function defaultTrainLocation(): TrainLocation {
  return {
    departureDate: '2018-12-30',
    location: {
      lat: 1,
      lon: 2,
    },
    speed: 35,
    timestamp: DateTime.now(),
    trainNumber: 1948,
  };
}
