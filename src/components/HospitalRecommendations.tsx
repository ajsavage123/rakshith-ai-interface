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
    <div className="w-full space-y-4 p-1">
      {specialty && <div className="text-xs text-primary/90 bg-primary/12 border border-primary/20 px-3 py-2.5 rounded-lg flex items-center gap-2 font-medium"><AlertCircle className="w-4 h-4 flex-shrink-0" /><span>Hospitals for: <strong>{specialty}</strong></span></div>}
      {currentLocation && <div className="text-xs text-success/90 bg-success/12 border border-success/20 px-3 py-2.5 rounded-lg flex items-center gap-2 font-medium"><MapPin className="w-4 h-4 flex-shrink-0" /><span>{locationName ? `Located near: ${locationName}` : `Lat: ${currentLocation.lat.toFixed(4)}, Lng: ${currentLocation.lng.toFixed(4)}`}</span></div>}
      <div className="flex gap-2.5">
        <input type="text" value={manualLocation} onChange={e => setManualLocation(e.target.value)} placeholder="Enter address or coordinates" className="flex-1 rounded-lg border border-white/8 px-4 py-2.5 text-xs bg-white/5 text-foreground placeholder-muted-foreground/60 focus:border-primary/30 focus:outline-none transition-all" />
        <Button size="sm" onClick={handleManualSearch} disabled={searching || !manualLocation.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium press-scale transition-all"><Search className="w-3 h-3 mr-1" />Search</Button>
      </div>
      <div className="space-y-3">
        {sortedHospitals.length === 0 ? (
          <div className="text-center text-muted-foreground/70 py-8"><div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3"><MapPin className="w-5 h-5 text-muted-foreground/40" /></div><p className="text-sm">No hospitals found for this specialty</p></div>
        ) : sortedHospitals.map((hospital, index) => (
          <div key={`${hospital.name}-${index}`} className="glass-card p-5 space-y-3 border border-white/8 transition-all hover:shadow-lg hover:shadow-black/10">
            <div>
              <h4 className="font-semibold text-foreground text-sm leading-tight">{hospital.name}</h4>
              <p className="text-xs text-muted-foreground/70 mt-1">{hospital.address}</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground/80 pt-2 border-t border-white/8">
              {hospital.rating > 0 && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400" />{hospital.rating}</span>}
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary" />{hospital.distance}</span>
            </div>
            <div className="flex flex-col gap-2.5 pt-1">
              <Button size="sm" onClick={() => { if (hospital.phone && hospital.phone !== 'Phone not available') window.location.href = `tel:${hospital.phone}`; }}
                disabled={!hospital.phone || hospital.phone === 'Phone not available'} className="w-full bg-gradient-to-r from-success/20 to-success/10 border border-success/25 text-success hover:from-success/30 hover:to-success/15 rounded-lg text-xs font-medium press-scale transition-all">
                <Phone className="w-3 h-3 mr-1.5" />{hospital.phone && hospital.phone !== 'Phone not available' ? 'Call Hospital' : 'Phone Not Available'}
              </Button>
              <Button size="sm" onClick={() => { const query = encodeURIComponent(`${hospital.name} ${hospital.address}`); window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank'); }}
                className="w-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/25 text-primary hover:from-primary/30 hover:to-primary/15 rounded-lg text-xs font-medium press-scale transition-all">
                <Navigation className="w-3 h-3 mr-1.5" />View on Map
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HospitalRecommendations;
