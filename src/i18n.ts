// RUTA: src/i18n.ts
import {getRequestConfig} from 'next-intl/server';

const locales = ['en', 'es'];
 
export default getRequestConfig(async ({locale}) => {
  // Verificamos si el locale proporcionado es válido.
  if (!locales.includes(locale as any)) {
    // Si el locale es inválido (ej. 'de') o `undefined`,
    // devolvemos mensajes vacíos Y UN LOCALE POR DEFECTO.
    // Esto satisface a la librería y evita que la app se rompa.
    return {
      locale: 'es', // Usamos 'es' como valor predeterminado seguro.
      messages: {}
    };
  }
 
  // Si el locale es válido, cargamos sus mensajes.
  return {
    locale, // Devolvemos el locale válido ('es' o 'en').
    messages: (await import(`./messages/${locale}.json`)).default
  };
});