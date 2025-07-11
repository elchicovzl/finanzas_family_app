// RUTA: src/middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['es', 'en'],
  defaultLocale: 'es'
});

export const config = {
  // Coincide con todas las rutas excepto las que son archivos (tienen un punto)
  // o las que son rutas internas de Next.js o de la API.
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)']
};