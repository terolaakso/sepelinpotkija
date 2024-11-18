interface ExtrasBase {
  name: string;
  info: string | null;
}

export interface LegacyFileExtras extends ExtrasBase {
  km: number;
  lat: never;
  lon: never;
}

export interface FileExtras extends ExtrasBase {
  km: never;
  lat?: number;
  lon?: number;
}

export type FileTrackSegment = FileExtras[] | LegacyFileExtras[];

export interface FileTrackSegmentCollection {
  [key: string]: FileTrackSegment | undefined;
}

export interface LocationExtraInfo {
  name: string;
  position: number;
  wikiPage: string | null;
}

export interface TrackSegment {
  locations: LocationExtraInfo[];
}

export interface TrackSegmentCollection {
  [key: string]: TrackSegment;
}
