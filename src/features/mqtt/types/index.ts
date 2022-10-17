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

export interface IMqttContext {
  connectionStatus: string | Error;
  isClientReady: boolean;
  isConnectionDropped: boolean;
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

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
