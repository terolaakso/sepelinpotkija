import { useState, useEffect, useRef } from 'react';
import { connect, MqttClient } from 'mqtt';
import MqttContext from './Context';
import { ConnectorProps, IMqttContext } from './types';

export default function Connector({ children, brokerUrl, parserMethod }: ConnectorProps) {
  const clientRef = useRef<MqttClient | null>(null);
  const mountedRef = useRef(true);
  const [contextState, setContextState] = useState<IMqttContext>({
    connectionStatus: 'Offline',
    isClientReady: false,
  });

  useEffect(() => {
    mountedRef.current = true;
    if (clientRef.current || !brokerUrl) {
      return;
    }

    console.log('Connecting');
    const mqtt = connect(brokerUrl);
    clientRef.current = mqtt;
    setContextState((prevState) => ({
      ...prevState,
      connectionStatus: 'Connecting',
      client: mqtt,
    }));
    console.log('Got client from connect');
    mqtt.on('connect', () => {
      if (mountedRef.current) {
        console.log('Connected');
        setContextState((prevState) => ({
          ...prevState,
          connectionStatus: 'Connected',
          isClientReady: true,
        }));
      }
    });
    mqtt.on('reconnect', () => {
      if (mountedRef.current) {
        setContextState((prevState) => ({
          ...prevState,
          connectionStatus: 'Reconnecting',
        }));
      }
    });
    mqtt.on('error', (err) => {
      if (mountedRef.current) {
        console.log(`Connection error: ${err}`);
        setContextState((prevState) => ({
          ...prevState,
          connectionStatus: err,
        }));
      }
    });
    mqtt.on('offline', () => {
      if (mountedRef.current) {
        setContextState((prevState) => ({
          ...prevState,
          connectionStatus: 'Offline',
        }));
      }
    });
    mqtt.on('end', () => {
      if (mountedRef.current) {
        console.log('connection END');
        setContextState((prevState) => ({
          ...prevState,
          connectionStatus: 'Offline',
        }));
      }
    });
    mqtt.on('message', (topic) => {
      console.log(new Date().toLocaleTimeString(), `Message received: ${topic}`);
    });

    return () => {
      console.log('useEffect teardown', 'client: ', !!clientRef.current);
      if (mountedRef.current) {
        clientRef.current?.end(true);
        clientRef.current = null;
        setContextState((prevState) => ({
          ...prevState,
          client: null,
          isClientReady: false,
        }));
      }
      mountedRef.current = false;
    };
  }, [brokerUrl]);

  return <MqttContext.Provider value={contextState}>{children}</MqttContext.Provider>;
}
