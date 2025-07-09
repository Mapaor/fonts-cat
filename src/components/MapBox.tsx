'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import LoadingSpinner from './LoadingSpinner';

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
        // Create water drop icon
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = 32;
        canvas.height = 40;
        
        // Draw water drop shape - classic teardrop
        ctx.fillStyle = '#1E40AF'; // Blue color
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        // Start from the top point
        ctx.moveTo(16, 4);
        // Left curve down to bottom
        ctx.bezierCurveTo(6, 14, 6, 24, 16, 32);
        // Right curve back up to top
        ctx.bezierCurveTo(26, 24, 26, 14, 16, 4);
        ctx.closePath();
        
        ctx.fill();
        ctx.stroke();
        
        // Add small highlight for glossy effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(13, 12, 3, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Add the icon to the map
        map.current!.addImage('water-drop', ctx.getImageData(0, 0, canvas.width, canvas.height));

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

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Info panel */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          Sobre la web
        </h2>
        <p className="text-sm text-gray-600 mb-2">
          És una web feta amb React i NextJS que utilitza MapBox per renderitzar el mapa a partir de les dades públiques d&apos;OpenStreetMap. 
        </p>
        <div className="flex justify-between items-end">
          <div className="flex-1">
            {loading ? (
              <p className="text-xs text-blue-600">Carregant dades...</p>
            ) : (
              <p className="text-xs text-green-600">
                {fountainCount.toLocaleString()} fonts carregades
              </p>
            )}
            <div className="mt-3 text-xs text-gray-500">
              <p>💡 Fes clic als grups per mostrar-los</p>
              <p>🔍 Fes zoom al teu municipi</p>
              <p>⛲ Clica a baix a la dreta del mapa per afegir una font</p>
            </div>
          </div>
          
          {/* GitHub icon positioned at the same height */}
          <div className="ml-4">
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
