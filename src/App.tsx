import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Connector } from '@/features/mqtt';
import { TrainTracking } from '@/features/trainTracking';

function App() {
  return (
    <Connector brokerUrl="wss://rata.digitraffic.fi:443/mqtt">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TrainTracking />} />
        </Routes>
      </BrowserRouter>
    </Connector>
  );
}

export default App;
