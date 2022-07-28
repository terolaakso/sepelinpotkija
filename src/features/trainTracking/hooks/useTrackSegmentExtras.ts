import { useEffect } from 'react';

import { loadExtras } from '@/features/trainTracking';
import { useTrainDataStore } from '@/stores/trainData';

export default function useTrackSegmentExtras() {
  const stations = useTrainDataStore((state) => state.stations);
  const setExtras = useTrainDataStore((state) => state.setExtras);

  useEffect(() => {
    async function fetchExtras() {
      if (Object.keys(stations).length > 0) {
        const extras = await loadExtras(stations);
        setExtras(extras);
      }
    }

    fetchExtras();
  }, [setExtras, stations]);
}
