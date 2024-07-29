import { isNil } from 'lodash';
import { DateTime } from 'luxon';

import { calculateCauses } from '@/features/lateCauses';
import { useTrainDataStore } from '@/stores/trainData';
import { TimetableRow, Train } from '@/types/Train';
import { isNotNil } from '@/utils/misc';
import { calculateLateMins, timetableExpiresAt } from '@/utils/timetableCalculation';

import { TrainEvent, TrainEventType } from '../../../types/TrainEvent';

const MAX_EVENTS_IN_FUTURE = 5;

export function calculateCurrentEventsForStation(
  trains: Train[],
  stationCode: string | null
): TrainEvent[] {
  if (isNil(stationCode)) {
    return [];
  }
  const allEvents: TrainEvent[] = trains
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
      event.eventType !== TrainEventType.Passing ||
      i === 0 ||
      arr[i - 1].name !== event.name ||
      arr[i - 1].time.toMillis() !== event.time.toMillis()
    );
  });

  const now = DateTime.now();
  const nextInFuture = withoutDuplicatePassings.findIndex((event) => event.time > now);
  const result = withoutDuplicatePassings.slice(Math.max(nextInFuture - MAX_EVENTS_IN_FUTURE, 0));
  return result;
}

function calculateEventType(rows: TimetableRow[], index: number): TrainEventType {
  const row = rows[index];
  const isArrival = index % 2 === 1;
  const otherRow =
    index === 0 || index === rows.length - 1 ? null : isArrival ? rows[index + 1] : rows[index - 1];
  if (isNotNil(otherRow) && row.time.toMillis() === otherRow.time.toMillis()) {
    return TrainEventType.Passing;
  }
  return isArrival ? TrainEventType.Arrival : TrainEventType.Departure;
}

function getExpiration(train: Train, time: DateTime): DateTime | null {
  const expiresAt = timetableExpiresAt(train);
  return expiresAt !== null && expiresAt < time ? expiresAt : null;
}

function createEvent(
  train: Train,
  time: DateTime,
  index: number,
  eventType: TrainEventType
): TrainEvent {
  const stations = useTrainDataStore.getState().stations;
  const origin = stations[train.timetableRows[0].stationShortCode]?.name ?? '';
  const destination =
    stations[train.timetableRows[train.timetableRows.length - 1].stationShortCode]?.name ?? '';
  return {
    name: `${train.name} ${origin} - ${destination}`,
    lateCauses: calculateCauses(train.timetableRows, index),
    lateMinutes: calculateLateMins(train.timetableRows, index, train.latestActualTimeIndex),
    lineId: train.lineId,
    track: train.timetableRows[index].track,
    isReady: train.isReady,
    expiresAt: getExpiration(train, time),
    time,
    eventType,
  };
}
