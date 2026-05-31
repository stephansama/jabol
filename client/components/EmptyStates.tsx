import { Button } from "@/components/ui/button";

type EmptyLibraryProps = {
  admin?: boolean;
};

export function EmptyLibrary({ admin }: EmptyLibraryProps) {
  return (
    <div
      className="mb-10 rounded-md border border-dashed border-border-strong bg-bg-sunken px-6 py-20 text-center"
    >
      <pre className="m-0 mb-4 inline-block bg-transparent text-left text-[13px] text-fg-subtle">
        {`$ cat links.json
{
  "categories": []   // nothing here yet
}`}
      </pre>
      <h2 className="mb-2 text-lg font-semibold">No links yet</h2>
      <p className="mx-auto max-w-md text-sm text-fg-subtle">
        {admin
          ? "Drop a links.json on disk, or add your first link from the admin page. jabol writes it back atomically."
          : "The owner hasn't added any links yet. Check back soon."}
      </p>
    </div>
  );
}

type NoResultsProps = {
  query: string;
  onClear: () => void;
};

export function NoResults({ query, onClear }: NoResultsProps) {
  return (
    <div className="mb-10 px-6 py-16 text-center">
      <div className="mb-3 text-[28px] text-fg-subtle">
        <span className="cursor-blink">grep -ri "{query}"</span>
      </div>
      <h2 className="mb-1.5 text-lg font-semibold">No matches</h2>
      <p className="mono-dim mb-5 text-sm">
        Nothing matched <span className="text-accent">{query}</span>. Try fewer
        characters or a different word.
      </p>
      <Button variant="outline" size="sm" onClick={onClear}>
        clear search <span className="kbd">esc</span>
      </Button>
    </div>
  );
}
