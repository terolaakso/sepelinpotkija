import { LateCause } from '../types';

export interface LateCausesProps {
  causes: LateCause[];
}

export default function LateCauses({ causes }: LateCausesProps) {
  if (causes.length === 0) {
    return null;
  }
  return (
    <small>
      {causes.map((cause) => (
        <span className="block" key={cause.name}>
          {cause.name} : +{cause.lateMinutes} min
        </span>
      ))}
    </small>
  );
}
