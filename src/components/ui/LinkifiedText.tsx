import { linkify } from "../../utils/linkify";

interface Props {
  text: string;
  className?: string;
}

export default function LinkifiedText({ text, className }: Props) {
  return <span className={className}>{linkify(text)}</span>;
}
