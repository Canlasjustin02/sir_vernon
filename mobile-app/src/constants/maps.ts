const cartoApiKey = process.env.EXPO_PUBLIC_CARTO_API_KEY;

export const MAP_TILE_URL = `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${encodeURIComponent(cartoApiKey ?? '')}`;
export const MAP_TILE_MAX_ZOOM = 19;
