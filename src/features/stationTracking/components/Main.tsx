import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import BottomBar from '@/components/BottomBar';
import useStation from '@/hooks/useStation';
import { useTrainDataStore } from '@/stores/trainData';
import { Station } from '@/types/Station';
import { isNotNil } from '@/utils/misc';

import useStalledTrainsRescue from '../hooks/useStalledTrainsRescue';
import { calculateCurrentEventsForStation } from '../utils/stationTracking';

import Content from './Content';
import TopBar from './TopBar';

const StationTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const { stationCode = null } = useParams();
  const navigate = useNavigate();

  useStation(isTracking ? stationCode : null);
  useStalledTrainsRescue(isTracking ? 1000 : null);

  const trainCollection = useTrainDataStore((state) => state.trains);
  const trains = Object.values(trainCollection).filter(isNotNil);
  const events = calculateCurrentEventsForStation(trains, stationCode);

  useEffect(() => {
    setIsTracking(isNotNil(stationCode));
  }, [stationCode]);

  function showLocation(pickedStation: Station) {
    if (stationCode != pickedStation.shortCode) {
      navigate(`/asema/${pickedStation.shortCode}`);
    } else {
      setIsTracking(true);
    }
  }

  return (
    <div className="h-dvh bg-gray-900 text-gray-300 flex flex-col">
      <TopBar
        isTracking={isTracking}
        trackedStationCode={stationCode}
        startTracking={showLocation}
      ></TopBar>
      <Content events={events} isTracking={isTracking}></Content>
      <BottomBar isTracking={isTracking} stopTracking={() => setIsTracking(false)}></BottomBar>
    </div>
  );
};

export default StationTracking;
