import { TrainEvent } from '../types/TrainEvent';

import IntroContent from './IntroContent';
import TrainContent from './TrainContent';
import WikipediaContent from './WikipediaContent';

export interface ContentProps {
  events: TrainEvent[];
}

export default function Content({ events }: ContentProps) {
  return (
    <div className="flex-grow flex portrait:flex-col flex-row px-1 min-h-0">
      <TrainContent events={events} />
      <WikipediaContent events={events} />
      {events.length === 0 ? <IntroContent /> : null}
    </div>
  );
}
