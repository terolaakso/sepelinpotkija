import mqtt, { AsyncMqttClient } from "async-mqtt";
import { useState } from "react";

export default function Home() {
  const [client, setClient] = useState<AsyncMqttClient | undefined>();

  async function connect() {
    const connectedClient = await mqtt.connectAsync(
      "wss://rata.digitraffic.fi:443/mqtt"
    );
    setClient(connectedClient);
    await connectedClient.subscribe("train-locations/#");
    connectedClient.on("message", (topic, message) => {
      console.log(topic, message);
    });
  }

  async function disconnect() {
    if (client) {
      await client.unsubscribe("train-locations/#");
      await client.end();
      setClient(undefined);
    }
  }

  return (
    <div>
      <button onClick={connect}>Start</button>
      <button onClick={disconnect}>Stop</button>
    </div>
  );
}
