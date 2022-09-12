import { DateTime } from 'luxon';

import { useTrainDataStore } from '@/stores/trainData';
import { timetableRowFixture } from '@/test/timetablerow.fixture';
import { trainFixture } from '@/test/train.fixture';

import { filterTrains, getOtherTrains } from './otherTrains';

describe('selecting trains to show', () => {
  it('should filter trains when not departed', () => {
    const data = fillDataToFilter([1, 7, 15]);
    const { result } = filterTrains(data);
    expect(result.length).toBe(2);
    expect(result[1].train.name).toBe('7');
  });

  it('should filter trains when recent trains since 5 mins', () => {
    const data = fillDataToFilter([-4, -3, 2, 11, 15]);

    const { result } = filterTrains(data);

    expect(result.length).toBe(3);
    expect(result[0].train.name).toBe('-4');
    expect(result[2].train.name).toBe('2');
  });

  it('should not filter trains when only recent trains since 5 mins', () => {
    const data = fillDataToFilter([-4, -3, 2, 11, 15]);

    const { result } = filterTrains(data);

    expect(result.length).toBe(3);
    expect(result[0].train.name).toBe('-4');
    expect(result[2].train.name).toBe('2');
  });

  it('should not filter trains when only recent trains since 10 mins', () => {
    const data = fillDataToFilter([-4, 2, 7, 15]);

    const { result } = filterTrains(data);

    expect(result.length).toBe(3);
    expect(result[0].train.name).toBe('-4');
    expect(result[2].train.name).toBe('7');
  });

  it('should filter trains when arrived to final station', () => {
    const data = fillDataToFilter([-3, -2]);

    const { result } = filterTrains(data);

    expect(result.length).toBe(2);
    expect(result[0].train.name).toBe('-3');
  });

  it('should filter future trains after 10 mins', () => {
    const data = fillDataToFilter([-2, 2, 7, 15]);

    const { result } = filterTrains(data);

    expect(result.length).toBe(3);
    expect(result[2].train.name).toBe('7');
  });

  it('should not filter the first future train if after 10 mins', () => {
    const data = fillDataToFilter([-2, 15, 20]);

    const { result } = filterTrains(data);

    expect(result.length).toBe(2);
    expect(result[1].train.name).toBe('15');
  });

  it('should filter future trains after filtering past train', () => {
    const data = fillDataToFilter([-2, 2, 15]);

    const { result } = filterTrains(data);

    expect(result.length).toBe(2);
    expect(result[0].train.name).toBe('-2');
    expect(result[1].train.name).toBe('2');
  });

  function fillDataToFilter(startMinutes: number[]) {
    const now = DateTime.now();

    const result = startMinutes.map((startMinute) => ({
      train: trainFixture({ trainNumber: startMinute, name: startMinute.toString() }),
      time: now.plus({ minutes: startMinute }),
    }));
    return result;
  }
});

describe('choosing encountering trains', () => {
  it('should include past encounter when previous station more than 10 mins away', () => {
    const { setTrains } = useTrainDataStore.getState();
    const now = DateTime.now();
    const thisTrain = trainFixture({
      trainNumber: 1,
      timetableRows: [
        timetableRowFixture({
          stationShortCode: 'TKU',
          time: now.minus({ minutes: 15 }),
        }),
        timetableRowFixture({
          stationShortCode: 'KUT',
          time: now.plus({ minutes: 5 }),
        }),
      ],
    });
    const otherTrain = trainFixture({
      trainNumber: 2,
      timetableRows: [
        timetableRowFixture({
          stationShortCode: 'KUT',
          time: now.minus({ minutes: 5 }),
        }),
        timetableRowFixture({
          stationShortCode: 'TKU',
          time: now.plus({ minutes: 5 }),
        }),
      ],
    });
    setTrains([thisTrain, otherTrain]);

    const result = getOtherTrains(thisTrain);
    expect(result.nextTrain).toBeNull();
    expect(result.result).toEqual([
      expect.objectContaining({
        id: '2',
      }),
    ]);
  });
});
