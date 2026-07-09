export default function SESBadgeGroup({
    children,
    className = "",
  }) {
    return (
      <div
        className={[
          "flex flex-wrap items-center gap-2",
          className,
        ].join(" ")}
      >
        {children}
      </div>
    );
  }