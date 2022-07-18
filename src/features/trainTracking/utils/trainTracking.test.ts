import { DateTime } from 'luxon';

import { StopType, Train } from '@/types/Train';

import { getCurrentCommercialStops, getCurrentStations } from './trainTracking';

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
    const result = getCurrentStations(train, 5); // seuraavana paimio
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
    const result = getCurrentStations(train, 13); // seuraavana helsinki
    expect(result.length).toBe(2);

    expect(result[0].id).toBe('PKU');
    expect(result[0].departureTime).toBeNull();

    expect(result[1].id).toBe('HKI');
    expect(result[1].departureTime).toBeNull();
  });

  it('should return correct commercial stops after arriving to final station', () => {
    const { train } = getTrainData();
    const result = getCurrentCommercialStops(train, 14); // helsingissä
    expect(result.length).toBe(0);
  });

  it('should return correct stations after arriving to final station', () => {
    const { train } = getTrainData();
    const result = getCurrentStations(train, 14); // helsingissä
    expect(result.length).toBe(1);

    expect(result[0].id).toBe('HKI');
    expect(result[0].departureTime).toBeNull();
  });

  function getTrainData() {
    const data: {
      train: Train;
    } = {
      train: {
        departureDate: '2018-12-30',
        latestActualTimeIndex: 0,
        timestamp: DateTime.now(),
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
            differenceInMinutes: -19,
            estimatedTime: null,
            isTrainReady: true,
            lateCauses: [],
          },
          {
            stationShortCode: 'KUT',
            stopType: StopType.Commercial,
            scheduledTime: DateTime.fromISO('2018-12-30T06:09:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T06:09:44.000Z'),
            time: DateTime.fromISO('2018-12-30T06:09:44.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T06:09:44.000Z'),
            differenceInMinutes: 1,
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
          },
          {
            stationShortCode: 'KUT',
            stopType: StopType.Commercial,
            scheduledTime: DateTime.fromISO('2018-12-30T06:11:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T06:11:30.000Z'),
            time: DateTime.fromISO('2018-12-30T06:11:30.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T06:11:30.000Z'),
            differenceInMinutes: 1,
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
          },
          {
            stationShortCode: 'PIK',
            stopType: StopType.None,
            scheduledTime: DateTime.fromISO('2018-12-30T06:26:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T06:25:53.000Z'),
            time: DateTime.fromISO('2018-12-30T06:25:53.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T06:25:53.000Z'),
            differenceInMinutes: 0,
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
          },
          {
            stationShortCode: 'PIK',
            stopType: StopType.None,
            scheduledTime: DateTime.fromISO('2018-12-30T06:26:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T06:26:03.000Z'),
            time: DateTime.fromISO('2018-12-30T06:26:03.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T06:26:03.000Z'),
            differenceInMinutes: 0,
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
          },
          {
            stationShortCode: 'PO',
            stopType: StopType.Commercial,
            scheduledTime: DateTime.fromISO('2018-12-30T06:38:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T06:37:55.000Z'),
            time: DateTime.fromISO('2018-12-30T06:37:55.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T06:37:55.000Z'),
            differenceInMinutes: 0,
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
          },
          {
            stationShortCode: 'PO',
            stopType: StopType.Commercial,
            scheduledTime: DateTime.fromISO('2018-12-30T06:45:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T06:47:21.000Z'),
            time: DateTime.fromISO('2018-12-30T06:47:21.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T06:47:21.000Z'),
            differenceInMinutes: 2,
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
          },
          {
            stationShortCode: 'SLO',
            stopType: StopType.Commercial,
            scheduledTime: DateTime.fromISO('2018-12-30T07:13:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T07:12:58.000Z'),
            time: DateTime.fromISO('2018-12-30T07:12:58.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T07:12:58.000Z'),
            differenceInMinutes: 0,
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
          },
          {
            stationShortCode: 'SLO',
            stopType: StopType.Commercial,
            scheduledTime: DateTime.fromISO('2018-12-30T07:15:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T07:15:35.000Z'),
            time: DateTime.fromISO('2018-12-30T07:15:35.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T07:15:35.000Z'),
            differenceInMinutes: 1,
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
          },
          {
            stationShortCode: 'ERV',
            stopType: StopType.OtherTraffic,
            scheduledTime: DateTime.fromISO('2018-12-30T07:41:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T07:41:47.000Z'),
            time: DateTime.fromISO('2018-12-30T07:41:47.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T07:41:47.000Z'),
            differenceInMinutes: 1,
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
          },
          {
            stationShortCode: 'ERV',
            stopType: StopType.OtherTraffic,
            scheduledTime: DateTime.fromISO('2018-12-30T07:45:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T07:46:09.000Z'),
            time: DateTime.fromISO('2018-12-30T07:46:09.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T07:46:09.000Z'),
            differenceInMinutes: 1,
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
          },
          {
            stationShortCode: 'PKU',
            stopType: StopType.None,
            scheduledTime: DateTime.fromISO('2018-12-30T08:08:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T08:09:10.000Z'),
            time: DateTime.fromISO('2018-12-30T08:09:10.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T08:09:10.000Z'),
            differenceInMinutes: 1,
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
          },
          {
            stationShortCode: 'PKU',
            stopType: StopType.None,
            scheduledTime: DateTime.fromISO('2018-12-30T08:08:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T08:09:10.000Z'),
            time: DateTime.fromISO('2018-12-30T08:09:10.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T08:09:10.000Z'),
            differenceInMinutes: 1,
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
          },
          {
            stationShortCode: 'HKI',
            stopType: StopType.Commercial,
            scheduledTime: DateTime.fromISO('2018-12-30T10:44:00.000Z'),
            actualTime: DateTime.fromISO('2018-12-30T10:50:07.000Z'),
            differenceInMinutes: 6,
            time: DateTime.fromISO('2018-12-30T10:44:00.000Z'),
            bestDigitrafficTime: DateTime.fromISO('2018-12-30T10:44:00.000Z'),
            estimatedTime: null,
            isTrainReady: false,
            lateCauses: [],
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

  // it("should filter trains when not departed", () => {
  //   const service: ExplorerService = TestBed.inject(ExplorerService);

  //   const data = fillDataToFilter([1, 7, 15]);
  //   service.filterTrains(data);
  //   expect(data.length).toBe(2);
  //   expect(data[1].name).toBe("7");
  // });

  // it("should filter trains when no recent trains since 5 mins", () => {
  //   const service: ExplorerService = TestBed.inject(ExplorerService);

  //   const data = fillDataToFilter([-15, -9, -8, 1, 2, 7, 15]);
  //   service.filterTrains(data);
  //   expect(data.length).toBe(3);
  //   expect(data[0].name).toBe("-8");
  //   expect(data[2].name).toBe("2");
  // });

  // it("should filter trains when recent trains since 5 mins", () => {
  //   const service: ExplorerService = TestBed.inject(ExplorerService);

  //   const data = fillDataToFilter([-15, -9, -8, -4, -3, 2, 11, 15]);
  //   service.filterTrains(data);
  //   expect(data.length).toBe(3);
  //   expect(data[0].name).toBe("-4");
  //   expect(data[2].name).toBe("2");
  // });

  // it("should not filter trains when only recent trains since 5 mins", () => {
  //   const service: ExplorerService = TestBed.inject(ExplorerService);

  //   const data = fillDataToFilter([-4, -3, 2, 11, 15]);
  //   service.filterTrains(data);
  //   expect(data.length).toBe(3);
  //   expect(data[0].name).toBe("-4");
  //   expect(data[2].name).toBe("2");
  // });

  // it("should not filter trains when only recent trains since 10 mins", () => {
  //   const service: ExplorerService = TestBed.inject(ExplorerService);

  //   const data = fillDataToFilter([-8, 2, 7, 15]);
  //   service.filterTrains(data);
  //   expect(data.length).toBe(3);
  //   expect(data[0].name).toBe("-8");
  //   expect(data[2].name).toBe("7");
  // });

  // it("should filter trains when arrived to final station", () => {
  //   const service: ExplorerService = TestBed.inject(ExplorerService);

  //   const data = fillDataToFilter([-8, -3, -2]);
  //   service.filterTrains(data);
  //   expect(data.length).toBe(2);
  //   expect(data[0].name).toBe("-3");
  // });

  // it("should filter trains when arrived to final station over 5 mins ago", () => {
  //   const service: ExplorerService = TestBed.inject(ExplorerService);

  //   const data = fillDataToFilter([-12, -8, -7]);
  //   service.filterTrains(data);
  //   expect(data.length).toBe(1);
  //   expect(data[0].name).toBe("-7");
  // });

  // it("should filter future trains after 10 mins", () => {
  //   const service: ExplorerService = TestBed.inject(ExplorerService);

  //   const data = fillDataToFilter([-2, 2, 7, 15]);
  //   service.filterTrains(data);
  //   expect(data.length).toBe(3);
  //   expect(data[2].name).toBe("7");
  // });

  // it("should not filter the first future train if after 10 mins", () => {
  //   const service: ExplorerService = TestBed.inject(ExplorerService);

  //   const data = fillDataToFilter([-2, 15, 20]);
  //   service.filterTrains(data);
  //   expect(data.length).toBe(2);
  //   expect(data[1].name).toBe("15");
  // });

  // it("should filter future trains after filtering past train", () => {
  //   const service: ExplorerService = TestBed.inject(ExplorerService);

  //   const data = fillDataToFilter([-12, -2, 2, 15]);
  //   service.filterTrains(data);
  //   expect(data.length).toBe(2);
  //   expect(data[0].name).toBe("-2");
  //   expect(data[1].name).toBe("2");
  // });

  // function fillDataToFilter(startMinutes: number[]) {
  //   const now = new Date().getTime();
  //   const result: TrainTrackingViewModel[] = [];
  //   for (const startMinute of startMinutes) {
  //     const item = new TrainTrackingViewModel();
  //     item.time = new Date(now + startMinute * 60 * 1000);
  //     item.name = startMinute.toString();
  //     result.push(item);
  //   }
  //   return result;
  // }

  // it("should not merge two trains encountered at the exact same moment", () => {
  //   const service: ExplorerService = TestBed.inject(ExplorerService);
  //   const now = Date.now();
  //   const time = new Date(now + 2 * 60 * 1000);

  //   const item1 = new TrainTrackingViewModel();
  //   item1.time = time;
  //   item1.eventType = EventType.Train;
  //   item1.name = "1";

  //   const item2 = new TrainTrackingViewModel();
  //   item2.time = time;
  //   item1.eventType = EventType.Train;
  //   item2.name = "2";

  //   const trains = [item1, item2];
  //   const events: TrainTrackingViewModel[] = [];
  //   service.mergeTrains(events, trains);

  //   expect(events.length).toBe(2);
  //   expect(events[0].name).toBe("1");
  //   expect(events[1].name).toBe("2");
  // });
});
