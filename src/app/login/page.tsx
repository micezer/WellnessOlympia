import { redirect } from 'next/navigation';

// El login vive en '/'; esta ruta se mantiene por enlaces antiguos
export default function LoginRedirect() {
  redirect('/');
}
