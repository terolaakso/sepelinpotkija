import { useEffect, useState } from 'react';

import { TrainEvent } from '../types/TrainEvent';
import { fetchWikiPage, getRelevantNonTrainEvent } from '../utils/wikipedia';

export interface WikipediaContentProps {
  events: TrainEvent[];
}

export default function WikipediaContent({ events }: WikipediaContentProps) {
  const [curEventId, setCurEventId] = useState('');
  const [pageName, setPageName] = useState<string | null>(null);
  const [pageContent, setPageContent] = useState('');

  useEffect(() => {
    if (events.length > 0) {
      const relevantEvent = getRelevantNonTrainEvent(events, curEventId);
      setCurEventId(relevantEvent.id);
      setPageName(relevantEvent.wikiPage);
    } else {
      setCurEventId('');
      setPageName(null);
    }
  }, [events, curEventId]);

  useEffect(() => {
    async function fetchFromWiki(page: string) {
      const content = await fetchWikiPage(page);
      setPageContent(content);
    }
    if (pageName !== null) {
      fetchFromWiki(pageName);
    } else {
      setPageContent('');
    }
  }, [pageName]);

  return (
    <div className="flex-1 ml-1 portrait:flex-initial portrait:ml-0 flex-grow overflow-y-auto max-h-full portrait:mt-1 mt-0 -mr-1 pr-1">
      {pageName === null || pageName === '' || pageContent === '' ? null : (
        <small>
          <div dangerouslySetInnerHTML={{ __html: pageContent }}></div>
          <div className="float-right">
            <small>Lähde: https:/fi.wikipedia.org/wiki/{pageName}</small>
          </div>
        </small>
      )}
    </div>
  );
}
