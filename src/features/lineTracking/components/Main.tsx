import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import BottomBar from '@/components/BottomBar';
import useStalledTrainsRescue from '@/hooks/useStalledTrainsRescue';
import useStation from '@/hooks/useStation';
import { useTrainDataStore } from '@/stores/trainData';
import { Station } from '@/types/Station';
import { isNotNil } from '@/utils/misc';

import { calculateCurrentEvents } from '../utils/lineTracking';

import Content from './Content';
import TopBar from './TopBar';

function LineTracking() {
  const [isTracking, setIsTracking] = useState(false);
  const { stationCode1 = null, stationCode2 = null, location = '50' } = useParams();
  const navigate = useNavigate();

  useStation(isTracking ? stationCode1 : null);
  useStation(isTracking ? stationCode2 : null);
  useStalledTrainsRescue(isTracking ? 1000 : null);

  useEffect(() => {
    setIsTracking(isNotNil(stationCode1) && isNotNil(stationCode2));
  }, [stationCode1, stationCode2, location]);

  const trainCollection = useTrainDataStore((state) => state.trains);
  const trains = Object.values(trainCollection).filter(isNotNil);
  const locationInt = parseInt(location);
  const events = calculateCurrentEvents(trains, stationCode1, stationCode2, locationInt);

  function showLocation(station1: Station, station2: Station, location: number): void {
    if (
      stationCode1 !== station1.shortCode ||
      stationCode2 !== station2.shortCode ||
      locationInt !== location
    ) {
      navigate(`/linja/${station1.shortCode}/${station2.shortCode}/${location}`);
    } else {
      setIsTracking(true);
    }
  }

  return (
    <div className="h-screen bg-gray-900 text-gray-300 flex flex-col">
      <TopBar
        isTracking={isTracking}
        trackedStationCode1={stationCode1}
        trackedStationCode2={stationCode2}
        location={parseInt(location)}
        startTracking={showLocation}
      ></TopBar>
      <Content events={events} isTracking={isTracking}></Content>
      <BottomBar isTracking={isTracking} stopTracking={() => setIsTracking(false)}></BottomBar>
    </div>
  );
}

export default LineTracking;
