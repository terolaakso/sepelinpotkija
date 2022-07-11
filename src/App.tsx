import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import TrainTracking from './pages/TrainTracking/Main';
import Connector from './operations/mqtt/Connector';
import TrainData from './components/TrainData';

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
