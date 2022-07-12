import { matches } from 'mqtt-pattern';
import { useContext, useEffect, useRef } from 'react';

import MqttContext from '../components/Context';

export default function useSubscription<T>(
  topic: string | null,
  onMessageReceived: (message: T) => void
): void {
  const { client, isClientReady } = useContext(MqttContext);

  const savedOnMessageReceived = useRef(onMessageReceived);
  useEffect(() => {
    savedOnMessageReceived.current = onMessageReceived;
  }, [onMessageReceived]);

  const savedClient = useRef(client);
  useEffect(() => {
    savedClient.current = client;
  }, [client]);

  useEffect(() => {
    function messageReceived(receivedTopic: string, receivedMessage: any) {
      if (matches(topic, receivedTopic)) {
        const parsedMessage = receivedMessage.toString();
        const parsedObject = JSON.parse(parsedMessage);
        savedOnMessageReceived.current(parsedObject);
      }
    }

    if (topic === null || !isClientReady) {
      return;
    }

    savedClient.current?.subscribe(topic);
    savedClient.current?.on('message', messageReceived);

    return () => {
      savedClient.current?.unsubscribe(topic);
      savedClient.current?.off('message', messageReceived);
    };
  }, [isClientReady, topic]);
}
