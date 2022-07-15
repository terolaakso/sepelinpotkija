export enum TimetableType {
  REGULAR = 'REGULAR',
  ADHOC = 'ADHOC',
}

export enum EstimateSource {
  LIIKEUSER = 'LIIKE_USER',
  MIKUUSER = 'MIKU_USER',
  LIIKEAUTOMATIC = 'LIIKE_AUTOMATIC',
  UNKNOWN = 'UNKNOWN',
  COMBOCALC = 'COMBOCALC',
}

export enum TimeTableRowType {
  ARRIVAL = 'ARRIVAL',
  DEPARTURE = 'DEPARTURE',
}

export enum TrainReadySource {
  PHONE = 'PHONE',
  LIIKE = 'LIIKE',
  UNKNOWN = 'UNKNOWN',
  KUPLA = 'KUPLA',
}

export enum StationType {
  STATION = 'STATION',
  STOPPING_POINT = 'STOPPING_POINT',
  TURNOUT_IN_THE_OPEN_LINE = 'TURNOUT_IN_THE_OPEN_LINE',
}

export interface Train {
  /**
   * Is the train wholly cancelled
   * @type {boolean}
   * @memberof Train
   */
  cancelled?: boolean;
  /**
   *
   * @type {string}
   * @memberof Train
   */
  commuterLineID?: string;
  /**
   * Is the train deleted which means cancelled 10 days before its departure date
   * @type {boolean}
   * @memberof Train
   */
  deleted?: boolean;
  /**
   * Date of the train's first departure
   * @type {string}
   * @memberof Train
   */
  departureDate: string;
  /**
   * Short code of the operator
   * @type {string}
   * @memberof Train
   */
  operatorShortCode?: string;
  /**
   * Official UIC code of the operator
   * @type {number}
   * @memberof Train
   */
  operatorUICCode?: number;
  /**
   * Is the train running currently or does it have actual times
   * @type {boolean}
   * @memberof Train
   */
  runningCurrently?: boolean;
  /**
   *
   * @type {Array<TimeTableRow>}
   * @memberof Train
   */
  timeTableRows?: Array<TimeTableRow>;
  /**
   * When was this train accepted to run on Finnish railways by the FTA
   * @type {Date}
   * @memberof Train
   */
  timetableAcceptanceDate?: string;
  /**
   * Is the train ADHOC or REGULAR. REGULAR trains are run for example every monday, ADHOC trains are one-time trains
   * @type {string}
   * @memberof Train
   */
  timetableType?: TimetableType;
  /**
   *
   * @type {string}
   * @memberof Train
   */
  trainCategory?: string;
  /**
   * Identifies the train inside a single departure date
   * @type {number}
   * @memberof Train
   */
  trainNumber: number;
  /**
   *
   * @type {string}
   * @memberof Train
   */
  trainType?: string;
  /**
   * When was train last modified
   * @type {number}
   * @memberof Train
   */
  version?: number;
}

export interface TimeTableRow {
  /**
   * Actual time when train departured or arrived on the station
   * @type {Date}
   * @memberof TimeTableRow
   */
  actualTime?: string;
  /**
   * Is the schedule part cancelled
   * @type {boolean}
   * @memberof TimeTableRow
   */
  cancelled?: boolean;
  /**
   *
   * @type {Array<Cause>}
   * @memberof TimeTableRow
   */
  causes?: Array<Cause>;
  /**
   * Is the stop 'commercial' ie. loading/unloading of passengers or cargo
   * @type {boolean}
   * @memberof TimeTableRow
   */
  commercialStop?: boolean;
  /**
   * Track where the train stops
   * @type {string}
   * @memberof TimeTableRow
   */
  commercialTrack?: string;
  /**
   *
   * @type {string}
   * @memberof TimeTableRow
   */
  countryCode?: string;
  /**
   * Difference between schedule and actual time in minutes
   * @type {number}
   * @memberof TimeTableRow
   */
  differenceInMinutes?: number;
  /**
   * Source for the estimate
   * @type {string}
   * @memberof TimeTableRow
   */
  estimateSource?: EstimateSource;
  /**
   * Estimated time for departure/arrival of the train
   * @type {Date}
   * @memberof TimeTableRow
   */
  liveEstimateTime?: string;
  /**
   * Scheduled time for departure/arrival of the train
   * @type {Date}
   * @memberof TimeTableRow
   */
  scheduledTime?: string;
  /**
   *
   * @type {string}
   * @memberof TimeTableRow
   */
  stationShortCode?: string;
  /**
   *
   * @type {number}
   * @memberof TimeTableRow
   */
  stationUICCode?: number;
  /**
   *
   * @type {TrainReady}
   * @memberof TimeTableRow
   */
  trainReady?: TrainReady;
  /**
   * Does the train actual stop on the station
   * @type {boolean}
   * @memberof TimeTableRow
   */
  trainStopping?: boolean;
  /**
   *
   * @type {string}
   * @memberof TimeTableRow
   */
  type?: TimeTableRowType;
  /**
   * Set if the train is delayed, but it is impossible to estimate for how long
   * @type {boolean}
   * @memberof TimeTableRow
   */
  unknownDelay?: boolean;
}

export interface Cause {
  /**
   * Official code
   * @type {string}
   * @memberof Cause
   */
  categoryCode: string;
  /**
   *
   * @type {number}
   * @memberof Cause
   */
  categoryCodeId?: number;
  /**
   * Official name
   * @type {string}
   * @memberof Cause
   */
  categoryName: string;
  /**
   * Detailed description
   * @type {string}
   * @memberof Cause
   */
  description?: string;
  /**
   *
   * @type {string}
   * @memberof Cause
   */
  detailedCategoryCode?: string;
  /**
   *
   * @type {number}
   * @memberof Cause
   */
  detailedCategoryCodeId?: number;
  /**
   *
   * @type {string}
   * @memberof Cause
   */
  detailedCategoryName?: string;
  /**
   *
   * @type {number}
   * @memberof Cause
   */
  id?: number;
  /**
   *
   * @type {PassengerTerm}
   * @memberof Cause
   */
  passengerTerm?: PassengerTerm;
  /**
   *
   * @type {string}
   * @memberof Cause
   */
  thirdCategoryCode?: string;
  /**
   *
   * @type {number}
   * @memberof Cause
   */
  thirdCategoryCodeId?: number;
  /**
   *
   * @type {string}
   * @memberof Cause
   */
  thirdCategoryName?: string;
  /**
   * Start date when this code is used
   * @type {string}
   * @memberof Cause
   */
  validFrom: string;
  /**
   * End date when this code is used. Empty means category is used until further notice
   * @type {string}
   * @memberof Cause
   */
  validTo?: string;
}

export interface TrainReady {
  /**
   * Was the permission given
   * @type {boolean}
   * @memberof TrainReady
   */
  accepted?: boolean;
  /**
   * How was the permission given
   * @type {string}
   * @memberof TrainReady
   */
  source?: TrainReadySource;
  /**
   * When was the permission given
   * @type {Date}
   * @memberof TrainReady
   */
  timestamp?: string;
}

export interface PassengerTerm {
  /**
   * English passenger friendly term for the code
   * @type {string}
   * @memberof PassengerTerm
   */
  en?: string;
  /**
   * Finnish passenger friendly term for the code
   * @type {string}
   * @memberof PassengerTerm
   */
  fi?: string;
  /**
   * Swedish passenger friendly term for the code
   * @type {string}
   * @memberof PassengerTerm
   */
  sv?: string;
}

export interface GpsLocation {
  trainNumber: number;
  departureDate: string;
  timestamp: string;
  location: {
    coordinates: [number, number];
  };
  speed: number;
}

export interface Station {
  passengerTraffic: boolean;
  type: StationType;
  stationName: string;
  stationShortCode: string;
  stationUICCode: number;
  countryCode: string;
  longitude: number;
  latitude: number;
}

export interface FirstLevelCause {
  categoryCode: string;
  categoryName: string;
  validFrom: string;
  id: number;
}

export interface SecondLevelCause {
  detailedCategoryCode: string;
  detailedCategoryName: string;
  validFrom: string;
  id: number;
}

export interface ThirdLevelCause {
  thirdCategoryCode: string;
  thirdCategoryName: string;
  validFrom: string;
  id: number;
}

export interface FirstLevelCauseCollection {
  [id: number]: FirstLevelCause | undefined;
}

export interface SecondLevelCauseCollection {
  [id: number]: SecondLevelCause | undefined;
}

export interface ThirdLevelCauseCollection {
  [id: number]: ThirdLevelCause | undefined;
}
