import classNames from "classnames";
import { TrainEvent } from "../../model/TrainEvent";

export interface EventTextProps {
  event: TrainEvent;
}

export default function EventText({ event }: EventTextProps) {
  const textClasses = classNames("mr-1", {
    "text-red-700": false, // TODO: For encounters, show expiration color
  });
  return (
    <span className={textClasses}>
      {event.name}
      {/* TODO: encounter origin & destination */}
    </span>
  );
}
