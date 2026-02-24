import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Clock, Star, Navigation, AlertCircle, Share2, Search } from "lucide-react";
import { geoapifyService, Location, Hospital } from "@/lib/geoapify";

interface HospitalRecommendationsProps { specialty: string; userLocation?: Location; summary?: string; }

const HospitalRecommendations = ({ specialty, userLocation, summary }: HospitalRecommendationsProps) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState("");
  const [searching, setSearching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>("Detecting your location...");
  const [locationName, setLocationName] = useState<string>("");

  useEffect(() => {
    if (navigator.geolocation) {
      setLocationStatus("Getting your current location...");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setError(null);
          const userLoc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setCurrentLocation(userLoc);
          try { const name = await geoapifyService.getLocationName(userLoc); setLocationName(name); setLocationStatus(`Found: ${name}`); } catch { setLocationStatus(`Found: ${userLoc.lat.toFixed(4)}, ${userLoc.lng.toFixed(4)}`); }
          fetchHospitals(userLoc);
        },
        (err) => { setError("Location access denied. Enter your location manually."); setLoading(false); },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
      );
    } else { setError("Geolocation not supported."); setLoading(false); }
  }, [specialty]);

  const fetchHospitals = async (location: Location) => {
    try { setLoading(true); setError(null); const data = await geoapifyService.searchHospitals(location, specialty); setHospitals(data); } catch { setError('Failed to fetch hospital data.'); } finally { setLoading(false); }
  };

  const handleManualSearch = async () => {
    setSearching(true); setError(null);
    try {
      let location: Location;
      if (/^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(manualLocation.trim())) { const [lat, lng] = manualLocation.split(",").map(Number); location = { lat, lng }; }
      else { const result = await geoapifyService.geocodeAddress(manualLocation); if (!result) throw new Error("Not found"); location = { lat: result.lat, lng: result.lon }; }
      setCurrentLocation(location);
      try { const name = await geoapifyService.getLocationName(location); setLocationName(name); } catch {}
      fetchHospitals(location);
    } catch { setError("Could not find location."); } finally { setSearching(false); }
  };

  const sortedHospitals = [...hospitals].sort((a, b) => {
    const parse = (d?: string) => { if (!d) return Infinity; if (d.endsWith('km')) return parseFloat(d) * 1000; return parseFloat(d); };
    return parse(a.distance) - parse(b.distance);
  });

  if (loading) return (<div className="p-4 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div><p className="mt-2 text-muted-foreground text-sm">{locationStatus}</p></div>);

  if (error) return (
    <div className="p-3 text-center">
      <div className="flex items-center justify-center gap-2 text-destructive text-xs mb-2"><AlertCircle className="w-4 h-4" /><span>{error}</span></div>
      <Button size="sm" className="bg-primary text-primary-foreground press-scale rounded-xl text-xs" onClick={() => { setError(null); setLoading(true); if (navigator.geolocation) navigator.geolocation.getCurrentPosition(async pos => { const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setCurrentLocation(loc); fetchHospitals(loc); }, () => { setError("Still denied."); setLoading(false); }); }}>
        <MapPin className="w-3 h-3 mr-1" /> Retry Location
      </Button>
    </div>
  );

  return (
    <div className="w-full space-y-3 p-2">
      {specialty && <div className="text-xs text-primary bg-primary/10 p-2 rounded-xl flex items-center gap-1"><AlertCircle className="w-3 h-3" /><span>Showing hospitals for: <strong>{specialty}</strong></span></div>}
      {currentLocation && <div className="text-xs text-success bg-success/10 p-2 rounded-xl flex items-center gap-1"><MapPin className="w-3 h-3" /><span>{locationName ? `Near: ${locationName}` : `Near: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`}</span></div>}
      <div className="flex gap-2">
        <input type="text" value={manualLocation} onChange={e => setManualLocation(e.target.value)} placeholder="Enter address or lat,lng" className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-xs bg-secondary/50 text-foreground" />
        <Button size="sm" onClick={handleManualSearch} disabled={searching || !manualLocation.trim()} className="bg-primary text-primary-foreground rounded-xl text-xs press-scale"><Search className="w-3 h-3 mr-1" />Search</Button>
      </div>
      <div className="space-y-3">
        {sortedHospitals.length === 0 ? (
          <div className="text-center text-muted-foreground py-6"><MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" /><p className="text-sm">No hospitals found</p></div>
        ) : sortedHospitals.map((hospital, index) => (
          <div key={`${hospital.name}-${index}`} className="glass-card p-4 space-y-2">
            <h4 className="font-semibold text-foreground text-sm">{hospital.name}</h4>
            <p className="text-xs text-muted-foreground">{hospital.address}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {hospital.rating > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{hospital.rating}</span>}
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" />{hospital.distance}</span>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => { if (hospital.phone && hospital.phone !== 'Phone not available') window.location.href = `tel:${hospital.phone}`; }}
                disabled={!hospital.phone || hospital.phone === 'Phone not available'} className="w-full border-success/30 text-success hover:bg-success/10 rounded-xl text-xs press-scale">
                <Phone className="w-3 h-3 mr-1" />{hospital.phone && hospital.phone !== 'Phone not available' ? 'Call' : 'Not Available'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { const query = encodeURIComponent(`${hospital.name} ${hospital.address}`); window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank'); }}
                className="w-full border-primary/30 text-primary hover:bg-primary/10 rounded-xl text-xs press-scale">
                <MapPin className="w-3 h-3 mr-1" />View on Map
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HospitalRecommendations;
