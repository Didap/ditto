export default function DesignLoading() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3">
        <span className="w-12 h-12 ditto-blob-loading inline-block" />
        <span className="text-sm text-(--ditto-text-muted)">
          Loading design...
        </span>
      </div>
    </div>
  );
}
