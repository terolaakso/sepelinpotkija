import './App.css';
import { Fragment } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Connector } from '@/features/mqtt';
import { TrainTracking } from '@/features/trainTracking';

import MainMenu from './components/MainMenu';
import { LineTracking } from './features/lineTracking';
import { StationTracking } from './features/stationTracking';

function App() {
  return (
    <Fragment>
      <Connector brokerUrl="wss://rata.digitraffic.fi:443/mqtt">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/juna" element={<TrainTracking />} />
            <Route path="/asema" element={<StationTracking></StationTracking>} />
            <Route path="/asema/:stationCode" element={<StationTracking></StationTracking>} />
            <Route path="/linja" element={<LineTracking></LineTracking>} />
            <Route
              path="/linja/:stationCode1/:stationCode2/:location"
              element={<LineTracking></LineTracking>}
            />
          </Routes>
        </BrowserRouter>
      </Connector>
      <footer className="mx-1 mb-1">
        <small className="text-right">
          <div>
            Liikennetietojen lähde Fintraffic /{' '}
            <a href="http://rata.digitraffic.fi/">digitraffic.fi</a>
          </div>
          <div>
            lisenssi <a href="http://creativecommons.org/licenses/by/4.0/">CC 4.0 BY</a>
          </div>
          <div>
            <a href="mailto:junailija@tee.pp.fi">junailija@tee.pp.fi</a> /{' '}
            <a href="https://github.com/terolaakso/sepelinpotkija">GitHub</a>
          </div>
        </small>
      </footer>
    </Fragment>
  );
}

export default App;
