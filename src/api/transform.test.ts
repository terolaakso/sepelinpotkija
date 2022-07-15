import { transformTrains } from '@/api/transform';
import { trainFixture } from '@/test/digitraffic.fixture';

describe('train transformation', () => {
  it('filters out cancelled trains', () => {
    const train = trainFixture({ cancelled: true });
    const transformed = transformTrains([train]);
    expect(transformed).toHaveLength(0);
  });

  it('filters out cancelled rows', () => {
    const train = trainFixture();
    train.timeTableRows[2].cancelled = true;
    train.timeTableRows[3].cancelled = true;

    const [transformed] = transformTrains([train]);

    expect(transformed.timetableRows).toHaveLength(2);
    expect(transformed.timetableRows).toEqual([
      expect.objectContaining({ stationShortCode: 'HPK' }),
      expect.objectContaining({ stationShortCode: 'KLO' }),
    ]);
  });

  it('interprets different row times correctly', () => {
    const train = trainFixture();
    train.timeTableRows[2].actualTime = '2022-07-15T07:00:38.000Z';
    train.timeTableRows[3].actualTime = undefined;
    train.timeTableRows[3].liveEstimateTime = '2022-07-15T07:16:58.000Z';

    const [transformed] = transformTrains([train]);
    const row2 = transformed.timetableRows[2];
    const row3 = transformed.timetableRows[3];

    expect(row2.time).toEqual(row2.actualTime);
    expect(row2.time).not.toEqual(row2.estimatedTime);
    expect(row2.time).toEqual(row2.bestDigitrafficTime);
    expect(row2.differenceInMinutes).toBe(1);

    expect(row3.time).toEqual(row3.estimatedTime);
    expect(row3.time).not.toEqual(row3.actualTime);
    expect(row3.time).toEqual(row3.bestDigitrafficTime);
    expect(row3.differenceInMinutes).toBe(2);

    expect(transformed.latestActualTimeIndex).toBe(2);
  });
});
