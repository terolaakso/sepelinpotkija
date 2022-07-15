import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import {
  get1stLevelCauses,
  get2ndLevelCauses,
  get3rdLevelCauses,
  getStations,
} from '@/api/digitrafficClient';
import { useTrainDataStore } from '@/stores/trainData';

import App from './App';
import reportWebVitals from './reportWebVitals';

async function loadMetadata() {
  const [stations, firstLevels, secondLevels, thirdLevels] = await Promise.all([
    getStations(),
    get1stLevelCauses(),
    get2ndLevelCauses(),
    get3rdLevelCauses(),
  ]);
  const {
    setStations: populateStations,
    setFirstLevelCauses: populateFirstLevelCauses,
    setSecondLevelCauses: populateSecondLevelCauses,
    setThirdLevelCauses: populateThirdLevelCauses,
  } = useTrainDataStore.getState();

  populateStations(stations);
  populateFirstLevelCauses(firstLevels);
  populateSecondLevelCauses(secondLevels);
  populateThirdLevelCauses(thirdLevels);
}

loadMetadata();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
