import { useEffect, useState } from 'react';

import useTimeout from '@/hooks/useTimeout';

import useTrainDigitrafficLocationWatch from './useTrainDigitrafficLocationWatch';
import useTrainGeolocationWatch from './useTrainGeolocationWatch';

const DIGITRAFFIC_LOCATION_WAIT_MINUTES = 1;

export default function useTrainLocationWatch(
  departureDate: string | null,
  trainNumber: number | null,
  useDigitrafficLocations: boolean,
  useDeviceLocations: boolean
) {
  const [activateGeolocation, setActivateGeolocation] = useState(false);
  const [geolocationStartDelayMs, setGeolocationStartDelayMs] = useState<number | null>(null);

  useEffect(() => {
    if (useDigitrafficLocations && useDeviceLocations) {
      setGeolocationStartDelayMs(DIGITRAFFIC_LOCATION_WAIT_MINUTES * 60 * 1000);
    } else if (!useDigitrafficLocations && useDeviceLocations) {
      setActivateGeolocation(true);
    }
  }, [useDigitrafficLocations, useDeviceLocations, departureDate, trainNumber]);

  useTimeout(() => {
    setActivateGeolocation(useDeviceLocations);
  }, geolocationStartDelayMs);

  useTrainDigitrafficLocationWatch(
    useDigitrafficLocations ? departureDate : null,
    useDigitrafficLocations ? trainNumber : null,
    (newLocation) => {
      if (!useDeviceLocations) {
        return;
      }
      const waitTimeMs = newLocation.timestamp
        .plus({ minutes: DIGITRAFFIC_LOCATION_WAIT_MINUTES })
        .diffNow()
        .as('milliseconds');

      setGeolocationStartDelayMs(Math.max(waitTimeMs, 0));
      if (waitTimeMs > 0) {
        setActivateGeolocation(false);
      }
    }
  );

  useTrainGeolocationWatch(
    activateGeolocation ? departureDate : null,
    activateGeolocation ? trainNumber : null
  );
}
