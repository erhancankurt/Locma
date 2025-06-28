import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
}

interface MapProps {
  locations: Location[];
  myLocation?: { lat: number; lng: number };
}

export function LocationMap({ locations, myLocation }: MapProps) {
  const [center, setCenter] = useState<[number, number]>([39.92077, 32.85411]); // Ankara merkez

  useEffect(() => {
    if (myLocation) {
      setCenter([myLocation.lat, myLocation.lng]);
    }
  }, [myLocation]);

  // Eğer myLocation varsa, ilk render'da haritayı oraya odakla
  useEffect(() => {
    if (myLocation) {
      setCenter([myLocation.lat, myLocation.lng]);
    } else if (locations.length > 0) {
      setCenter([locations[0].lat, locations[0].lng]);
    }
  }, []);

  // Marker üstünde profil fotoğrafı için custom icon
  function createProfileIcon(photoURL?: string) {
    return L.divIcon({
      className: '',
      html: `<div style="display:flex;align-items:center;justify-content:center;width:48px;height:48px;background:rgba(255,255,255,0.9);border-radius:50%;box-shadow:0 2px 8px #0002;overflow:hidden;border:2px solid #1976d2;">
        <img src='${photoURL || "https://ui-avatars.com/api/?background=1976d2&color=fff&name=K"}' style='width:44px;height:44px;object-fit:cover;border-radius:50%;' />
      </div>`
    });
  }

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: '400px', width: '100%', borderRadius: '8px' }}
      key={center.join(',')}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {locations.map((loc) => (
        <Marker
          key={loc.id}
          position={[loc.lat, loc.lng]}
          icon={createProfileIcon(loc.photoURL)}
        >
          <Popup>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',minWidth:100}}>
              {loc.photoURL && <img src={loc.photoURL} alt="Profil" style={{width:48,height:48,borderRadius:'50%',marginBottom:6,objectFit:'cover',boxShadow:'0 2px 8px #0002'}} />}
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
