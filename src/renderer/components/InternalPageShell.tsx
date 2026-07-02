interface InternalPageShellProps {
  title: string;
  children: React.ReactNode;
}

export function InternalPageShell({ title, children }: InternalPageShellProps) {
  return (
    <div className="flex-1 h-full overflow-hidden bg-surface">
      <div className="px-6 py-4 border-b border-border-subtle">
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
      </div>
      <div className="h-[calc(100%-4rem)] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
