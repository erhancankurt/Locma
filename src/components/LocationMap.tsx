import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

interface Location {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
  photoURL?: string;
  displayName?: string;
  color?: string;
}

interface MapProps {
  locations: Location[];
  myLocation?: { lat: number; lng: number };
}



// Tüm marker'ları kapsayacak şekilde haritayı sadece kişi sayısı değişince otomatik uzaklaştıran bileşen
import { useRef } from 'react';
function FitBounds({ locations, myLocation }: { locations: Location[]; myLocation?: { lat: number; lng: number } }) {
  const map = useMap();
  const prevCount = useRef<number>(0);
  useEffect(() => {
    const count = locations.length + (myLocation ? 1 : 0);
    if (count !== prevCount.current) {
      const bounds = L.latLngBounds([]);
      locations.forEach(loc => bounds.extend([loc.lat, loc.lng]));
      if (myLocation) bounds.extend([myLocation.lat, myLocation.lng]);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      }
      prevCount.current = count;
    }
    // eslint-disable-next-line
  }, [locations.length, myLocation, map]);
  return null;
}

export function LocationMap({ locations, myLocation }: MapProps) {
  // Sadece ilk render'da center belirle
  const initialCenter: [number, number] = myLocation
    ? [myLocation.lat, myLocation.lng]
    : locations.length > 0
    ? [locations[0].lat, locations[0].lng]
    : [39.92077, 32.85411]; // Ankara merkez
  const [center, setCenter] = useState<[number, number]>(initialCenter);

  // Sadece myLocation değişirse haritayı oraya panner ile kaydır
  useEffect(() => {
    if (myLocation) {
      setCenter([myLocation.lat, myLocation.lng]);
    }
  }, [myLocation]);

  // Marker üstünde profil fotoğrafı için custom icon
  function getAvatarSrc(photoURL?: string, name?: string, color?: string) {
    if (photoURL) {
      if (photoURL.startsWith('data:image')) return photoURL;
      return photoURL;
    }
    const displayName = name || 'Kullanıcı';
    const bg = color ? color.replace('#', '') : '1976d2';
    return `https://ui-avatars.com/api/?background=${bg}&color=fff&name=${encodeURIComponent(displayName)}`;
  }

  function createProfileIcon(photoURL?: string, name?: string, color?: string) {
    const src = getAvatarSrc(photoURL, name, color);
    const borderColor = color || '#1976d2';
    return L.divIcon({
      className: '',
      html: `<div style="display:flex;align-items:center;justify-content:center;width:48px;height:48px;background:rgba(255,255,255,0.9);border-radius:50%;box-shadow:0 2px 8px #0002;overflow:hidden;border:2px solid ${borderColor};">
        <img src='${src}' style='width:44px;height:44px;object-fit:cover;border-radius:50%;' />
      </div>`
    });
  }

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: '400px', width: '100%', borderRadius: '8px' }}
    >
      <FitBounds locations={locations} myLocation={myLocation} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {locations.map((loc) => (
        <Marker
          key={loc.id}
          position={[loc.lat, loc.lng]}
          icon={createProfileIcon(loc.photoURL, loc.displayName, loc.color)}
        >
          <Popup>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',minWidth:100}}>
              <img
                src={getAvatarSrc(loc.photoURL, loc.displayName, loc.color)}
                alt="Profil"
                style={{width:48,height:48,borderRadius:'50%',marginBottom:6,objectFit:'cover',boxShadow:'0 2px 8px #0002'}}
              />
              <div style={{fontWeight:600}}>{loc.displayName || 'Kullanıcı'}</div>
              <div style={{fontSize:12, color:'#888'}}>Son güncelleme: {new Date(loc.timestamp).toLocaleTimeString()}</div>
            </div>
          </Popup>
        </Marker>
      ))}
      {myLocation && (
        <Marker
          position={[myLocation.lat, myLocation.lng]}
          icon={L.divIcon({
            className: '',
            html: `<div style="display:flex;align-items:center;justify-content:center;width:48px;height:48px;background:#fff;border-radius:50%;box-shadow:0 2px 8px #0002;overflow:hidden;border:2px solid #f50057;">
              <img src='https://ui-avatars.com/api/?background=f50057&color=fff&name=Ben' style='width:44px;height:44px;object-fit:cover;border-radius:50%;' />
            </div>`
          })}
        >
          <Popup>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',minWidth:100}}>
              <img src='https://ui-avatars.com/api/?background=f50057&color=fff&name=Ben' alt="Ben" style={{width:48,height:48,borderRadius:'50%',marginBottom:6,objectFit:'cover',boxShadow:'0 2px 8px #0002'}} />
              <div style={{fontWeight:600}}>Benim Konumum</div>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
