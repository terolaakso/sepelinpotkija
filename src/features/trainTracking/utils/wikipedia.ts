import { DateTime } from 'luxon';

import { TrainEvent, TrainEventType } from '../types/TrainEvent';
import { WikipediaApiPage } from '../types/Wikipedia';

export function getRelevantNonTrainEvent(events: TrainEvent[], currentEventId: string) {
  const nonTrainEvents = events.filter((e) => e.eventType !== TrainEventType.Train);
  const now = DateTime.now();
  const nextIndex = nonTrainEvents.findIndex((e) => e.time > now);
  if (nextIndex === -1) {
    return nonTrainEvents[nonTrainEvents.length - 1];
  }
  const prevIndex = nextIndex - 1;
  if (prevIndex < 0) {
    return nonTrainEvents[nextIndex];
  }
  const nextEvent = nonTrainEvents[nextIndex];
  const prevEvent = nonTrainEvents[prevIndex];
  const prevTime = prevEvent.departureTime ?? prevEvent.time;
  const traveledPortion = now.diff(prevTime).toMillis() / nextEvent.time.diff(prevTime).toMillis();

  return traveledPortion > 0.25 || (traveledPortion > 0.1 && currentEventId === nextEvent.id)
    ? nextEvent
    : prevEvent;
}

export async function fetchWikiPage(pageName: string): Promise<string> {
  try {
    const url = `https://fi.wikipedia.org/w/api.php?page=${encodeURIComponent(
      pageName
    )}&action=parse&format=json&prop=text&disableeditsection&disabletoc&origin=*&redirects=1`;
    const response = await fetch(url, { cache: 'force-cache' });
    throwIfNotOk(response);
    const content = (await response.json()) as WikipediaApiPage;
    const htmlText = content.parse.text['*'];
    const htmlWithoutLinks = htmlText.replace(/<a [^>]*>/gi, '').replace(/<\/a>/gi, '');
    return htmlWithoutLinks;
  } catch {
    return '';
  }
}

async function throwIfNotOk(response: Response): Promise<void> {
  if (!response.ok) {
    const errorMessage = `${response.url} ${response.status} ${
      response.statusText
    } ${await response.text()}`;

    console.log(errorMessage);
    throw new Error(errorMessage);
  }
}
