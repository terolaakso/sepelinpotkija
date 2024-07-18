import { isNil } from 'lodash';
import { DateTime } from 'luxon';

import { useTrainDataStore } from '@/stores/trainData';
import { TimetableRow, Train } from '@/types/Train';
import { isNotNil } from '@/utils/misc';
import { timetableExpiresAt } from '@/utils/timetableCalculation';

import { StationEvent, StationEventType } from '../types/StationEvent';

export function calculateCurrentEventsForStation(
  trains: Train[],
  stationCode: string | null
): StationEvent[] {
  if (isNil(stationCode)) {
    return [];
  }
  const allEvents: StationEvent[] = trains
    .flatMap((train) => train.timetableRows.map((row, i) => ({ train, row, i })))
    .map(({ train, row, i }) => {
      if (row.stationShortCode === stationCode) {
        const type = calculateEventType(train.timetableRows, i);
        return createEvent(train, row.time, i, type);
      } else {
        return null;
      }
    })
    .filter(isNotNil)
    .sort((a, b) => a.time.toMillis() - b.time.toMillis());

  const withoutDuplicatePassings = allEvents.filter((event, i, arr) => {
    return (
      event.eventType !== StationEventType.Passing ||
      i === 0 ||
      arr[i - 1].name !== event.name ||
      arr[i - 1].time.toMillis() !== event.time.toMillis()
    );
  });

  const now = DateTime.now();
  const nextInFuture = withoutDuplicatePassings.findIndex((event) => event.time > now);
  const result = withoutDuplicatePassings.slice(Math.max(nextInFuture - 5, 0));
  return result;
}

function calculateEventType(rows: TimetableRow[], index: number): StationEventType {
  const row = rows[index];
  const isArrival = index % 2 === 1;
  const otherRow =
    index === 0 || index === rows.length - 1 ? null : isArrival ? rows[index + 1] : rows[index - 1];
  if (isNotNil(otherRow) && row.time.toMillis() === otherRow.time.toMillis()) {
    return StationEventType.Passing;
  }
  return isArrival ? StationEventType.Arrival : StationEventType.Departure;
}

function createEvent(
  train: Train,
  time: DateTime,
  index: number,
  eventType: StationEventType
): StationEvent {
  const stations = useTrainDataStore.getState().stations;
  const origin = stations[train.timetableRows[0].stationShortCode]?.name ?? '';
  const destination =
    stations[train.timetableRows[train.timetableRows.length - 1].stationShortCode]?.name ?? '';
  return {
    id: train.trainNumber + '-' + index,
    name: `${train.name} ${origin} - ${destination}`,
    lateCauses: train.currentLateCauses,
    lateMinutes: train.lateMinutes,
    lineId: train.lineId,
    track: train.timetableRows[index].track,
    isReady: train.isReady,
    expiresAt: timetableExpiresAt(train),
    time,
    eventType,
  };
}
