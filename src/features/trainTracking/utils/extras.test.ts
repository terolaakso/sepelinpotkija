import { DateTime } from 'luxon';

import { useTrainDataStore } from '@/stores/trainData';

import { trainEventFixture } from '../test/TrainEvent.fixture';
import { TrackSegmentCollection } from '../types/TrackSegmentExtras';
import { generateExtras } from '../utils/extras';

describe('creating extra infos', () => {
  beforeAll(() => {
    const { setExtras } = useTrainDataStore.getState();
    setExtras(extraData);
  });

  it('now < first < second', () => {
    const startTime = DateTime.now().plus({ minutes: 1 });
    const events = [
      trainEventFixture({ id: 'KUT', time: startTime }),
      trainEventFixture({ id: 'TKU', time: startTime.plus({ minutes: 10 }) }),
    ];

    const extras = generateExtras(events);

    expect(extras).toHaveLength(1);
    expect(extras).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'KUT', time: startTime, wikiPage: 'Asemasivu' }),
      ])
    );
  });

  it('first < now < second', () => {
    const now = DateTime.now();
    const events = [
      trainEventFixture({ id: 'KUT', time: now }),
      trainEventFixture({ id: 'TKU', time: now.plus({ minutes: 10 }) }),
    ];

    const extras = generateExtras(events);

    expect(extras).toHaveLength(2);
    expect(extras).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'KUT', time: now, wikiPage: 'Asemasivu' }),
        expect.objectContaining({
          id: 'Ikituuri',
          time: now.plus({ minutes: 2 }),
          wikiPage: null,
        }),
      ])
    );
  });

  it('first < second < now', () => {
    const now = DateTime.now();
    const events = [
      trainEventFixture({ id: 'KUT', time: now.minus({ minutes: 10 }) }),
      trainEventFixture({ id: 'TKU', time: now }),
    ];

    const extras = generateExtras(events);

    expect(extras).toHaveLength(1);
    expect(extras).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'TKU',
          time: now,
          wikiPage: null,
        }),
      ])
    );
  });

  it('reversed now < first < second', () => {
    const startTime = DateTime.now().plus({ minutes: 1 });
    const events = [
      trainEventFixture({ id: 'TKU', time: startTime }),
      trainEventFixture({ id: 'KUT', time: startTime.plus({ minutes: 10 }) }),
    ];

    const extras = generateExtras(events);

    expect(extras).toHaveLength(1);
    expect(extras).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'TKU', time: startTime, wikiPage: null }),
      ])
    );
  });

  it('reversed first < now < second', () => {
    const now = DateTime.now();
    const events = [
      trainEventFixture({ id: 'TKU', time: now }),
      trainEventFixture({ id: 'KUT', time: now.plus({ minutes: 10 }) }),
    ];

    const extras = generateExtras(events);

    expect(extras).toHaveLength(2);
    expect(extras).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'TKU', time: now, wikiPage: null }),
        expect.objectContaining({
          id: 'Aurajoki',
          time: now.plus({ minutes: 5 }),
          wikiPage: 'Siltasivu',
        }),
      ])
    );
  });

  it('reversed first < second < now', () => {
    const startTime = DateTime.now();
    const events = [
      trainEventFixture({ id: 'TKU', time: startTime.minus({ minutes: 10 }) }),
      trainEventFixture({ id: 'KUT', time: startTime }),
    ];

    const extras = generateExtras(events);

    expect(extras).toHaveLength(1);
    expect(extras).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'KUT',
          time: startTime,
          wikiPage: 'Asemasivu',
        }),
      ])
    );
  });
});

const extraData: TrackSegmentCollection = {
  'KUT-TKU': {
    locations: [
      {
        name: 'Kupittaa',
        position: 0,
        wikiPage: 'Asemasivu',
      },
      {
        name: 'Ikituuri',
        position: 0.2,
        wikiPage: null,
      },
      {
        name: 'Aurajoki',
        position: 0.5,
        wikiPage: 'Siltasivu',
      },
      {
        name: 'Turku',
        position: 1,
        wikiPage: null,
      },
    ],
  },
};
