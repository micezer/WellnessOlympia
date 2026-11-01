'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type Step = 'identifier' | 'password' | 'setup' | 'forgot-sent';

const IDENTIFIER_KEY = 'wellness_identifier';
const MIN_PASSWORD_LENGTH = 6;
const RESET_NOTICE = 'Tu contraseña ha sido restablecida. Crea una nueva para entrar.';

// localStorage puede no estar disponible (modo privado, etc.)
const storage = {
  get: () => {
    try {
      return localStorage.getItem(IDENTIFIER_KEY);
    } catch {
      return null;
    }
  },
  set: (value: string) => {
    try {
      localStorage.setItem(IDENTIFIER_KEY, value);
    } catch {}
  },
  clear: () => {
    try {
      localStorage.removeItem(IDENTIFIER_KEY);
    } catch {}
  },
};

// Botones secundarios (¿Has olvidado...?, Volver): grandes para tocar fácil en el móvil
const secondaryButtonClass =
  'w-full mt-4 py-2.5 rounded-md border border-gray-500 text-gray-200 text-sm font-semibold hover:bg-gray-600 active:bg-gray-500 transition';

const inputClass =
  'w-full px-4 py-3 mb-4 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-white placeholder-gray-400 bg-gray-700';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  // Mensaje informativo (no es un error): p. ej. "tu contraseña ha sido restablecida"
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  // Mientras se comprueba el estado de la cuenta recordada, no se muestra el formulario
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();

  const goTo = (next: Step, message = '') => {
    setError('');
    setNotice(message);
    setPassword('');
    setConfirmPassword('');
    setStep(next);
  };

  const post = async (url: string, body: object) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return { res, data: await res.json() };
  };

  // Pregunta al servidor en qué estado está la cuenta (¿tiene contraseña? ¿la restablecieron?)
  const checkAccount = async (id: string): Promise<boolean> => {
    const { res, data } = await post('/api/login', { identifier: id });
    if (res.ok && data.status === 'needs_setup') {
      goTo('setup', data.reset ? RESET_NOTICE : '');
      return true;
    }
    if (res.ok && data.status === 'needs_password') {
      goTo('password');
      return true;
    }
    if (res.status === 401) storage.clear();
    return false;
  };

  // Si el dispositivo recuerda el identificador, se salta ese paso según el estado de la cuenta
  useEffect(() => {
    const saved = storage.get();
    if (!saved) return setInitializing(false);
    setIdentifier(saved);
    checkAccount(saved)
      .catch(() => goTo('password'))
      .finally(() => setInitializing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishLogin = (redirectUrl: string) => {
    storage.set(identifier.trim());
    router.replace(redirectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 'setup') {
      if (password.length < MIN_PASSWORD_LENGTH)
        return setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
      if (password !== confirmPassword) return setError('Las contraseñas no coinciden');
    }

    setLoading(true);
    try {
      const id = identifier.trim();
      const { res, data } =
        step === 'setup'
          ? await post('/api/auth/setup-password', { identifier: id, password })
          : await post(
              '/api/login',
              step === 'password' ? { identifier: id, password } : { identifier: id },
            );

      if (res.ok && data.redirectUrl) return finishLogin(data.redirectUrl);
      if (res.ok && data.status === 'needs_setup')
        return goTo('setup', data.reset ? RESET_NOTICE : '');
      if (res.ok && data.status === 'needs_password') return goTo('password');

      if (res.status === 401 && data.error === 'Usuario no encontrado') storage.clear();
      setError(data.error || 'Error desconocido');
    } catch (err) {
      console.error(err);
      setError('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setLoading(true);
    try {
      const { res, data } = await post('/api/auth/forgot', { identifier: identifier.trim() });
      if (!res.ok) return setError(data.error || 'Error desconocido');

      // Quién restablece: el coach a las jugadoras, el administrador a los coaches
      const who = data.role === 'coach' ? 'el administrador' : 'tu entrenador/a';
      const contact = data.role === 'coach' ? ' Escríbele por WhatsApp para que lo vea antes.' : '';

      if (data.status === 'already_reset') return goTo('setup', RESET_NOTICE);
      if (data.status === 'contact_admin')
        return setError(
          'La cuenta de administrador se restablece desde la terminal (npm run reset-password).',
        );
      if (data.status === 'already_requested')
        return goTo(
          'forgot-sent',
          `Ya enviaste una solicitud y ${who} todavía no la ha atendido.${contact}`,
        );
      goTo(
        'forgot-sent',
        `Hemos avisado a ${who}. Cuando restablezca tu cuenta, crea una contraseña nueva.${contact}`,
      );
    } catch {
      setError('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  // Desde la pantalla de "solicitud enviada": ¿ya la han restablecido?
  const handleCheckReset = async () => {
    setLoading(true);
    try {
      const { res, data } = await post('/api/login', { identifier: identifier.trim() });
      if (res.ok && data.status === 'needs_setup') return goTo('setup', RESET_NOTICE);
      setNotice('Todavía no han restablecido tu contraseña. Inténtalo más tarde.');
    } catch {
      setError('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const changeUser = () => {
    storage.clear();
    setIdentifier('');
    goTo('identifier');
  };

  const titles: Record<Step, string> = {
    identifier: 'Iniciar sesión',
    password: 'Introduce tu contraseña',
    setup: 'Crea tu contraseña',
    'forgot-sent': 'Solicitud enviada',
  };

  if (initializing)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[rgb(33,37,41)]">
        <div className="text-white">Cargando...</div>
      </div>
    );

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-[rgb(33,37,41)]">
      <div className="flex justify-center items-center gap-6 mb-2 mt-[-100px]">
        <Image src="/logos/app_logo.png" alt="Wellness" width={220} height={220} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-8 rounded-2xl shadow-lg w-80 text-center bg-[rgb(45,50,55)]"
      >
        <h1 className="text-2xl font-bold mb-6 text-white">{titles[step]}</h1>

        {step === 'identifier' ? (
          <>
            <input
              type="text"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Identificador"
              className={inputClass}
              required
            />
            {/* Ayuda: cómo se forma el identificador de una jugadora */}
            <div className="mb-5 rounded-xl bg-ink-900/60 p-3 text-left text-sm text-gray-300">
              <p>
                Es tu <strong className="text-white">nombre + apellido + equipo</strong>, todo junto y
                en minúsculas.
              </p>
              <p className="mt-2 text-xs text-gray-400">Ejemplo: Ana Ruiz, de Senior A</p>
              <p className="mt-1 font-mono text-base text-white">
                anaruiz<span className="text-brand font-bold">sa</span>
              </p>
              <div className="mt-3 flex gap-1.5">
                {[
                  ['sa', 'Senior A'],
                  ['sb', 'Senior B'],
                  ['sc', 'Senior C'],
                ].map(([suffix, team]) => (
                  <span
                    key={suffix}
                    className="flex-1 rounded-lg bg-ink-700 px-1 py-1.5 text-center text-xs"
                  >
                    <span className="font-mono font-bold text-brand">{suffix}</span>
                    <span className="block text-gray-400">{team}</span>
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Campo de usuario para que el gestor de contraseñas del móvil lo asocie */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={identifier}
              readOnly
              hidden
            />
            <p className="text-gray-300 text-sm mb-4">
              <span className="text-green-400 font-semibold">{identifier}</span>
              <br />
              <button
                type="button"
                onClick={changeUser}
                className="mt-2 px-4 py-1.5 rounded-full border border-gray-500 text-gray-200 text-sm hover:bg-gray-600 active:bg-gray-500 transition"
              >
                ¿No eres tú?
              </button>
            </p>
          </>
        )}

        {notice && <p className="text-yellow-300 text-sm mb-4">{notice}</p>}

        {step === 'setup' && !notice && (
          <p className="text-gray-300 text-sm mb-4">
            Es tu primer acceso: crea una contraseña de al menos {MIN_PASSWORD_LENGTH} caracteres.
          </p>
        )}

        {(step === 'password' || step === 'setup') && (
          <input
            type="password"
            name="password"
            autoComplete={step === 'setup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={step === 'setup' ? 'Nueva contraseña' : 'Contraseña'}
            className={inputClass}
            autoFocus
            required
          />
        )}

        {step === 'setup' && (
          <input
            type="password"
            name="confirm-password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la contraseña"
            className={inputClass}
            required
          />
        )}

        {step === 'forgot-sent' ? (
          <>
            <button
              type="button"
              onClick={handleCheckReset}
              disabled={loading}
              className="w-full py-3 rounded-md font-semibold text-black bg-brand hover:bg-brand-hover shadow-md"
            >
              {loading ? 'Comprobando...' : 'Ya me la han restablecido'}
            </button>
            <button type="button" onClick={() => goTo('password')} className={secondaryButtonClass}>
              Volver a introducir mi contraseña
            </button>
          </>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-md font-semibold text-black transition ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-brand hover:bg-brand-hover shadow-md'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                Cargando...
              </div>
            ) : step === 'identifier' ? (
              'Continuar'
            ) : step === 'setup' ? (
              'Crear contraseña y entrar'
            ) : (
              'Entrar'
            )}
          </button>
        )}

        {step === 'password' && (
          <button
            type="button"
            onClick={handleForgot}
            disabled={loading}
            className={secondaryButtonClass}
          >
            ¿Has olvidado tu contraseña?
          </button>
        )}

        {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
      </form>
    </div>
  );
}
