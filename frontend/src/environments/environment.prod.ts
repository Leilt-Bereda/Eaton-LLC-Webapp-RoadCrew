import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  apiBaseUrl: 'http://localhost:8000/api/',
  googleMapsKey: 'AIzaSyCjX2LDRK8NC3z2MI9R8VGg4MIOIzmvDNQ'

};
