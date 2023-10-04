import { connect, MqttClient } from 'mqtt';
import { useState, useEffect, useRef } from 'react';

import { useTrainDataStore } from '@/stores/trainData';

import { ConnectorProps, IMqttContext } from '../types';

import MqttContext from './Context';

export default function Connector({ children, brokerUrl }: ConnectorProps) {
  const clientRef = useRef<MqttClient | null>(null);
  const mountedRef = useRef(true);
  const [contextState, setContextState] = useState<IMqttContext>({
    connectionStatus: 'Offline',
    isClientReady: false,
  });
  const setConnectionRestored = useTrainDataStore((state) => state.setConnectionRestored);

  useEffect(() => {
    mountedRef.current = true;
    if (clientRef.current || !brokerUrl) {
      return;
    }

    const mqtt = connect(brokerUrl);
    clientRef.current = mqtt;
    setContextState((prevState) => ({
      ...prevState,
      connectionStatus: 'Connecting',
      client: mqtt,
    }));
    mqtt.on('connect', () => {
      if (mountedRef.current) {
        setContextState((prevState) => {
          return {
            ...prevState,
            connectionStatus:
              prevState.connectionStatus === 'Reconnecting' ? 'Reconnected' : 'Connected',
            isClientReady: true,
          };
        });
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
        setContextState((prevState) => ({
          ...prevState,
          connectionStatus: 'Offline',
        }));
      }
    });

    return () => {
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
  }, [brokerUrl, setConnectionRestored]);

  useEffect(() => {
    if (contextState.connectionStatus === 'Reconnected') {
      setConnectionRestored();
    }
  }, [contextState.connectionStatus, setConnectionRestored]);

  return <MqttContext.Provider value={contextState}>{children}</MqttContext.Provider>;
}
