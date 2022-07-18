import { DateTime } from 'luxon';

import { useTrainDataStore } from '@/stores/trainData';
import { timetableRowFixture } from '@/test/timetablerow.fixture';
import { trainFixture } from '@/test/train.fixture';
import {
  FirstLevelCauseCollection,
  SecondLevelCauseCollection,
  ThirdLevelCauseCollection,
} from '@/types/digitraffic';
import { RowCause } from '@/types/Train';

import { calculateCauses } from './lateCauses';

describe('late causes', () => {
  const firstLevelCauses: FirstLevelCauseCollection = {
    '1': {
      id: 1,
      categoryName: 'First',
      categoryCode: '',
      validFrom: '',
    },
  };
  const secondLevelCauses: SecondLevelCauseCollection = {
    '10': {
      id: 10,
      detailedCategoryName: 'Second',
      detailedCategoryCode: '',
      validFrom: '',
    },
  };
  const thirdLevelCauses: ThirdLevelCauseCollection = {
    '100': {
      id: 100,
      thirdCategoryName: 'Third',
      thirdCategoryCode: '',
      validFrom: '',
    },
    '101': {
      id: 101,
      thirdCategoryName: 'Another Third',
      thirdCategoryCode: '',
      validFrom: '',
    },
  };
  const cause1: RowCause = {
    level1CodeId: 1,
    level2CodeId: 10,
    level3CodeId: 100,
  };

  const cause2: RowCause = {
    level1CodeId: 1,
    level2CodeId: 10,
    level3CodeId: 101,
  };

  beforeAll(() => {
    const { setFirstLevelCauses, setSecondLevelCauses, setThirdLevelCauses } =
      useTrainDataStore.getState();

    setFirstLevelCauses(firstLevelCauses);
    setSecondLevelCauses(secondLevelCauses);
    setThirdLevelCauses(thirdLevelCauses);
  });

  it('train became late after leaving on time', () => {
    const train = trainFixture({
      timetableRows: [
        timetableRowFixture(),
        timetableRowFixture({
          scheduledTime: DateTime.fromISO('2018-12-30T06:09:00.000Z'),
          actualTime: DateTime.fromISO('2018-12-30T06:10:00.000Z'),
          differenceInMinutes: 1,
          lateCauses: [cause1],
        }),
      ],
    });

    const causes = calculateCauses(train);

    expect(causes).toHaveLength(1);
    expect(causes[0].lateMinutes).toBe(1);
    expect(causes[0].name.startsWith('Third')).toBe(true);
  });

  it('train became late with two simultaneous causes', () => {
    const train = trainFixture({
      timetableRows: [
        timetableRowFixture(),
        timetableRowFixture({
          scheduledTime: DateTime.fromISO('2018-12-30T06:09:00.000Z'),
          actualTime: DateTime.fromISO('2018-12-30T06:19:00.000Z'),
          differenceInMinutes: 10,
          lateCauses: [cause1, cause2],
        }),
      ],
    });

    const causes = calculateCauses(train);

    expect(causes).toHaveLength(2);
    expect(causes).toEqual(
      expect.arrayContaining([
        { lateMinutes: 5, name: expect.stringMatching(/^Third/) },
        { lateMinutes: 5, name: expect.stringMatching(/^Another Third/) },
      ])
    );
  });

  it('late train becomes more late with another reason', () => {
    const train = trainFixture({
      timetableRows: [
        timetableRowFixture({
          scheduledTime: DateTime.fromISO('2018-12-30T06:00:00.000Z'),
          actualTime: DateTime.fromISO('2018-12-30T06:10:00.000Z'),
          differenceInMinutes: 10,
          lateCauses: [cause1],
        }),
        timetableRowFixture({
          scheduledTime: DateTime.fromISO('2018-12-30T06:05:00.000Z'),
          actualTime: DateTime.fromISO('2018-12-30T06:16:00.000Z'),
          differenceInMinutes: 11,
          lateCauses: [cause2],
        }),
      ],
    });

    const causes = calculateCauses(train);

    expect(causes).toHaveLength(2);
    expect(causes).toEqual(
      expect.arrayContaining([
        { lateMinutes: 10, name: expect.stringMatching(/^Third/) },
        { lateMinutes: 1, name: expect.stringMatching(/^Another Third/) },
      ])
    );
  });

  it('late train becomes more late with the same reason', () => {
    const train = trainFixture({
      timetableRows: [
        timetableRowFixture({
          scheduledTime: DateTime.fromISO('2018-12-30T06:00:00.000Z'),
          actualTime: DateTime.fromISO('2018-12-30T06:10:00.000Z'),
          differenceInMinutes: 10,
          lateCauses: [cause1],
        }),
        timetableRowFixture({
          scheduledTime: DateTime.fromISO('2018-12-30T06:05:00.000Z'),
          actualTime: DateTime.fromISO('2018-12-30T06:16:00.000Z'),
          differenceInMinutes: 11,
          lateCauses: [cause1],
        }),
      ],
    });

    const causes = calculateCauses(train);

    expect(causes).toHaveLength(1);
    expect(causes).toEqual(
      expect.arrayContaining([{ lateMinutes: 11, name: expect.stringMatching(/^Third/) }])
    );
  });

  it('train was less late before it got late cause', () => {
    const train = trainFixture({
      latestActualTimeIndex: 2,
      timetableRows: [
        timetableRowFixture({
          scheduledTime: DateTime.fromISO('2018-12-30T06:00:00.000Z'),
          actualTime: DateTime.fromISO('2018-12-30T06:10:00.000Z'),
          differenceInMinutes: 10,
          lateCauses: [cause1],
        }),
        timetableRowFixture({
          scheduledTime: DateTime.fromISO('2018-12-30T06:05:00.000Z'),
          actualTime: DateTime.fromISO('2018-12-30T06:10:00.000Z'),
          differenceInMinutes: 5,
          lateCauses: [],
        }),
        timetableRowFixture({
          scheduledTime: DateTime.fromISO('2018-12-30T06:10:00.000Z'),
          actualTime: DateTime.fromISO('2018-12-30T06:21:00.000Z'),
          differenceInMinutes: 11,
          lateCauses: [cause2],
        }),
      ],
    });

    const causes = calculateCauses(train);

    expect(causes).toHaveLength(2);
    expect(causes).toEqual(
      expect.arrayContaining([
        { lateMinutes: 6, name: expect.stringMatching(/^Another Third/) },
        { lateMinutes: 5, name: expect.stringMatching(/^Third/) },
      ])
    );
  });

  it('train was more late before it got late cause', () => {
    const train = trainFixture({
      latestActualTimeIndex: 2,
      timetableRows: [
        timetableRowFixture({
          scheduledTime: DateTime.fromISO('2018-12-30T06:00:00.000Z'),
          actualTime: DateTime.fromISO('2018-12-30T06:10:00.000Z'),
          differenceInMinutes: 10,
          lateCauses: [cause1],
        }),
        timetableRowFixture({
          scheduledTime: DateTime.fromISO('2018-12-30T06:05:00.000Z'),
          actualTime: DateTime.fromISO('2018-12-30T06:20:00.000Z'),
          differenceInMinutes: 15,
          lateCauses: [],
        }),
        timetableRowFixture({
          scheduledTime: DateTime.fromISO('2018-12-30T06:10:00.000Z'),
          actualTime: DateTime.fromISO('2018-12-30T06:21:00.000Z'),
          differenceInMinutes: 11,
          lateCauses: [cause2],
        }),
      ],
    });

    const causes = calculateCauses(train);

    expect(causes).toHaveLength(2);
    expect(causes).toEqual(
      expect.arrayContaining([
        { lateMinutes: 10, name: expect.stringMatching(/^Third/) },
        { lateMinutes: 1, name: expect.stringMatching(/^Another Third/) },
      ])
    );
  });

  it('train was was late but not anymore', () => {
    const train = trainFixture({
      latestActualTimeIndex: 2,
      timetableRows: [
        timetableRowFixture({
          scheduledTime: DateTime.fromISO('2018-12-30T06:00:00.000Z'),
          actualTime: DateTime.fromISO('2018-12-30T06:00:00.000Z'),
          differenceInMinutes: 0,
          lateCauses: [],
        }),
        timetableRowFixture({
          scheduledTime: DateTime.fromISO('2018-12-30T06:05:00.000Z'),
          actualTime: DateTime.fromISO('2018-12-30T06:06:00.000Z'),
          differenceInMinutes: 1,
          lateCauses: [cause1],
        }),
        timetableRowFixture({
          scheduledTime: DateTime.fromISO('2018-12-30T06:10:00.000Z'),
          actualTime: DateTime.fromISO('2018-12-30T06:09:00.000Z'),
          differenceInMinutes: -1,
          lateCauses: [],
        }),
      ],
    });

    const causes = calculateCauses(train);

    expect(causes).toHaveLength(0);
  });

  it('train was early before it got late', () => {
    const train = trainFixture({
      latestActualTimeIndex: 2,
      timetableRows: [
        timetableRowFixture({
          scheduledTime: DateTime.fromISO('2018-12-30T06:00:00.000Z'),
          actualTime: DateTime.fromISO('2018-12-30T06:00:00.000Z'),
          differenceInMinutes: 0,
          lateCauses: [],
        }),
        timetableRowFixture({
          scheduledTime: DateTime.fromISO('2018-12-30T06:05:00.000Z'),
          actualTime: DateTime.fromISO('2018-12-30T06:04:00.000Z'),
          differenceInMinutes: -1,
          lateCauses: [],
        }),
        timetableRowFixture({
          scheduledTime: DateTime.fromISO('2018-12-30T06:10:00.000Z'),
          actualTime: DateTime.fromISO('2018-12-30T06:11:00.000Z'),
          differenceInMinutes: 1,
          lateCauses: [cause1],
        }),
      ],
    });

    const causes = calculateCauses(train);

    expect(causes).toHaveLength(1);
    expect(causes).toEqual(
      expect.arrayContaining([{ lateMinutes: 1, name: expect.stringMatching(/^Third/) }])
    );
  });
});
