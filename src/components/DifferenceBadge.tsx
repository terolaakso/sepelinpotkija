import classNames from "classnames";

export interface DifferenceBadgeProps {
  difference: number | null;
}

export default function DifferenceBadge({ difference }: DifferenceBadgeProps) {
  if (difference === null) {
    return null;
  }
  const classes = classNames(
    "rounded-full",
    "px-1",
    "mr-1",
    "whitespace-nowrap",
    {
      "bg-green-800": difference < 5,
      "bg-yellow-800": difference >= 5 && difference < 15,
      "bg-red-800": difference >= 15,
    }
  );
  return (
    <div>
      <small className={classes}>
        {difference > 0 ? "+" : ""}
        {difference}
      </small>
    </div>
  );
}
