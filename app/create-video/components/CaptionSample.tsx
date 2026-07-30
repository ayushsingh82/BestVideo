export function CaptionSample({
  fontClass,
  color,
  highlight,
}: {
  fontClass: string;
  color: string;
  highlight: string;
}) {
  const words = ["This", "is", "how", "your", "captions", "look"];
  const hi = 4;
  return (
    <p className={`text-2xl font-bold uppercase leading-tight sm:text-3xl ${fontClass}`}>
      {words.map((w, i) => (
        <span key={i} style={{ color: i === hi ? highlight : color }}>
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
