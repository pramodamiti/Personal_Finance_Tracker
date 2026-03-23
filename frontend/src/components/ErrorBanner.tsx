type ErrorBannerProps = {
  message: string;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200/90 bg-red-50/95 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-100"
    >
      {message}
    </div>
  );
}
