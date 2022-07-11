// import mqtt, { AsyncMqttClient } from "async-mqtt";
// import { useState } from "react";

// import Connector from "../operations/mqtt/Connector";
import { useState } from 'react';
import Status from './Status';
import Viewer from './Viewer';

// export default function Home() {
//   const [client, setClient] = useState<AsyncMqttClient | undefined>();

//   async function connect() {
//     const connectedClient = await mqtt.connectAsync(
//       "wss://rata.digitraffic.fi:443/mqtt"
//     );
//     setClient(connectedClient);
//     await connectedClient.subscribe("train-locations/#");
//     connectedClient.on("message", (topic, message) => {
//       console.log(topic, message);
//     });
//   }

//   async function disconnect() {
//     if (client) {
//       await client.unsubscribe("train-locations/#");
//       await client.end();
//       setClient(undefined);
//     }
//   }

//   return (
//     <div>
//       <button onClick={connect}>Start</button>
//       <button onClick={disconnect}>Stop</button>
//     </div>
//   );
// }

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);

  function startIt() {
    setIsRunning(true);
  }

  function stopIt() {
    setIsRunning(false);
  }

  return (
    <div>
      <h1>Home</h1>
      {/* <Connector brokerUrl="wss://rata.digitraffic.fi:443/mqtt"> */}
      <Status />
      <div>
        <button type="button" onClick={startIt}>
          Start
        </button>
        <button type="button" onClick={stopIt}>
          Stop
        </button>
      </div>
      {isRunning ? <Viewer /> : null}
      {/* </Connector> */}
    </div>
  );
}
