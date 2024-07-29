import { useEffect, useState } from 'react';

import { isNotNil } from '@/utils/misc';

interface ErrorProps {
  errorMessage: string | null;
}

const ERROR_TIMEOUT_MS = 10000;

export default function ErrorBar({ errorMessage }: ErrorProps) {
  const [visibleError, setVisibleError] = useState<string | null>(null);

  useEffect(() => {
    if (isNotNil(errorMessage)) {
      setVisibleError(errorMessage);
      setTimeout(() => {
        setVisibleError(null);
      }, ERROR_TIMEOUT_MS);
    }
  }, [errorMessage]);

  if (!visibleError) {
    return null;
  }
  return <div className="bg-red-700 px-1"> {visibleError}</div>;
}
