import { sortBy } from 'lodash';

import { useTrainDataStore } from '@/stores/trainData';
import { RowCause, TimetableRow } from '@/types/Train';
import { isNotNil } from '@/utils/misc';

import { LateCause } from '../types';

export function calculateCauses(rows: TimetableRow[], index: number): LateCause[] {
  const lastIndex = Math.min(index, rows.length - 1);
  const unexplainedMin = rowLateMins(rows[lastIndex]);

  const causesResult = rows.reduceRight(
    (result, row, i) => {
      if (i > lastIndex || result.unexplainedMin <= 0) {
        return result;
      }
      const stillUnexplained = Math.min(result.unexplainedMin, rowLateMins(row));
      if (row.lateCauses.length > 0 && stillUnexplained > 0) {
        const lateMinTotal = Math.min(timetableRowLateMin(rows, i), stillUnexplained);
        const lateMinPerCause = Math.floor(lateMinTotal / row.lateCauses.length);
        return {
          causes: mergeCauses(result.causes, createCauses(row.lateCauses, lateMinPerCause)),
          unexplainedMin: result.unexplainedMin - lateMinTotal,
        };
      }
      return {
        ...result,
        unexplainedMin: stillUnexplained,
      };
    },
    {
      causes: [] as LateCause[],
      unexplainedMin,
    }
  );

  const sortedCauses = sortBy(causesResult.causes, (cause) => -cause.lateMinutes);
  return sortedCauses;
}

function rowLateMins(row: TimetableRow): number {
  return Math.round(row.time.diff(row.scheduledTime).as('minutes'));
}

function mergeCauses(existing: LateCause[], newCauses: LateCause[]): LateCause[] {
  const mergedCauses = newCauses.reduce((result, newCause) => {
    const existingCause = result.find((cause) => cause.name === newCause.name);
    if (existingCause) {
      return result.map((cause) =>
        cause.name === newCause.name
          ? {
              ...cause,
              lateMinutes: cause.lateMinutes + newCause.lateMinutes,
            }
          : cause
      );
    }
    return [...result, newCause];
  }, existing);
  return mergedCauses;
}

function createCauses(causes: RowCause[], lateMinutes: number): LateCause[] {
  if (lateMinutes > 0) {
    return causes.map((cause) => ({
      name: getCauseName(cause),
      lateMinutes,
    }));
  }
  return [];
}

function getCauseName(cause: RowCause): string {
  const { firstLevelCauses, secondLevelCauses, thirdLevelCauses } = useTrainDataStore.getState();
  const firstLevelName = cause.level1CodeId
    ? firstLevelCauses[cause.level1CodeId]?.categoryName
    : null;
  const secondLevelName = cause.level2CodeId
    ? secondLevelCauses[cause.level2CodeId]?.detailedCategoryName
    : null;
  const thirdLevelName = cause.level3CodeId
    ? thirdLevelCauses[cause.level3CodeId]?.thirdCategoryName
    : null;
  const nameStructure = [thirdLevelName, secondLevelName, firstLevelName].filter(isNotNil).reduce(
    (result, name) => {
      if (!result.name) {
        return { name, categories: [] };
      } else {
        return {
          ...result,
          categories: [...result.categories, name],
        };
      }
    },
    { name: '', categories: [] as string[] }
  );
  return `${nameStructure.name}${
    nameStructure.categories.length > 0 ? ` (${nameStructure.categories.reverse().join(': ')})` : ''
  }`;
}

function timetableRowLateMin(rows: TimetableRow[], startIndex: number): number {
  const previousLateness = rows.reduceRight(
    (result, row, i) => {
      const mins =
        startIndex === 0 && i === 0
          ? 0
          : i >= startIndex || result.found
          ? result.mins
          : Math.min(Math.max(rowLateMins(row), 0), result.mins);
      return {
        mins,
        found:
          result.found || (i < startIndex && (row.lateCauses.length > 0 || rowLateMins(row) <= 0)),
      };
    },
    { mins: rowLateMins(rows[startIndex]), found: false }
  );
  return rowLateMins(rows[startIndex]) - previousLateness.mins;
}
