import { MqttClient, IClientOptions } from 'mqtt';

export interface Error {
  name: string;
  message: string;
  stack?: string;
}

export interface ConnectorProps {
  brokerUrl: string;
  options?: IClientOptions;
  parserMethod?: (message: any) => string;
  children: React.ReactNode;
}

export type ConnectionStatus =
  | 'Offline'
  | 'Connecting'
  | 'Connected'
  | 'Reconnecting'
  | 'Reconnected';

export interface IMqttContext {
  connectionStatus: ConnectionStatus | Error;
  isClientReady: boolean;
  client?: MqttClient | null;
  parserMethod?: (message: any) => string;
}

export interface IMessageStructure {
  [key: string]: string;
}

export interface IMessage {
  topic: string;
  message?: string | IMessageStructure;
}
