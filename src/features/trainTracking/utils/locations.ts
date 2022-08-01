import { LocationAndSpeed, TrainLocation } from '@/types/TrainLocation';

export function transformGeolocation(
  departureDate: string,
  trainNumber: number,
  location: LocationAndSpeed
): TrainLocation {
  return {
    ...location,
    departureDate: departureDate,
    trainNumber: trainNumber,
  };
}
