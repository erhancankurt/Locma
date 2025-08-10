// İki konum arasındaki mesafe (km) ve tahmini varış süresi (dakika) hesaplama
// speedKmh: km/saat cinsinden hız (varsayılan: 5 km/h - yürüme)
export function calculateDistanceAndDuration(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  speedKmh: number = 5
): { distanceKm: number; durationMin: number } {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Dünya'nın yarıçapı (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  const durationMin = (distanceKm / speedKmh) * 60;
  return { distanceKm, durationMin };
}
// Rastgele renk üret (pastel tonlar)
export function generateRandomColor() {
  const colors = [
    '#FFB300', '#803E75', '#FF6800', '#A6BDD7', '#C10020', '#CEA262',
    '#817066', '#007D34', '#F6768E', '#00538A', '#FF7A5C', '#53377A',
    '#FF8E00', '#B32851', '#F4C800', '#7F180D', '#93AA00', '#593315',
    '#F13A13', '#232C16'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function generateRandomString(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
