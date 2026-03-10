export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="text-6xl mb-4">♾️</div>
      <h2 className="text-2xl font-semibold text-primary-text mb-3">
        Your journal is empty
      </h2>
      <p className="text-secondary-text text-[17px] max-w-xs leading-relaxed">
        Start capturing thoughts, links, and images. Everything lives here in your private feed.
      </p>
    </div>
  );
}
