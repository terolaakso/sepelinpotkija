/* istanbul ignore file */

import { createContext } from "react";

import { IMqttContext } from "./types";

const MqttContext = createContext<IMqttContext>({} as IMqttContext);

export default MqttContext;
