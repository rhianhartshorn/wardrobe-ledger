import { NextRequest, NextResponse } from 'next/server';

// WMO weather interpretation codes
const WMO: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy rain showers',
  85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with hail',
};

function dressingNote(tempF: number, condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes('rain') || c.includes('storm') || c.includes('drizzle')) {
    return `Bring a waterproof layer — it's ${Math.round(tempF)}°F and wet out.`;
  }
  if (c.includes('snow')) return `Layer up and stay dry — snowing at ${Math.round(tempF)}°F.`;
  if (tempF < 32) return `Dress warmly — it's freezing at ${Math.round(tempF)}°F.`;
  if (tempF < 50) return `A heavy jacket recommended at ${Math.round(tempF)}°F.`;
  if (tempF < 62) return `A light-to-medium jacket works at ${Math.round(tempF)}°F.`;
  if (tempF < 75) return `Comfortable at ${Math.round(tempF)}°F — dress freely.`;
  if (tempF < 85) return `Warm at ${Math.round(tempF)}°F — lighter fabrics welcome.`;
  return `Hot at ${Math.round(tempF)}°F — dress as lightly as the occasion allows.`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const city = searchParams.get('city');

  try {
    let latitude: number;
    let longitude: number;
    let locationName: string;

    if (lat && lon) {
      latitude = parseFloat(lat);
      longitude = parseFloat(lon);
      locationName = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;

      // Reverse-geocode via Nominatim (OpenStreetMap, free, no key)
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          { headers: { 'User-Agent': 'WardrobeLedger/1.0' } }
        );
        const geoData = await geoRes.json() as { address?: Record<string, string> };
        const addr = geoData.address ?? {};
        const city = addr.city ?? addr.town ?? addr.village ?? '';
        const region = addr.state ?? addr.country ?? '';
        if (city || region) locationName = [city, region].filter(Boolean).join(', ');
      } catch {
        // leave coords as location name
      }
    } else if (city) {
      // Forward-geocode via Open-Meteo geocoding API (free, no key)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`
      );
      const geoData = await geoRes.json() as { results?: Array<{ latitude: number; longitude: number; name: string; admin1?: string; country?: string }> };
      const result = geoData.results?.[0];
      if (!result) {
        return NextResponse.json({ error: `City not found: ${city}` }, { status: 404 });
      }
      latitude = result.latitude;
      longitude = result.longitude;
      locationName = [result.name, result.admin1, result.country].filter(Boolean).join(', ');
    } else {
      return NextResponse.json({ error: 'Provide lat/lon or city' }, { status: 400 });
    }

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode,windspeed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`
    );
    const weatherData = await weatherRes.json() as {
      current: { temperature_2m: number; weathercode: number; windspeed_10m: number };
    };

    const { temperature_2m: tempF, weathercode, windspeed_10m: windMph } = weatherData.current;
    const condition = WMO[weathercode] ?? 'Mixed conditions';

    return NextResponse.json({
      locationName,
      tempF,
      condition,
      windMph,
      summary: dressingNote(tempF, condition),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Weather fetch failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
