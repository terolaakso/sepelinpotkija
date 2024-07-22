import { DateTime } from 'luxon';

import { StopType, Train } from '@/types/Train';

import { getCurrentCommercialStops, getCurrentStations } from './stations';

describe('selecting events', () => {
  it('should return correct commercial stops when train not departed', () => {
    const { train } = getTrainData();
    const result = getCurrentCommercialStops(train, 0);
    expect(result.length).toBe(2);

    expect(result[0].id).toBe('TKU');
    expect(result[0].departureTime).toBeNull();

    expect(result[1].id).toBe('KUT');
    expect(result[1].departureTime).not.toBeNull();
    expect(result[1].time < (result[1].departureTime ?? DateTime.fromMillis(0))).toBe(true);
  });

  it('should return correct stations when train not departed', () => {
    const { train } = getTrainData();
    const result = getCurrentStations(train, 0);
    expect(result.length).toBe(2);

    expect(result[0].id).toBe('TKU');
    expect(result[0].departureTime).toBeNull();

    expect(result[1].id).toBe('KUT');
    expect(result[1].departureTime).not.toBeNull();
    expect(result[1].time < (result[1].departureTime ?? DateTime.fromMillis(0))).toBe(true);
  });

  it('should return correct commercial stops before arriving to first stop', () => {
    const { train } = getTrainData();
    const result = getCurrentCommercialStops(train, 1);
    expect(result.length).toBe(1);

    expect(result[0].id).toBe('KUT');
    expect(result[0].departureTime).not.toBeNull();
    expect(result[0].time < (result[0].departureTime ?? DateTime.fromMillis(0))).toBe(true);
  });

  it('should return correct stations before arriving to first station', () => {
    const { train } = getTrainData();
    const result = getCurrentStations(train, 1);
    expect(result.length).toBe(2);

    expect(result[0].id).toBe('TKU');
    expect(result[0].departureTime).toBeNull();
    expect(result[1].id).toBe('KUT');
    expect(result[1].departureTime).not.toBeNull();
  });

  it('should return correct commercial stops when stopped', () => {
    const { train } = getTrainData();
    const result = getCurrentCommercialStops(train, 2);
    expect(result.length).toBe(2);

    expect(result[0].id).toBe('KUT');
    expect(result[0].departureTime).not.toBeNull();
    expect(result[0].time < (result[0].departureTime ?? DateTime.fromMillis(0))).toBe(true);

    expect(result[1].id).toBe('PO');
    expect(result[1].departureTime).not.toBeNull();
    expect(result[1].time < (result[1].departureTime ?? DateTime.fromMillis(0))).toBe(true);
  });

  it('should return correct stations when stopped', () => {
    const { train } = getTrainData();
    const result = getCurrentStations(train, 2);
    expect(result.length).toBe(3);

    expect(result[0].id).toBe('TKU');
    expect(result[0].departureTime).toBeNull();
    expect(result[1].id).toBe('KUT');
    expect(result[1].departureTime).not.toBeNull();
    expect(result[2].id).toBe('PIK');
    expect(result[2].departureTime).not.toBeNull(); // Piikkiö has different arrival and departure times by couple of seconds
  });

  it('should return correct commercial stops after passing a station', () => {
    const { train } = getTrainData();
    const result = getCurrentCommercialStops(train, 5);

    expect(result.length).toBe(1);

    expect(result[0].id).toBe('PO');
    expect(result[0].departureTime).not.toBeNull();
    expect(result[0].time < (result[0].departureTime ?? DateTime.fromMillis(0))).toBe(true);
  });

  it('should return correct stations after passing a station', () => {
    const { train } = getTrainData();
    const result = getCurrentStations(train, 5); // next stop paimio
    expect(result.length).toBe(2);

    expect(result[0].id).toBe('PIK');
    expect(result[0].departureTime).not.toBeNull();
    expect(result[0].time < (result[0].departureTime ?? DateTime.fromMillis(0))).toBe(true);

    expect(result[1].id).toBe('PO');
    expect(result[1].departureTime).not.toBeNull();
    expect(result[1].time < (result[1].departureTime ?? DateTime.fromMillis(0))).toBe(true);
  });

  it('should return correct commercial stops before arriving to final station', () => {
    const { train } = getTrainData();
    const result = getCurrentCommercialStops(train, 13);

    expect(result.length).toBe(1);

    expect(result[0].id).toBe('HKI');
    expect(result[0].departureTime).toBeNull();
  });

  it('should return correct stations before arriving to final station', () => {
    const { train } = getTrainData();
    const result = getCurrentStations(train, 13); // next stop helsinki
    expect(result.length).toBe(2);

    expect(result[0].id).toBe('PKU');
    expect(result[0].departureTime).toBeNull();

    expect(result[1].id).toBe('HKI');
    expect(result[1].departureTime).toBeNull();
  });

  it('should return correct commercial stops after arriving to final station', () => {
    const { train } = getTrainData();
    const result = getCurrentCommercialStops(train, 14); // at helsinki
    expect(result.length).toBe(0);
  });

  it('should return correct stations after arriving to final station', () => {
    const { train } = getTrainData();
    const result = getCurrentStations(train, 14); // at helsinki
    expect(result.length).toBe(2);

    expect(result[0].id).toBe('PKU');
    expect(result[0].departureTime).toBeNull();

    expect(result[1].id).toBe('HKI');
    expect(result[1].departureTime).toBeNull();
  });

  function getTrainData() {
    const data: {
      train: Train;
    } = {
      train: {
        departureDate: '2018-12-30',
        latestActualTimeIndex: 0,
        timestamp: DateTime.now(),
        gpsFixAttemptTimestamp: DateTime.now(),
        version: 1,
        trainNumber: 1948,
        name: 'MUS 1948',
        currentSpeed: 0,
        currentLateCauses: [],
        latestGpsIndex: 0,
        lateMinutes: 0,
        isReady: false,
        lineId: null,
        timetableRows: [
          {
            stationShortCode: 'TKU',
            stopType: StopType.Commercial,
            scheduledTime: DateTime.fromISO('2018-12-30T06:03:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T05:44:00.000Z'),
            time: DateTime.fromISO('2018-12-30T06:03:00.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T06:03:00.000Z'),
            estimatedTime: null,
            isTrainReady: true,
            lateCauses: [],
            track: null,
          },
          {
            stationShortCode: 'KUT',
            stopType: StopType.Commercial,
            scheduledTime: DateTime.fromISO('2018-12-30T06:09:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T06:09:44.000Z'),
            time: DateTime.fromISO('2018-12-30T06:09:44.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T06:09:44.000Z'),
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
            track: null,
          },
          {
            stationShortCode: 'KUT',
            stopType: StopType.Commercial,
            scheduledTime: DateTime.fromISO('2018-12-30T06:11:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T06:11:30.000Z'),
            time: DateTime.fromISO('2018-12-30T06:11:30.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T06:11:30.000Z'),
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
            track: null,
          },
          {
            stationShortCode: 'PIK',
            stopType: StopType.None,
            scheduledTime: DateTime.fromISO('2018-12-30T06:26:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T06:25:53.000Z'),
            time: DateTime.fromISO('2018-12-30T06:25:53.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T06:25:53.000Z'),
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
            track: null,
          },
          {
            stationShortCode: 'PIK',
            stopType: StopType.None,
            scheduledTime: DateTime.fromISO('2018-12-30T06:26:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T06:26:03.000Z'),
            time: DateTime.fromISO('2018-12-30T06:26:03.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T06:26:03.000Z'),
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
            track: null,
          },
          {
            stationShortCode: 'PO',
            stopType: StopType.Commercial,
            scheduledTime: DateTime.fromISO('2018-12-30T06:38:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T06:37:55.000Z'),
            time: DateTime.fromISO('2018-12-30T06:37:55.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T06:37:55.000Z'),
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
            track: null,
          },
          {
            stationShortCode: 'PO',
            stopType: StopType.Commercial,
            scheduledTime: DateTime.fromISO('2018-12-30T06:45:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T06:47:21.000Z'),
            time: DateTime.fromISO('2018-12-30T06:47:21.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T06:47:21.000Z'),
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
            track: null,
          },
          {
            stationShortCode: 'SLO',
            stopType: StopType.Commercial,
            scheduledTime: DateTime.fromISO('2018-12-30T07:13:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T07:12:58.000Z'),
            time: DateTime.fromISO('2018-12-30T07:12:58.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T07:12:58.000Z'),
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
            track: null,
          },
          {
            stationShortCode: 'SLO',
            stopType: StopType.Commercial,
            scheduledTime: DateTime.fromISO('2018-12-30T07:15:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T07:15:35.000Z'),
            time: DateTime.fromISO('2018-12-30T07:15:35.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T07:15:35.000Z'),
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
            track: null,
          },
          {
            stationShortCode: 'ERV',
            stopType: StopType.OtherTraffic,
            scheduledTime: DateTime.fromISO('2018-12-30T07:41:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T07:41:47.000Z'),
            time: DateTime.fromISO('2018-12-30T07:41:47.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T07:41:47.000Z'),
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
            track: null,
          },
          {
            stationShortCode: 'ERV',
            stopType: StopType.OtherTraffic,
            scheduledTime: DateTime.fromISO('2018-12-30T07:45:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T07:46:09.000Z'),
            time: DateTime.fromISO('2018-12-30T07:46:09.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T07:46:09.000Z'),
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
            track: null,
          },
          {
            stationShortCode: 'PKU',
            stopType: StopType.None,
            scheduledTime: DateTime.fromISO('2018-12-30T08:08:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T08:09:10.000Z'),
            time: DateTime.fromISO('2018-12-30T08:09:10.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T08:09:10.000Z'),
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
            track: null,
          },
          {
            stationShortCode: 'PKU',
            stopType: StopType.None,
            scheduledTime: DateTime.fromISO('2018-12-30T08:08:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T08:09:10.000Z'),
            time: DateTime.fromISO('2018-12-30T08:09:10.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T08:09:10.000Z'),
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
            track: null,
          },
          {
            stationShortCode: 'HKI',
            stopType: StopType.Commercial,
            scheduledTime: DateTime.fromISO('2018-12-30T10:44:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T10:50:07.000Z'),
            time: DateTime.fromISO('2018-12-30T10:44:00.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T10:44:00.000Z'),
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
            track: null,
          },
        ],
      },
    };

    // service.stations.TKU = {
    //   passengerTraffic: true,
    //   type: "STATION",
    //   stationName: "Turku asema",
    //   stationShortCode: "TKU",
    //   stationUICCode: 130,
    //   countryCode: "FI",
    //   longitude: 22.252945,
    //   latitude: 60.453985,
    // };
    // service.stations.KUT = {
    //   passengerTraffic: true,
    //   type: "STATION",
    //   stationName: "Kupittaa",
    //   stationShortCode: "KUT",
    //   stationUICCode: 126,
    //   countryCode: "FI",
    //   longitude: 22.297114,
    //   latitude: 60.450274,
    // };
    // service.stations.PIK = {
    //   passengerTraffic: false,
    //   type: "STATION",
    //   stationName: "Piikkiö",
    //   stationShortCode: "PIK",
    //   stationUICCode: 127,
    //   countryCode: "FI",
    //   longitude: 22.51586,
    //   latitude: 60.423105,
    // };
    // service.stations.PO = {
    //   passengerTraffic: false,
    //   type: "STATION",
    //   stationName: "Paimio",
    //   stationShortCode: "PO",
    //   stationUICCode: 128,
    //   countryCode: "FI",
    //   longitude: 22.685879,
    //   latitude: 60.459453,
    // };
    // service.stations.SLO = {
    //   passengerTraffic: true,
    //   type: "STATION",
    //   stationName: "Salo",
    //   stationShortCode: "SLO",
    //   stationUICCode: 55,
    //   countryCode: "FI",
    //   longitude: 23.121448,
    //   latitude: 60.384777,
    // };
    // service.stations.ERV = {
    //   passengerTraffic: false,
    //   type: "STATION",
    //   stationName: "Ervelä",
    //   stationShortCode: "ERV",
    //   stationUICCode: 1004,
    //   countryCode: "FI",
    //   longitude: 23.22228,
    //   latitude: 60.203374,
    // };
    // service.stations.PKU = {
    //   passengerTraffic: false,
    //   type: "STATION",
    //   stationName: "Pohjankuru",
    //   stationShortCode: "PKU",
    //   stationUICCode: 59,
    //   countryCode: "FI",
    //   longitude: 23.551872,
    //   latitude: 60.098215,
    // };
    // service.stations.HKI = {
    //   passengerTraffic: true,
    //   type: "STATION",
    //   stationName: "Helsinki asema",
    //   stationShortCode: "HKI",
    //   stationUICCode: 1,
    //   countryCode: "FI",
    //   longitude: 24.941249,
    //   latitude: 60.172097,
    // };

    return data;
  }
});
