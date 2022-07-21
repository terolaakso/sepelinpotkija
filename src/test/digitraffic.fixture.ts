import { TimeTableRow, TimeTableRowType, TimetableType, Train } from '@/types/digitraffic';

export interface TrainWithTimetableRows extends Omit<Train, 'timeTableRows'> {
  timeTableRows: TimeTableRow[];
}

export function trainFixture(props?: Partial<Train>): TrainWithTimetableRows {
  return {
    ...defaultTrain,
    timeTableRows: [
      timetableRowFixture(),
      timetableRowFixture({
        stationShortCode: 'KLO',
        type: TimeTableRowType.ARRIVAL,
        trainStopping: false,
        commercialStop: false,
        scheduledTime: '2022-07-15T06:09:00.000Z',
        actualTime: '2022-07-15T06:09:00.000Z',
      }),
      timetableRowFixture({
        stationShortCode: 'KLO',
        trainStopping: false,
        commercialStop: false,
        scheduledTime: '2022-07-15T06:09:00.000Z',
        actualTime: '2022-07-15T06:09:00.000Z',
      }),
      timetableRowFixture({
        stationShortCode: 'VLP',
        type: TimeTableRowType.ARRIVAL,
        trainStopping: true,
        commercialStop: true,
        scheduledTime: '2022-07-15T06:20:00.000Z',
        actualTime: '2022-07-15T06:20:00.000Z',
      }),
    ],
    ...props,
  };
}

const defaultTimetableRow: TimeTableRow = {
  stationShortCode: 'HPK',
  stationUICCode: 200,
  countryCode: 'FI',
  type: TimeTableRowType.DEPARTURE,
  trainStopping: true,
  commercialStop: true,
  commercialTrack: '5',
  cancelled: false,
  scheduledTime: '2022-07-15T06:00:00.000Z',
  liveEstimateTime: undefined,
  actualTime: '2022-07-15T06:00:00.000Z',
  differenceInMinutes: 0,
};

const defaultTrain: TrainWithTimetableRows = {
  trainNumber: 12920,
  departureDate: '2022-07-15',
  operatorUICCode: 3191,
  operatorShortCode: 'hmvy',
  trainType: 'V',
  trainCategory: 'Long-distance',
  commuterLineID: '',
  runningCurrently: true,
  cancelled: false,
  version: 283181966659,
  timetableType: TimetableType.ADHOC,
  timetableAcceptanceDate: '2022-07-13T07:55:43.000Z',
  timeTableRows: [],
};

export function timetableRowFixture(props?: Partial<TimeTableRow>): TimeTableRow {
  return {
    ...defaultTimetableRow,
    ...props,
  };
}
