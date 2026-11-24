'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

interface DuplicateQuoteDialogProps {
  estimateId: string;
  projectId: string;
  projectTitle?: string;
  quoteTitle?: string | null;
  clientName?: string | null;
  className?: string;
}

export default function DuplicateQuoteDialog({
  estimateId, projectId, projectTitle, quoteTitle, clientName, className,
}: DuplicateQuoteDialogProps) {
  const router = useRouter();
  const titleId = useId();
  const inFlight = useRef(false);
  const copyId = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function changeOpen(next: boolean) {
    if (inFlight.current) return;
    if (next) {
      copyId.current = null;
      setTitle(`${quoteTitle || projectTitle || 'Devis'} — copie`.slice(0, 160));
      setError(null);
    }
    setOpen(next);
  }

  async function duplicate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !title.trim()) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      copyId.current ??= crypto.randomUUID();
      const { data, error: rpcError } = await supabase.rpc('duplicate_quote', {
        p_source_id: estimateId,
        p_title: title.trim(),
        p_copy_id: copyId.current,
      });
      if (rpcError) {
        if (rpcError.code === '42501') {
          setError('Vous n’avez pas les droits pour dupliquer ce devis.');
        } else if (rpcError.code === '23514') {
          setError('Les montants ou les coûts du devis source doivent être vérifiés avant la duplication.');
        } else if (rpcError.code === '23505') {
          setError('Cette demande a déjà été utilisée. Vérifiez la liste des devis avant de recommencer.');
        } else {
          setError('La duplication n’a pas pu être confirmée. Réessayez avec le même titre.');
        }
        return;
      }
      if (data !== copyId.current) {
        setError('La duplication n’a pas pu être confirmée. Réessayez avec le même titre.');
        return;
      }
      setOpen(false);
      toast.success('Devis dupliqué. Le nouveau brouillon est prêt à être modifié.');
      router.push(`/project/${projectId}?devis=${data}`);
    } catch {
      setError('La duplication n’a pas pu être confirmée. Réessayez avec le même titre.');
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={`min-h-11 gap-2 ${className ?? ''}`}>
          <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
          Dupliquer le devis
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl">
        <DialogHeader className="pr-6 text-left">
          <DialogTitle>Dupliquer le devis</DialogTitle>
          <DialogDescription>Un nouveau brouillon sera ajouté au même projet.</DialogDescription>
        </DialogHeader>
        <form onSubmit={duplicate} className="space-y-4" aria-busy={pending}>
          <div className="space-y-2">
            <Label htmlFor={titleId}>Titre du nouveau devis</Label>
            <Input id={titleId} value={title} onChange={(event) => setTitle(event.target.value)}
              maxLength={160} required disabled={pending} className="min-h-11 text-base" />
          </div>
          <dl className="space-y-2 break-words rounded-lg border border-slate-700/50 p-3 text-sm">
            <div><dt className="text-slate-400">Projet</dt><dd>{projectTitle || 'Projet d’origine'}</dd></div>
            {clientName && <div><dt className="text-slate-400">Client</dt><dd>{clientName}</dd></div>}
          </dl>
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="min-h-11" disabled={pending} onClick={() => changeOpen(false)}>Annuler</Button>
            <Button type="submit" variant="primary" className="min-h-11" disabled={pending || !title.trim()}>
              {pending ? 'Duplication en cours…' : 'Créer le brouillon'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
