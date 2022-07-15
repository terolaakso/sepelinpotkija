import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Connector } from '@/features/mqtt';
import { TrainTracking } from '@/features/trainTracking';

import Home from './components/Home';

function App() {
  return (
    <Connector brokerUrl="wss://rata.digitraffic.fi:443/mqtt">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TrainTracking />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </Connector>
  );
}

export default App;
