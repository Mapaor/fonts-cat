import MapBox from '@/components/MapBox';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function HomePage() {
  // You'll need to get a Mapbox access token from https://account.mapbox.com/access-tokens/
  const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'your-mapbox-token-here';

  if (!MAPBOX_ACCESS_TOKEN || MAPBOX_ACCESS_TOKEN.length < 60 || MAPBOX_ACCESS_TOKEN.length > 200) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-yellow-500 text-6xl mb-4">🔑</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Token de Mapbox no present o incorrecte
          </h2>
          <p className="text-gray-600 mb-4">
            Per utilitzar aquesta aplicació, necessites configurar un token d&apos;accés de Mapbox.
          </p>
          <div className="text-left bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Passos:</p>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Visita <a href="https://account.mapbox.com/access-tokens/" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">account.mapbox.com</a></li>
              <li>2. Crea o copia un token d&apos;accés</li>
              <li>3. Crea un fitxer .env.local</li>
              <li>4. Afegeix: NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=el-teu-token</li>
            </ol>
          </div>
          <p className="text-xs text-gray-500">
            Consulta el README.md per a instruccions més detallades.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <header className="bg-blue-600 text-white p-4 shadow-lg">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-200">
<path
      d="M21.75 16.25L17 21l-2.75-3l1.16-1.16L17 18.43l3.59-3.59zM17.62 12C16.31 8.1 12 3.25 12 3.25S6 10 6 14c0 3.31 2.69 6 6 6h.34c-.22-.64-.34-1.3-.34-2c0-3.18 2.5-5.78 5.62-6"
    />              </svg>
              Fonts de Catalunya
            </h1>
            <p className="text-blue-100">Un mapa interactiu ben senzill per si un dia busques una font d&apos;aigua potable</p>
          </div>
        </header>
        
        <main className="h-[calc(100vh-88px)]">
          <MapBox accessToken={MAPBOX_ACCESS_TOKEN} />
        </main>
      </div>
    </ErrorBoundary>
  );
}
