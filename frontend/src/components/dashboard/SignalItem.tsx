type SignalItemProps = {
  title: string;
  subtitle: string;
  value?: string;
  tone?: 'default' | 'danger' | 'accent';
};

export function SignalItem({
  title,
  subtitle,
  value,
  tone = 'default'
}: SignalItemProps) {
  return (
    <div className={`timeline-item timeline-${tone}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="timeline-title">{title}</div>
          <div className="timeline-subtitle">{subtitle}</div>
        </div>
        {value ? <div className="timeline-value">{value}</div> : null}
      </div>
    </div>
  );
}
