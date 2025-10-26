import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import { Event } from '../services/api';

// Configuration des icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface MapComponentProps {
  events: Event[];
  onEventSelect: (event: Event) => void;
  userPosition: [number, number] | null;
  selectedEventId?: string | null;
  onMapBackgroundClick?: () => void;
}

export type MapComponentHandle = {
  recenterToUser: () => void;
};

const MapComponent = forwardRef<MapComponentHandle, MapComponentProps>(({ events, onEventSelect, userPosition, selectedEventId, onMapBackgroundClick }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<{[key: string]: L.Marker}>({});
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Détecter le mobile pour adapter les interactions
    const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches;

    // Initialisation de la carte
    const map = L.map(mapContainer.current, {
      zoomControl: true,
      scrollWheelZoom: !isMobile, // éviter les conflits de scroll sur mobile
      touchZoom: true,
      dragging: true,
    }).setView([48.8566, 2.3522], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    mapInstance.current = map;

    // Invalider la taille lors des redimensionnements (utile quand la sidebar devient un panneau mobile)
    const handleResize = () => {
      if (mapInstance.current) {
        setTimeout(() => mapInstance.current && mapInstance.current.invalidateSize(), 150);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Mettre à jour la position utilisateur
  useEffect(() => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;

    // Supprimer l'ancien marqueur utilisateur
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
    }

    if (userPosition) {
      // Créer le nouveau marqueur utilisateur
      userMarkerRef.current = L.circleMarker(userPosition, {
        radius: 8,
        color: '#0078d4',
        fillColor: '#ffffff',
        fillOpacity: 1,
        weight: 2
      }).addTo(map).bindPopup('📍 Vous êtes ici');

      // Centrer la carte sur la position utilisateur
      map.setView(userPosition, 14);
    }
  }, [userPosition]);

  // Mettre à jour les marqueurs d'événements
  useEffect(() => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;

    // Supprimer tous les anciens marqueurs
    Object.values(markersRef.current).forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current = {};

    // Ajouter les nouveaux marqueurs
    events.forEach(event => {
      if (event.lat && event.lng) {
        const attendeeCount = event.attendees ? event.attendees.length : 0;
        const maxAttendees = event.maxAttendees;
        const isFull = maxAttendees && attendeeCount >= maxAttendees;
        
        // Icône selon le statut
        const iconColor = isFull ? '#ef4444' : '#10b981';
        const statusEmoji = isFull ? '🔴' : '🟢';

        // Créer une icône personnalisée
        const customIcon = L.divIcon({
          html: `<div style="
            background: ${iconColor}; 
            border: 3px solid white; 
            border-radius: 50%; 
            width: 24px; 
            height: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
          ">${statusEmoji}</div>`,
          className: 'custom-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([event.lat, event.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937;">✨ ${event.title}</h3>
              <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
                🎯 ${event.type}<br>
                🎭 ${event.audience}<br>
                📅 ${new Date(event.datetime).toLocaleString('fr-FR')}<br>
                📍 ${event.placeName}<br>
                👥 ${attendeeCount}${maxAttendees ? '/' + maxAttendees : ''} participant${attendeeCount > 1 ? 's' : ''}
              </p>
              ${event.description ? `<p style="margin: 8px 0; color: #374151; font-size: 13px;">${event.description}</p>` : ''}
              <button onclick="window.selectEvent('${event.id}')" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                margin-top: 8px;
              ">Voir détails</button>
            </div>
          `);

        markersRef.current[event.id] = marker;
      }
    });
  }, [events]);

  // Ouvrir le popup et centrer sur l'événement sélectionné
  useEffect(() => {
    if (!mapInstance.current || !selectedEventId) return;
    const marker = markersRef.current[selectedEventId];
    if (marker) {
      const latlng = marker.getLatLng();
      mapInstance.current.setView(latlng, 16, { animate: true });
      marker.openPopup();
    }
  }, [selectedEventId, events]);

  // Fonction globale pour sélectionner un événement depuis la popup
  useEffect(() => {
    (window as any).selectEvent = (eventId: string) => {
      const event = events.find(e => e.id === eventId);
      if (event) {
        onEventSelect(event);
      }
    };

    return () => {
      delete (window as any).selectEvent;
    };
  }, [events, onEventSelect]);

  // Click sur le fond de carte -> fermeture du panneau sur mobile
  useEffect(() => {
    if (!mapInstance.current) return;
    const handler = () => onMapBackgroundClick && onMapBackgroundClick();
    mapInstance.current.on('click', handler);
    return () => {
      mapInstance.current && mapInstance.current.off('click', handler);
    };
  }, [onMapBackgroundClick]);

  // Méthode impérative pour recentrer sur l'utilisateur
  useImperativeHandle(ref, () => ({
    recenterToUser: () => {
      if (mapInstance.current && userPosition) {
        mapInstance.current.setView(userPosition, 15, { animate: true });
        // Ouvrir le popup utilisateur si présent
        if (userMarkerRef.current) {
          userMarkerRef.current.openPopup();
        }
      }
    },
  }), [userPosition]);

  return (
    <div
      ref={mapContainer}
      style={{ height: '100%', width: '100%', borderRadius: 0 }}
      className="map-container"
    />
  );
});

export default MapComponent;