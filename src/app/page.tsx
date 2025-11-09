'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ❌ QUITA la verificación automática de auth aquí
  // Deja que SessionChecker maneje las redirecciones

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();

      if (res.ok && data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        setError(data.error || 'Error desconocido');
      }
    } catch (err) {
      console.error(err);
      setError('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-[rgb(33,37,41)]">
      <div className="flex justify-center items-center gap-6 mb-2 mt-[-100px]">
        <Image src="/logos/app_logo.png" alt="Wellness" width={220} height={220} />
      </div>

      <form
        onSubmit={handleLogin}
        className="p-8 rounded-2xl shadow-lg w-80 text-center bg-[rgb(45,50,55)]"
      >
        <h1 className="text-2xl font-bold mb-6 text-white">Iniciar sesión</h1>

        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Identificador"
          className="w-full px-4 py-3 mb-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white placeholder-gray-400 bg-gray-700"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-md font-semibold text-black transition ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 shadow-md'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              Cargando...
            </div>
          ) : (
            'Entrar'
          )}
        </button>

        {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
      </form>
    </div>
  );
}
