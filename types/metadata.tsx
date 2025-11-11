interface Metadata {
  name?: string;
  timestamp: string;
  gps: { lat: number; lon: number };
  deviceId?: string;
}