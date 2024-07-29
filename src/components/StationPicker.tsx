import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import classNames from 'classnames';
import { isNil } from 'lodash';
import React, { useState, useEffect } from 'react';
import Select, { createFilter } from 'react-select';

import { useTrainDataStore } from '@/stores/trainData';
import { Station } from '@/types/Station';
import { isNotNil } from '@/utils/misc';
import { getStationsSortedByName } from '@/utils/stations';

export interface StationPickerProps {
  id: string;
  groupName: string;
  stationsForGroup: Station[];
  isLoading: boolean;
  defaultStation: Station | null;
  onSelectedStationChange: (station: Station | null) => void;
}

interface StationOption {
  label: string;
  value: string;
}

interface StationGroup {
  label: string;
  options: readonly StationOption[];
}

// This ensures that Emotion's styles are inserted before Tailwind's styles so that Tailwind classes have precedence over Emotion
function EmotionCacheProvider({ children }: { children: React.ReactNode }) {
  const cache = React.useMemo(
    () =>
      createCache({
        key: 'tailwind-select',
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        insertionPoint: document.querySelector('title')!,
      }),
    []
  );

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}

function StationPicker({
  id,
  groupName,
  stationsForGroup,
  isLoading,
  defaultStation,
  onSelectedStationChange,
}: StationPickerProps) {
  const [stations, setStations] = useState<StationGroup[]>([]);
  const stationCollection = useTrainDataStore((state) => state.stations);

  useEffect(() => {
    const allStationsOptions = getStationsSortedByName(stationCollection).map((station) => ({
      label: station.name,
      value: station.shortCode,
    }));

    if (stationsForGroup.length > 0) {
      const result: StationGroup[] = [
        {
          label: groupName,
          options: stationsForGroup.map((station) => ({
            label: station.name,
            value: station.shortCode,
          })),
        },
        {
          label: 'Kaikki liikennepaikat',
          options: allStationsOptions,
        },
      ];
      setStations(result);
    } else {
      setStations([
        {
          label: 'Kaikki liikennepaikat',
          options: allStationsOptions,
        },
      ]);
    }
  }, [stationsForGroup, stationCollection, groupName]);

  function onChange(selectedOption: StationOption | null) {
    if (isNil(selectedOption)) {
      onSelectedStationChange(null);
      return;
    }
    const selectedStation = stationCollection[selectedOption.value];
    if (selectedStation) {
      onSelectedStationChange(selectedStation);
    }
  }

  return (
    <EmotionCacheProvider>
      <Select<StationOption, false, StationGroup>
        id={id}
        value={
          isNotNil(defaultStation)
            ? { label: defaultStation.name, value: defaultStation.shortCode }
            : null
        }
        options={stations}
        placeholder="Valitse liikennepaikka"
        isClearable
        onChange={onChange}
        isLoading={isLoading}
        filterOption={createFilter({ ignoreAccents: false, matchFrom: 'start' })}
        classNames={{
          container: () => 'h-fit',
          control: () =>
            'bg-gray-900 text-gray-300 rounded-none border-gray-500 hover:border-gray-400 shadow-none',
          input: () => 'text-gray-300',
          singleValue: () => 'text-gray-300',
          placeholder: () => 'text-gray-400',
          menu: () => 'bg-gray-900 border border-gray-500 rounded-none',
          groupHeading: () => 'italic text-gray-400',
          option: ({ isSelected }) =>
            classNames('text-gray-300', 'hover:bg-gray-800', {
              'bg-gray-800': isSelected,
              'bg-gray-900': !isSelected,
              'font-bold': isSelected,
            }),
        }}
      ></Select>
    </EmotionCacheProvider>
  );
}

export default StationPicker;
