import { useMqttState } from '@/features/mqtt';

export default function Status() {
  const { connectionStatus } = useMqttState();

  return <div>{`Status: ${connectionStatus}`}</div>;
}
