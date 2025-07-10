'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import LoadingSpinner from './LoadingSpinner';
import Image from 'next/image';

interface MapBoxProps {
  accessToken: string;
}

export default function MapBox({ accessToken }: MapBoxProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng] = useState(1.5); // Catalonia longitude center
  const [lat] = useState(41.8); // Catalonia latitude center
  const [zoom] = useState(7); // Initial zoom level
  const [fountainCount, setFountainCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [infoPanelCollapsed, setInfoPanelCollapsed] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isMobileChrome, setIsMobileChrome] = useState(false);

  // Function to get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('La geolocalització no està suportada en aquest navegador');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location: [number, number] = [longitude, latitude];
        setUserLocation(location);
        setLocationLoading(false);
        
        // Center map on user's location
        if (map.current) {
          map.current.flyTo({
            center: location,
            zoom: 15, // Zoom closer to show more detail
            duration: 2000 // Smooth animation
          });
        }
      },
      (error) => {
        setLocationLoading(false);
        let errorMessage = 'Error obtenint la ubicació';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permisos de ubicació denegats';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicació no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Temps d\'espera esgotat obtenint la ubicació';
            break;
        }
        
        setLocationError(errorMessage);
        
        // Clear error after 5 seconds
        setTimeout(() => setLocationError(null), 5000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache location for 5 minutes
      }
    );
  };

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Set Mapbox access token
    mapboxgl.accessToken = accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12', // Outdoor style suitable for fountains
      center: [lng, lat],
      zoom: zoom,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add scale control
    map.current.addControl(new mapboxgl.ScaleControl({
      maxWidth: 80,
      unit: 'metric'
    }), 'bottom-left');

    map.current.on('load', async () => {
      try {
        // Load water drop icon from SVG
        await new Promise<void>((resolve, reject) => {
          const img = document.createElement('img') as HTMLImageElement;
          img.onload = () => {
            try {
              // Create canvas to render the SVG
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d')!;
              canvas.width = 32;
              canvas.height = 32;
              
              // Draw the SVG image onto the canvas
              ctx.drawImage(img, 0, 0, 32, 32);
              
              // Add the icon to the map
              map.current!.addImage('water-drop', ctx.getImageData(0, 0, canvas.width, canvas.height));
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          img.onerror = () => reject(new Error('Failed to load SVG icon'));
          img.src = '/potable-water.svg';
        });

        // Create user location icon
        const locationCanvas = document.createElement('canvas');
        const locationCtx = locationCanvas.getContext('2d')!;
        locationCanvas.width = 24;
        locationCanvas.height = 24;
        
        // Draw location icon - blue circle with white center
        locationCtx.fillStyle = '#3B82F6'; // Blue color
        locationCtx.strokeStyle = '#ffffff';
        locationCtx.lineWidth = 3;
        
        locationCtx.beginPath();
        locationCtx.arc(12, 12, 10, 0, Math.PI * 2);
        locationCtx.fill();
        locationCtx.stroke();
        
        // White center
        locationCtx.fillStyle = '#ffffff';
        locationCtx.beginPath();
        locationCtx.arc(12, 12, 5, 0, Math.PI * 2);
        locationCtx.fill();
        
        // Add the location icon to the map
        map.current!.addImage('user-location', locationCtx.getImageData(0, 0, locationCanvas.width, locationCanvas.height));

        // Fetch the GeoJSON data
        const response = await fetch('/fonts-cat.geojson');
        const data = await response.json();
        
        // Count fountains
        setFountainCount(data.features?.length || 0);

        // Process the data to convert Polygon features to Point features for better visualization
        const processedFeatures = data.features?.map((feature: { geometry?: { type?: string; coordinates?: unknown }; [key: string]: unknown }) => {
          if (feature.geometry?.type === 'Polygon' && Array.isArray(feature.geometry.coordinates)) {
            // Calculate centroid for polygon features
            const coords = (feature.geometry.coordinates as number[][][])[0];
            if (Array.isArray(coords) && coords.length > 0) {
              const centerLng = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / coords.length;
              const centerLat = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / coords.length;
              
              return {
                ...feature,
                geometry: {
                  type: 'Point',
                  coordinates: [centerLng, centerLat]
                }
              };
            }
          }
          return feature;
        }) || [];

        const processedData = {
          type: 'FeatureCollection',
          features: processedFeatures
        };

        // Add source
        map.current!.addSource('fountains', {
          type: 'geojson',
          data: processedData as GeoJSON.FeatureCollection,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50
        });

        // Add cluster circle layer
        map.current!.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'fountains',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#3B82F6', // blue for small clusters
              10,
              '#10B981', // green for medium clusters
              30,
              '#F59E0B' // orange for large clusters
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              15, // small clusters
              10,
              20, // medium clusters
              30,
              25 // large clusters
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff'
          }
        });

        // Add cluster count labels
        map.current!.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'fountains',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
          },
          paint: {
            'text-color': '#ffffff'
          }
        });

        // Add individual fountain points as water drop symbols
        map.current!.addLayer({
          id: 'unclustered-point',
          type: 'symbol',
          source: 'fountains',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': 'water-drop',
            'icon-size': 0.8,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
          }
        });

        // Add click events for clusters
        map.current!.on('click', 'clusters', (e) => {
          const features = map.current!.queryRenderedFeatures(e.point, {
            layers: ['clusters']
          });

          const clusterId = features[0].properties?.cluster_id;
          if (clusterId !== undefined) {
            (map.current!.getSource('fountains') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
              clusterId,
              (err, zoom) => {
                if (err || zoom === null || zoom === undefined) return;

                const coordinates = (features[0].geometry as GeoJSON.Point).coordinates.slice();
                map.current!.easeTo({
                  center: coordinates as [number, number],
                  zoom: zoom
                });
              }
            );
          }
        });

        // Add click events for individual points
        map.current!.on('click', 'unclustered-point', (e) => {
          const coordinates = (e.features![0].geometry as GeoJSON.Point).coordinates.slice();
          const properties = e.features![0].properties;
          
          const name = properties?.name || properties?.['name:ca'] || 'Font sense nom';
          
          new mapboxgl.Popup()
            .setLngLat(coordinates as [number, number])
            .setHTML(`
              <div class="p-2">
                <h3 class="font-bold text-blue-600">${name}</h3>
                <p class="text-sm text-gray-600">Font d&apos;aigua potable</p>
                <p class="text-xs text-gray-500">ID: ${properties?.['@id'] || 'N/A'}</p>
                <p class="text-xs text-gray-500">Coordenades: ${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}</p>
                <p class="text-xs mt-2">
                  <a href="https://www.google.com/maps?q=${coordinates[1]},${coordinates[0]}" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     class="text-blue-600 hover:text-blue-800 underline">
                     Mostra a Google Maps
                  </a>
                </p>
              </div>
            `)
            .addTo(map.current!);
        });

        // Change cursor on hover
        map.current!.on('mouseenter', 'clusters', () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });

        map.current!.on('mouseleave', 'clusters', () => {
          map.current!.getCanvas().style.cursor = '';
        });

        map.current!.on('mouseenter', 'unclustered-point', () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });

        map.current!.on('mouseleave', 'unclustered-point', () => {
          map.current!.getCanvas().style.cursor = '';
        });

        // Add events to collapse info panel on mobile when interacting with the map
        const collapseOnMobileIfNotOnFeature = (e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) => {
          if (window.innerWidth < 768) {
            // Check if the interaction is not on a cluster or unclustered point
            const features = map.current!.queryRenderedFeatures(e.point, {
              layers: ['clusters', 'unclustered-point']
            });
            
            // If no features were interacted with, collapse the panel
            if (features.length === 0) {
              setInfoPanelCollapsed(true);
            }
          }
        };

        // For events that don't have a point (like dragstart), always collapse on mobile
        const collapseOnMobile = () => {
          if (window.innerWidth < 768) {
            setInfoPanelCollapsed(true);
          }
        };

        map.current!.on('dragstart', collapseOnMobile);
        map.current!.on('zoomstart', collapseOnMobile);
        map.current!.on('rotatestart', collapseOnMobile);
        map.current!.on('touchstart', collapseOnMobileIfNotOnFeature);
        map.current!.on('click', collapseOnMobileIfNotOnFeature);

        setLoading(false);
      } catch (error) {
        console.error('Error loading fountain data:', error);
        setLoading(false);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [accessToken, lng, lat, zoom]);

  // Effect to handle user location marker
  useEffect(() => {
    if (!map.current || !userLocation) return;

    const [lng, lat] = userLocation;

    // Create source for user location if it doesn't exist
    if (!map.current.getSource('user-location')) {
      map.current.addSource('user-location', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            properties: {}
          }]
        }
      });

      // Add layer for user location
      map.current.addLayer({
        id: 'user-location-layer',
        type: 'symbol',
        source: 'user-location',
        layout: {
          'icon-image': 'user-location',
          'icon-size': 1,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        }
      });

      // Add pulsing circle around user location
      map.current.addLayer({
        id: 'user-location-pulse',
        type: 'circle',
        source: 'user-location',
        paint: {
          'circle-radius': 15,
          'circle-color': '#3B82F6',
          'circle-opacity': 0.3,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#3B82F6',
          'circle-stroke-opacity': 0.6
        }
      });
    } else {
      // Update existing source
      (map.current.getSource('user-location') as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          properties: {}
        }]
      });
    }
  }, [userLocation]);

  // Detect Chrome on Android and apply specific fixes
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isAndroid = /Android/i.test(userAgent);
    const isChrome = /Chrome/i.test(userAgent) && !/Edge/i.test(userAgent);
    
    if (isAndroid && isChrome) {
      setIsMobileChrome(true);
      
      // Force reflow for Chrome Android rendering issues
      const forceReflow = () => {
        const geoButton = document.querySelector('[aria-label*="ubicació"]');
        if (geoButton) {
          const element = geoButton as HTMLElement;
          element.style.display = 'none';
          void element.offsetHeight; // Force reflow
          element.style.display = 'flex';
        }
      };
      
      // Apply fix after DOM is ready
      setTimeout(forceReflow, 1000);
      
      // Also apply on window resize (orientation change)
      const handleResize = () => setTimeout(forceReflow, 300);
      window.addEventListener('resize', handleResize);
      
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Info panel */}
      <div className="absolute top-4 left-0 w-fit pointer-events-none">
        {/* Collapsed state - info icon (mobile only) */}
        <div className={`md:hidden absolute top-0 left-4 transition-all duration-300 pointer-events-auto ${infoPanelCollapsed ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
          <button
            onClick={() => setInfoPanelCollapsed(false)}
            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-600 hover:text-blue-800 transition-all duration-300 hover:scale-110"
          >
            <svg className="w-6 h-6 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
            </svg>
          </button>
        </div>

        {/* Expanded state */}
        <div className={`bg-white rounded-lg shadow-lg p-4 max-w-sm ml-4 mr-4 md:mr-0 pointer-events-auto transition-all duration-500 ease-in-out transform origin-top-left ${
          infoPanelCollapsed ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}>
          <h2 className="text-lg font-bold text-gray-800 mb-2 transition-opacity duration-300">
            Sobre la web
          </h2>
          <p className="text-sm text-gray-600 mb-2 transition-opacity duration-300 delay-75">
            És una web feta amb React i NextJS que utilitza MapBox per renderitzar el mapa a partir de les dades públiques d&apos;OpenStreetMap. 
          </p>
          <div className="flex justify-between items-end">
            <div className="flex-1">
              {loading ? (
                <p className="text-xs text-blue-600 transition-opacity duration-300 delay-100">Carregant dades...</p>
              ) : (
                <p className="text-xs text-green-600 transition-opacity duration-300 delay-100">
                  {fountainCount.toLocaleString()} fonts carregades
                </p>
              )}
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p className="transition-all duration-300 delay-150">💡 Fes clic als grups (cercles) per mostrar les seves fonts</p>
                <p className="transition-all duration-300 delay-200">🔍 O simplement fes zoom fins al teu municipi</p>
                <p className="md:hidden transition-all duration-300 delay-250">📱 Interactua amb el mapa per amagar aquest panell</p>
                <p className="transition-all duration-300 delay-300">✏️ <button 
                      onClick={() => setShowTutorialModal(true)}
                      className="text-blue-600 hover:text-blue-800 underline cursor-pointer transition-all duration-200 hover:scale-105 transform inline-block"
                    >
                      Clica aquí
                    </button> per aprendre a afegir una font</p>
              </div>
            </div>
            
            {/* GitHub icon positioned at the same height */}
            <div className="ml-4 transition-all duration-300 delay-200">
              <a 
                href="https://github.com/Mapaor/fonts-cat" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block text-gray-600 hover:text-green-600 transition-all duration-300 hover:scale-125 transform"
              >
                <svg 
                  className="w-8 h-8" 
                  fill="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorialModal && (
        <div className="fixed inset-0 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto relative">
            {/* Close button */}
            <button
              onClick={() => setShowTutorialModal(false)}
              className="absolute top-4 right-4 text-red-600 hover:text-red-800 text-2xl font-bold z-10"
            >
              ✕
            </button>
            
            {/* Modal content */}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Com afegir una font a OpenStreetMap</h2>
              
              <div className="space-y-6">
                <section>
                  <h3 className="text-xl font-semibold text-blue-600 mb-4">1. Entrar en l&apos;editor</h3>
                  <ol className="list-decimal list-inside space-y-3 text-gray-700">
                    <li>Crea&apos;t un compte de OpenStreetMap a <a href="https://openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors">openstreetmap.org</a></li>
                    <li>Inicia la sessió i vés aproximadament a la ubicació on vols afegir la font</li>
                    <li>
                      Clica el botó de &apos;Edita&apos; a dalt a l&apos;esquerra
                      <div className="mt-2 bg-gray-100 p-2 rounded">
                        <Image 
                          src="/edit-OSM.jpg" 
                          alt="Botó d'editar a OpenStreetMap" 
                          className="max-w-full h-auto rounded border"
                          width={600}
                          height={400}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Ara et trobes en l&apos;editor iD (el per defecte) de OSM.</p>
                    </li>
                    <li>
                      <strong>Opcional:</strong> si vols fes la visita guiada (&apos;Comença la introducció&apos;), 
                      i presta especial interès en el capítol &apos;Punts&apos;.
                    </li>
                    <li>
                      Clica l&apos;opció &apos;Editeu-lo ara&apos; per començar a editar el mapa. 
                      (Si has decidit fer la visita guiada simplement clica al botó &quot;Comenceu a editar&quot; 
                      seguit de &quot;D&apos;acord&quot;, &quot;D&apos;acord&quot; i &quot;D&apos;acord&quot;).
                      <div className="mt-2 bg-gray-100 p-2 rounded">
                        <Image 
                          src="/edit-now.jpg" 
                          alt="Botó d'editar ara" 
                          className="max-w-full h-auto rounded border"
                          width={600}
                          height={400}
                        />
                      </div>
                    </li>
                  </ol>
                  <p className="mt-4 text-gray-600 italic">
                    Ara que ja estem dins l&apos;editor i sabem com funciona, ja podem afegir o modificar fonts.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-blue-600 mb-4">2. Afegir fonts d&apos;aigua potable</h3>
                  
                  <div className="mb-4 bg-gray-100 p-4 rounded">
                    <Image 
                      src="/iD-add-fountain.jpg" 
                      alt="Afegir font amb l'editor iD" 
                      className="max-w-full h-auto rounded border"
                      width={600}
                      height={400}
                    />
                  </div>
                  
                  <ol className="list-decimal list-inside space-y-3 text-gray-700">
                    <li>Cliquem a dalt al centre &apos;Punt&apos; i marquem al mapa la posició exacta de la font</li>
                    <li>Al buscador busquem &apos;Aigua apte per al consum&apos; (icona d&apos;una aixeta)</li>
                    <li>Deixem tots els altres camps en blanc (sense tocar) i cliquem la creu (X) per tancar la pestanya d&apos;edició de l&apos;objecte.</li>
                    <li>Un cop estem segurs que la font existeix i es troba en aquella posició li donem a dalt a la dreta a desa.</li>
                  </ol>
                </section>

                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <p className="text-blue-800">
                    <strong>Nota important:</strong> Només afegeix fonts que existeixin realment i que hagis vist personalment. 
                    OpenStreetMap es basa en dades verificades i precises.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Geolocation button */}
      <div className={`absolute bottom-10 right-4 z-40 ${isMobileChrome ? 'will-change-transform hidden' : ''}`}>
        <button
          onClick={getUserLocation}
          disabled={locationLoading}
          className={`w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 relative ${
            isMobileChrome ? 'transform-gpu will-change-transform' : ''
          } ${
            locationLoading 
              ? 'text-gray-400 cursor-not-allowed' 
              : userLocation 
                ? 'text-green-600 hover:text-green-800 hover:shadow-xl cursor-pointer' 
                : 'text-blue-600 hover:text-blue-800 hover:shadow-xl cursor-pointer'
          }`}
          style={{ 
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            zIndex: 1000,
            ...(isMobileChrome && {
              WebkitTransform: 'translateZ(0)',
              transform: 'translateZ(0)',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden'
            })
          }}
          title={locationLoading ? 'Obtenint ubicació...' : userLocation ? 'Tornar a centrar en la meva ubicació' : 'Vés a la meva ubicació'}
          aria-label={locationLoading ? 'Obtenint ubicació...' : userLocation ? 'Tornar a centrar en la meva ubicació' : 'Vés a la meva ubicació'}
        >
          {locationLoading ? (
            <div className="w-5 h-5 flex items-center justify-center">
              <LoadingSpinner size="sm" color="gray" />
            </div>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Fallback geolocation button for Chrome Android */}
      {isMobileChrome && (
        <div 
          className="fixed z-50"
          style={{
            bottom: '24px',
            right: '16px',
            position: 'fixed',
            pointerEvents: 'auto'
          }}
        >
          <button
            onClick={getUserLocation}
            disabled={locationLoading}
            className={`w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center border-2 border-gray-200 ${
              locationLoading 
                ? 'text-gray-400 cursor-not-allowed' 
                : userLocation 
                  ? 'text-green-600 border-green-300 cursor-pointer' 
                  : 'text-blue-600 border-blue-300 cursor-pointer'
            }`}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              zIndex: 2000,
              WebkitTransform: 'translate3d(0,0,0)',
              transform: 'translate3d(0,0,0)'
            }}
            title="Ubicació"
            aria-label="Obtenir la meva ubicació"
          >
            {locationLoading ? (
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
            ) : (
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Location error toast */}
      {locationError && (
        <div className="absolute top-20 left-4 right-4 z-50">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg max-w-sm mx-auto">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{locationError}</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <LoadingSpinner size="lg" color="blue" />
            <p className="mt-2 text-gray-600">Carregant mapa...</p>
          </div>
        </div>
      )}
    </div>
  );
}
