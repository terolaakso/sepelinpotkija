import { DateTime } from 'luxon';
import { useEffect, useRef } from 'react';

import { LocationAndSpeed } from '@/types/TrainLocation';
import { isNotNil } from '@/utils/misc';

const M_PER_SEC_TO_KM_PER_H_COEFF = 3.6;

export default function useGeolocationWatchPosition(
  isWatching: boolean,
  onLocationReceived: (newLocation: LocationAndSpeed) => void
) {
  const savedOnLocationReceived = useRef(onLocationReceived);
  useEffect(() => {
    savedOnLocationReceived.current = onLocationReceived;
  }, [onLocationReceived]);

  useEffect(() => {
    let watchId: number | null = null;
    if (isWatching) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          savedOnLocationReceived.current({
            location: {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
            },
            speed: isNotNil(pos.coords.speed)
              ? Math.round(pos.coords.speed * M_PER_SEC_TO_KM_PER_H_COEFF)
              : 0,
            timestamp: DateTime.fromMillis(pos.timestamp),
          });
        },
        (err) => {
          console.log('Error in geolocation.watchPosition', JSON.stringify(err));
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
        }
      );
    }
    return () => {
      if (isNotNil(watchId)) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isWatching]);
}
