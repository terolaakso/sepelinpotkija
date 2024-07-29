import { useState } from 'react';

import { isNotNil } from '@/utils/misc';

export interface TrainNumberInputProps {
  initialTrainNumber: number;
  onSubmit: (trainNumber: number) => void;
}

export default function TrainNumberInputForm({
  initialTrainNumber,
  onSubmit,
}: TrainNumberInputProps) {
  const [trainNumber, setTrainNumber] = useState<number | string>(initialTrainNumber);

  function startTracking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isNotNil(trainNumber) && typeof trainNumber === 'number') {
      onSubmit(trainNumber);
    }
  }

  function numberChanged(event: React.ChangeEvent<HTMLInputElement>) {
    const value = parseInt(event.target.value);
    setTrainNumber(isNaN(value) ? '' : value);
  }

  return (
    <form className="p-1" onSubmit={startTracking}>
      <label htmlFor="numberInput">Junan numero</label>
      <input
        id="numberInput"
        type="number"
        required
        min={1}
        max={99999}
        className="bg-gray-900 text-gray-300 mx-1 text-right"
        value={trainNumber ?? ''}
        onChange={numberChanged}
      />
      <button type="submit" className="bg-gray-700 px-2" disabled={typeof trainNumber !== 'number'}>
        Seuraa
      </button>
    </form>
  );
}
