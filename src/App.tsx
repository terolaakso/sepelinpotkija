import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Home from './components/Home';
import TrainData from './components/TrainData';
import TrainTracking from './features/TrainTracking/Main';
import Connector from './hooks/mqtt/Connector';

function App() {
  return (
    <TrainData>
      <Connector brokerUrl="wss://rata.digitraffic.fi:443/mqtt">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<TrainTracking />} />
            <Route path="/home" element={<Home />} />
          </Routes>
        </BrowserRouter>
      </Connector>
    </TrainData>
  );
}

export default App;
