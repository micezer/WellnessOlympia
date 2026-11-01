'use client';
// Consultas al administrador: lista, nueva consulta y conversación.
// Mismos componentes para la app de jugadoras (oscuro), coaches y administración (claro).
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Lock, MessageSquarePlus, Send } from 'lucide-react';
import { INQUIRY_MESSAGE_MAX, INQUIRY_SUBJECT_MAX } from '@/lib/forms';
import { cn } from '@/lib/utils';

type Variant = 'dark' | 'light';

const THEME = {
  dark: {
    card: 'bg-ink-800',
    cardHover: 'hover:bg-ink-700',
    muted: 'text-gray-400',
    input:
      'w-full rounded-xl border border-ink-600 bg-ink-950 text-white px-3 py-3 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand',
    primary: 'bg-brand text-black hover:bg-brand-hover',
    secondary: 'border-2 border-ink-600 text-gray-100 hover:bg-ink-700',
    mine: 'bg-brand/20 text-white',
    theirs: 'bg-ink-700 text-white',
    error: 'text-red-400',
    dot: 'bg-brand',
  },
  light: {
    card: 'bg-white border shadow-sm',
    cardHover: 'hover:bg-gray-50',
    muted: 'text-gray-500',
    input:
      'w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500',
    primary: 'bg-green-600 text-white hover:bg-green-700',
    secondary: 'border text-gray-700 hover:bg-gray-50',
    mine: 'bg-green-50 text-gray-900 border border-green-200',
    theirs: 'bg-gray-100 text-gray-900',
    error: 'text-red-600',
    dot: 'bg-green-600',
  },
};

const STATUS: Record<string, { label: string; dark: string; light: string }> = {
  open: { label: 'Pendiente', dark: 'bg-yellow-500/15 text-yellow-300', light: 'bg-amber-100 text-amber-800' },
  answered: { label: 'Respondida', dark: 'bg-brand/15 text-brand', light: 'bg-green-100 text-green-800' },
  closed: { label: 'Cerrada', dark: 'bg-ink-700 text-gray-400', light: 'bg-gray-100 text-gray-600' },
};

const formatWhen = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('es-ES', {
        timeZone: 'Europe/Madrid',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

function StatusBadge({ status, variant }: { status: string; variant: Variant }) {
  const s = STATUS[status] ?? STATUS.open;
  return (
    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold', s[variant])}>{s.label}</span>
  );
}

const buttonBase = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold min-h-11 px-4 disabled:opacity-50';

type ListItem = {
  id: number;
  subject: string;
  status: string;
  anonymous: boolean;
  updated_at: string | null;
  unread: boolean;
  sender?: string;
};

// Lista de consultas (propias, o todas si es el administrador)
export function InquiryList({ variant, basePath, reloadKey = 0 }: { variant: Variant; basePath: string; reloadKey?: number }) {
  const t = THEME[variant];
  const [items, setItems] = useState<ListItem[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/inquiries', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setItems(data.inquiries);
      })
      .catch((err) => setError(err.message || 'Error al cargar las consultas'));
  }, [reloadKey]);

  if (error) return <p className={cn('text-sm', t.error)}>{error}</p>;
  if (!items) return <p className={cn('text-sm', t.muted)}>Cargando...</p>;
  if (!items.length) return <p className={cn('text-sm', t.muted)}>No hay consultas todavía.</p>;

  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.id}>
          <Link href={`${basePath}/${i.id}`} className={cn('flex items-center gap-3 rounded-2xl p-4 transition', t.card, t.cardHover)}>
            {i.unread && <span className={cn('w-2.5 h-2.5 shrink-0 rounded-full', t.dot)} aria-label="Sin leer" />}
            <div className="flex-1 min-w-0">
              <p className={cn('truncate', i.unread ? 'font-bold' : 'font-medium')}>{i.subject}</p>
              <p className={cn('text-xs mt-0.5 truncate', t.muted)}>
                {i.sender ? `${i.sender} · ` : i.anonymous ? 'Anónima · ' : ''}
                {formatWhen(i.updated_at)}
              </p>
            </div>
            <StatusBadge status={i.status} variant={variant} />
            <ChevronRight className={cn('w-4 h-4 shrink-0', t.muted)} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Nueva consulta (jugadoras y coaches)
export function NewInquiryForm({
  variant,
  anonymousLabel,
  onCreated,
}: {
  variant: Variant;
  anonymousLabel: string;
  onCreated: () => void;
}) {
  const t = THEME[variant];
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, anonymous }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error || 'No se pudo enviar');
      setSubject('');
      setBody('');
      setAnonymous(false);
      setOpen(false);
      onCreated();
    } catch {
      setError('Sin conexión. Inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className={cn(buttonBase, 'w-full', t.primary)}>
        <MessageSquarePlus className="w-5 h-5" /> Nueva consulta
      </button>
    );

  return (
    <form onSubmit={submit} className={cn('rounded-2xl p-4 space-y-3', t.card)}>
      <h2 className="font-semibold">Nueva consulta</h2>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        maxLength={INQUIRY_SUBJECT_MAX}
        placeholder="Asunto"
        className={t.input}
        required
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={INQUIRY_MESSAGE_MAX}
        rows={5}
        placeholder="Escribe tu consulta..."
        className={cn(t.input, 'resize-none')}
        required
      />
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="mt-1 w-5 h-5 accent-green-500"
        />
        <span className="text-sm">
          {anonymousLabel}
          <span className={cn('block text-xs', t.muted)}>
            El administrador no verá tu nombre, pero podrá responderte aquí.
          </span>
        </span>
      </label>
      {error && <p role="alert" className={cn('text-sm', t.error)}>{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className={cn(buttonBase, t.secondary)}>
          Cancelar
        </button>
        <button type="submit" disabled={sending} className={cn(buttonBase, 'flex-1', t.primary)}>
          <Send className="w-4 h-4" /> {sending ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </form>
  );
}

type Thread = {
  inquiry: { id: number; subject: string; status: string; anonymous: boolean; created_at: string; sender?: string };
  messages: { id: number; author: 'sender' | 'admin'; body: string; created_at: string }[];
};

// Conversación de una consulta. isAdmin: quien mira es el administrador.
export function InquiryThread({ variant, id, isAdmin }: { variant: Variant; id: number; isAdmin: boolean }) {
  const t = THEME[variant];
  const [thread, setThread] = useState<Thread | null>(null);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/inquiries/${id}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setThread(data);
    } catch (err) {
      setError((err as Error).message || 'Error al cargar la consulta');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`/api/inquiries/${id}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error || 'No se pudo enviar');
      setReply('');
      await load();
    } catch {
      setError('Sin conexión. Inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const setStatus = async (status: 'open' | 'closed') => {
    const res = await fetch(`/api/inquiries/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  };

  if (!thread) return <p className={cn('text-sm', error ? t.error : t.muted)}>{error || 'Cargando...'}</p>;
  const { inquiry, messages } = thread;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold">{inquiry.subject}</h2>
          <StatusBadge status={inquiry.status} variant={variant} />
        </div>
        <p className={cn('text-xs mt-1 flex items-center gap-1', t.muted)}>
          {inquiry.anonymous && <Lock className="w-3 h-3" />}
          {isAdmin ? inquiry.sender : inquiry.anonymous ? 'Enviada de forma anónima' : 'Enviada con tu nombre'}
          {' · '}
          {formatWhen(inquiry.created_at)}
        </p>
      </div>

      <ul className="space-y-2">
        {messages.map((m) => {
          // "Mío": del administrador si lo mira el admin; de quien preguntó si lo mira ella
          const mine = (m.author === 'admin') === isAdmin;
          return (
            <li key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[85%] rounded-2xl px-4 py-2.5', mine ? t.mine : t.theirs)}>
                <p className={cn('text-xs font-semibold mb-0.5', t.muted)}>
                  {m.author === 'admin' ? 'Administración' : isAdmin ? (inquiry.anonymous ? 'Anónima' : 'Remitente') : 'Tú'}
                </p>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={cn('text-[11px] mt-1 text-right', t.muted)}>{formatWhen(m.created_at)}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <form onSubmit={send} className="space-y-2">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          maxLength={INQUIRY_MESSAGE_MAX}
          rows={3}
          placeholder={
            inquiry.status === 'closed'
              ? 'Escribir de nuevo reabrirá la consulta...'
              : isAdmin
                ? 'Escribe tu respuesta...'
                : 'Añadir un mensaje...'
          }
          className={cn(t.input, 'resize-none')}
        />
        {error && <p role="alert" className={cn('text-sm', t.error)}>{error}</p>}
        <div className="flex gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setStatus(inquiry.status === 'closed' ? 'open' : 'closed')}
              className={cn(buttonBase, t.secondary)}
            >
              {inquiry.status === 'closed' ? 'Reabrir' : 'Cerrar consulta'}
            </button>
          )}
          <button type="submit" disabled={sending || !reply.trim()} className={cn(buttonBase, 'flex-1', t.primary)}>
            <Send className="w-4 h-4" /> {sending ? 'Enviando...' : isAdmin ? 'Responder' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}
