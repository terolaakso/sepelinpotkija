import useMqttState from '@/hooks/mqtt/useMqttState';

export default function Status() {
  const { connectionStatus } = useMqttState();

  return <div>{`Status: ${connectionStatus}`}</div>;
}
