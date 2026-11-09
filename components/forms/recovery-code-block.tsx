import { Button } from '@/components/ui/button';

// Code de secours affiché une seule fois : case de confirmation puis accès.
export function RecoveryCodeBlock({ code, saved, onSaved, onContinue }: {
  code: string;
  saved: boolean;
  onSaved: (v: boolean) => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <p className="rounded-lg bg-neutral-100 px-4 py-4 text-center font-mono text-xl tracking-widest text-neutral-950">{code}</p>
      <label className="flex items-center gap-3 text-sm text-neutral-900">
        <input type="checkbox" className="h-4 w-4 accent-neutral-950" checked={saved} onChange={(e) => onSaved(e.target.checked)} />
        J&apos;ai noté mon code de secours
      </label>
      <Button type="button" disabled={!saved} onClick={onContinue} className="w-full">
        Accéder à mon espace
      </Button>
    </div>
  );
}
