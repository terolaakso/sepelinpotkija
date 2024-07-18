import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Connector } from '@/features/mqtt';
import { TrainTracking } from '@/features/trainTracking';

import { StationTracking } from './features/stationTracking';

function App() {
  return (
    <Connector brokerUrl="wss://rata.digitraffic.fi:443/mqtt">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TrainTracking />} />
          <Route path="/asema" element={<StationTracking></StationTracking>} />
          <Route path="/asema/:stationCode" element={<StationTracking></StationTracking>} />
        </Routes>
      </BrowserRouter>
    </Connector>
  );
}

export default App;
