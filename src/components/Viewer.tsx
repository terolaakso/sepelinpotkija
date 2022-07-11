import { useState } from 'react';
import useSubscription from '../operations/mqtt/useSubscription';

export default function Viewer() {
  function messageHandler(msg: any) {
    setMessage(msg.toString());
  }

  const [message, setMessage] = useState('');
  useSubscription('train-locations/#', messageHandler);

  return (
    <>
      <h1>Latest message</h1>
      <div>{message}</div>
    </>
  );
}
