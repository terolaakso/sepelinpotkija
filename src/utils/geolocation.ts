import { LatLon } from './geography';

export async function getCurrentLocation(): Promise<LatLon> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lon: position.coords.longitude });
      },
      (error) => reject(error.message),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
      }
    );
  });
}
