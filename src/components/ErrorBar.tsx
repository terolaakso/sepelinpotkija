interface ErrorProps {
  errorMessage: string | null;
}

export default function ErrorBar({ errorMessage }: ErrorProps) {
  if (!errorMessage) {
    return null;
  }
  return <div className="bg-red-700 m-1 px-1"> {errorMessage}</div>;
}
