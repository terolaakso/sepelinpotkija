import _ from 'lodash';

import {
  FirstLevelCauseCollection,
  SecondLevelCauseCollection,
  ThirdLevelCauseCollection,
} from '../components/TrainData';
import { isNotNil } from '../utils/misc';

import { RowCause, TimetableRow, Train } from './Train';

export interface LateCause {
  name: string;
  lateMinutes: number;
}

export function calculateCauses(
  train: Train,
  firstLevelCauses: FirstLevelCauseCollection,
  secondLevelCauses: SecondLevelCauseCollection,
  thirdLevelCauses: ThirdLevelCauseCollection,
  index?: number
): LateCause[] {
  const lastIndex = Math.min(
    index ?? train.latestActualTimeIndex + 1,
    train.timetableRows.length - 1
  );
  const unexplainedMin = train.timetableRows[lastIndex].differenceInMinutes;

  const causesResult = train.timetableRows.reduceRight(
    (result, row, i) => {
      if (i > lastIndex) {
        return result;
      }
      const stillUnexplained = Math.min(result.unexplainedMin, row.differenceInMinutes);
      if (row.lateCauses.length > 0 && stillUnexplained > 0) {
        const lateMinTotal = Math.min(
          timetableRowLateMin(train.timetableRows, i),
          stillUnexplained
        );
        const lateMinPerCause = Math.floor(lateMinTotal / row.lateCauses.length);
        return {
          causes: mergeCauses(
            result.causes,
            createCauses(
              row.lateCauses,
              lateMinPerCause,
              firstLevelCauses,
              secondLevelCauses,
              thirdLevelCauses
            )
          ),
          unexplainedMin: result.unexplainedMin - lateMinTotal,
        };
      }
      return result;
    },
    {
      causes: [] as LateCause[],
      unexplainedMin,
    }
  );

  const sortedCauses = _.sortBy(causesResult.causes, (cause) => -cause.lateMinutes);
  return sortedCauses;
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

function createCauses(
  causes: RowCause[],
  lateMinutes: number,
  firstLevelCauses: FirstLevelCauseCollection,
  secondLevelCauses: SecondLevelCauseCollection,
  thirdLevelCauses: ThirdLevelCauseCollection
): LateCause[] {
  if (lateMinutes > 0) {
    return causes.map((cause) => ({
      name: getCauseName(cause, firstLevelCauses, secondLevelCauses, thirdLevelCauses),
      lateMinutes,
    }));
  }
  return [];
}

function getCauseName(
  cause: RowCause,
  firstLevelCauses: FirstLevelCauseCollection,
  secondLevelCauses: SecondLevelCauseCollection,
  thirdLevelCauses: ThirdLevelCauseCollection
): string {
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
          : Math.min(Math.max(row.differenceInMinutes, 0), result.mins);
      return {
        mins,
        found:
          result.found ||
          (i < startIndex && (row.lateCauses.length > 0 || row.differenceInMinutes <= 0)),
      };
    },
    { mins: rows[startIndex].differenceInMinutes, found: false }
  );
  return rows[startIndex].differenceInMinutes - previousLateness.mins;
}
