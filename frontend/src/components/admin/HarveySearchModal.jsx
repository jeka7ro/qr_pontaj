import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  MapPin, 
  Building2, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  Globe, 
  Crosshair, 
  RotateCcw,
  Navigation,
  Key
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CITY_COORDS = {
  // România
  'bucurești': { lat: 44.4323, lon: 26.1063 },
  'bucuresti': { lat: 44.4323, lon: 26.1063 },
  'cluj-napoca': { lat: 46.7712, lon: 23.6236 },
  'cluj': { lat: 46.7712, lon: 23.6236 },
  'timișoara': { lat: 45.7537, lon: 21.2257 },
  'timisoara': { lat: 45.7537, lon: 21.2257 },
  'iași': { lat: 47.1585, lon: 27.6014 },
  'iasi': { lat: 47.1585, lon: 27.6014 },
  'brașov': { lat: 45.6579, lon: 25.6012 },
  'brasov': { lat: 45.6579, lon: 25.6012 },
  'constanța': { lat: 44.1807, lon: 28.6343 },
  'constanta': { lat: 44.1807, lon: 28.6343 },
  'craiova': { lat: 44.3302, lon: 23.7949 },
  'oradea': { lat: 47.0722, lon: 21.9211 },
  'sibiu': { lat: 45.7983, lon: 24.1256 },
  'ploiesti': { lat: 44.9400, lon: 26.0240 },
  'ploiești': { lat: 44.9400, lon: 26.0240 },
  'galați': { lat: 45.4353, lon: 28.0080 },
  'galati': { lat: 45.4353, lon: 28.0080 },
  'arad': { lat: 46.1866, lon: 21.3123 },
  'pitesti': { lat: 44.8565, lon: 24.8692 },
  'pitești': { lat: 44.8565, lon: 24.8692 },
  'bacau': { lat: 46.5670, lon: 26.9146 },
  'bacău': { lat: 46.5670, lon: 26.9146 },
  // Belgia
  'bruxelles': { lat: 50.8503, lon: 4.3517 },
  'brussels': { lat: 50.8503, lon: 4.3517 },
  'antwerpen': { lat: 51.2194, lon: 4.4025 },
  'anvers': { lat: 51.2194, lon: 4.4025 },
  'gent': { lat: 51.0543, lon: 3.7174 },
  'gand': { lat: 51.0543, lon: 3.7174 },
  'liege': { lat: 50.6326, lon: 5.5797 },
  'liège': { lat: 50.6326, lon: 5.5797 },
  'charleroi': { lat: 50.4108, lon: 4.4446 },
  'brugge': { lat: 51.2093, lon: 3.2247 },
  'bruges': { lat: 51.2093, lon: 3.2247 },
  'namur': { lat: 50.4674, lon: 4.8719 },
  // Franța
  'paris': { lat: 48.8566, lon: 2.3522 },
  'lyon': { lat: 45.7640, lon: 4.8357 },
  'marseille': { lat: 43.2965, lon: 5.3698 },
  'toulouse': { lat: 43.6047, lon: 1.4442 },
  'nice': { lat: 43.7102, lon: 7.2620 },
  'nantes': { lat: 47.2184, lon: -1.5536 },
  'strasbourg': { lat: 48.5734, lon: 7.7521 },
  'bordeaux': { lat: 44.8378, lon: -0.5792 },
  'lille': { lat: 50.6292, lon: 3.0573 },
  // Germania
  'berlin': { lat: 52.5200, lon: 13.4050 },
  'münchen': { lat: 48.1351, lon: 11.5820 },
  'munchen': { lat: 48.1351, lon: 11.5820 },
  'frankfurt': { lat: 50.1109, lon: 8.6821 },
  'hamburg': { lat: 53.5511, lon: 9.9937 },
  'köln': { lat: 50.9375, lon: 6.9603 },
  'koln': { lat: 50.9375, lon: 6.9603 },
  'stuttgart': { lat: 48.7758, lon: 9.1829 },
  'düsseldorf': { lat: 51.2277, lon: 6.7735 },
  'dusseldorf': { lat: 51.2277, lon: 6.7735 },
  // Olanda
  'amsterdam': { lat: 52.3676, lon: 4.9041 },
  'rotterdam': { lat: 51.9244, lon: 4.4777 },
  'den haag': { lat: 52.0705, lon: 4.3007 },
  'utrecht': { lat: 52.0907, lon: 5.1214 },
  'eindhoven': { lat: 51.4416, lon: 5.4697 },
  // Italia
  'roma': { lat: 41.9028, lon: 12.4964 },
  'milano': { lat: 45.4642, lon: 9.1900 },
  'napoli': { lat: 40.8518, lon: 14.2681 },
  'torino': { lat: 45.0703, lon: 7.6869 },
  'bologna': { lat: 44.4949, lon: 11.3426 },
  'firenze': { lat: 43.7696, lon: 11.2558 },
  // Spania
  'madrid': { lat: 40.4168, lon: -3.7038 },
  'barcelona': { lat: 41.3879, lon: 2.1699 },
  'valencia': { lat: 39.4699, lon: -0.3763 },
  'sevilla': { lat: 37.3891, lon: -5.9845 },
  'málaga': { lat: 36.7213, lon: -4.4214 },
  'malaga': { lat: 36.7213, lon: -4.4214 },
  // Marea Britanie
  'london': { lat: 51.5074, lon: -0.1278 },
  'manchester': { lat: 53.4808, lon: -2.2426 },
  'birmingham': { lat: 52.4862, lon: -1.8904 },
  'leeds': { lat: 53.8008, lon: -1.5491 },
  'glasgow': { lat: 55.8642, lon: -4.2518 },
  // Austria
  'wien': { lat: 48.2082, lon: 16.3738 },
  'viena': { lat: 48.2082, lon: 16.3738 },
  'graz': { lat: 47.0707, lon: 15.4395 },
  'salzburg': { lat: 47.8095, lon: 13.0550 },
  'innsbruck': { lat: 47.2692, lon: 11.4041 }
};

// Steaguri vectoriale SVG compacte, clare, fără caractere emoji
export const FlagRO = () => (
  <svg viewBox="0 0 640 480" className="w-4 h-3 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <g fillRule="evenodd">
      <path fill="#002B7F" d="M0 0h213.3v480H0z" />
      <path fill="#FCD116" d="M213.3 0h213.4v480H213.3z" />
      <path fill="#CE1126" d="M426.7 0H640v480H426.7z" />
    </g>
  </svg>
);

export const FlagBE = () => (
  <svg viewBox="0 0 640 480" className="w-4 h-3 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <g fillRule="evenodd">
      <path fill="#000" d="M0 0h213.3v480H0z" />
      <path fill="#FFD90C" d="M213.3 0h213.4v480H213.3z" />
      <path fill="#F31830" d="M426.7 0H640v480H426.7z" />
    </g>
  </svg>
);

export const FlagFR = () => (
  <svg viewBox="0 0 640 480" className="w-4 h-3 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <g fillRule="evenodd">
      <path fill="#002395" d="M0 0h213.3v480H0z" />
      <path fill="#fff" d="M213.3 0h213.4v480H213.3z" />
      <path fill="#ED2939" d="M426.7 0H640v480H426.7z" />
    </g>
  </svg>
);

export const FlagDE = () => (
  <svg viewBox="0 0 640 480" className="w-4 h-3 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <g fillRule="evenodd">
      <path fill="#000" d="M0 0h640v160H0z" />
      <path fill="#D00" d="M0 160h640v160H0z" />
      <path fill="#FFCE00" d="M0 320h640v160H0z" />
    </g>
  </svg>
);

export const FlagNL = () => (
  <svg viewBox="0 0 640 480" className="w-4 h-3 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <g fillRule="evenodd">
      <path fill="#AE1C28" d="M0 0h640v160H0z" />
      <path fill="#FFF" d="M0 160h640v160H0z" />
      <path fill="#21468B" d="M0 320h640v160H0z" />
    </g>
  </svg>
);

export const FlagIT = () => (
  <svg viewBox="0 0 640 480" className="w-4 h-3 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <g fillRule="evenodd">
      <path fill="#009246" d="M0 0h213.3v480H0z" />
      <path fill="#FFF" d="M213.3 0h213.4v480H213.3z" />
      <path fill="#CE2B37" d="M426.7 0H640v480H426.7z" />
    </g>
  </svg>
);

export const FlagES = () => (
  <svg viewBox="0 0 640 480" className="w-4 h-3 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <g fillRule="evenodd">
      <path fill="#AA151B" d="M0 0h640v120H0zM0 360h640v120H0z" />
      <path fill="#F1BF00" d="M0 120h640v240H0z" />
    </g>
  </svg>
);

export const FlagGB = () => (
  <svg viewBox="0 0 640 480" className="w-4 h-3 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <path fill="#012169" d="M0 0h640v480H0z" />
    <path stroke="#FFF" strokeWidth="60" d="M0 0l640 480M640 0L0 480" />
    <path stroke="#C8102E" strokeWidth="40" d="M0 0l640 480M640 0L0 480" />
    <path stroke="#FFF" strokeWidth="100" d="M320 0v480M0 240h640" />
    <path stroke="#C8102E" strokeWidth="60" d="M320 0v480M0 240h640" />
  </svg>
);

export const FlagAT = () => (
  <svg viewBox="0 0 640 480" className="w-4 h-3 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <g fillRule="evenodd">
      <path fill="#ED2939" d="M0 0h640v160H0zM0 320h640v160H0z" />
      <path fill="#FFF" d="M0 160h640v160H0z" />
    </g>
  </svg>
);

export const COUNTRIES_LIST = [
  { code: 'RO', label: 'România', Flag: FlagRO, defaultCity: 'București' },
  { code: 'BE', label: 'Belgia', Flag: FlagBE, defaultCity: 'Bruxelles' },
  { code: 'FR', label: 'Franța', Flag: FlagFR, defaultCity: 'Paris' },
  { code: 'DE', label: 'Germania', Flag: FlagDE, defaultCity: 'Berlin' },
  { code: 'NL', label: 'Olanda', Flag: FlagNL, defaultCity: 'Amsterdam' },
  { code: 'IT', label: 'Italia', Flag: FlagIT, defaultCity: 'Roma' },
  { code: 'ES', label: 'Spania', Flag: FlagES, defaultCity: 'Madrid' },
  { code: 'GB', label: 'Marea Britanie', Flag: FlagGB, defaultCity: 'London' },
  { code: 'AT', label: 'Austria', Flag: FlagAT, defaultCity: 'Wien' },
  { code: 'CUSTOM', label: 'Altă Țară', Flag: Globe, defaultCity: 'Alt Oraș' }
];

export const COUNTRY_NAMES = {
  RO: 'România',
  BE: 'Belgia',
  FR: 'Franța',
  DE: 'Germania',
  NL: 'Olanda',
  IT: 'Italia',
  ES: 'Spania',
  GB: 'Marea Britanie',
  AT: 'Austria',
  CUSTOM: 'Altă Țară'
};

const COUNTRY_DEFAULT_COORDS = {
  RO: { lat: 44.4323, lon: 26.1063 },
  BE: { lat: 50.8503, lon: 4.3517 },
  FR: { lat: 48.8566, lon: 2.3522 },
  DE: { lat: 52.5200, lon: 13.4050 },
  NL: { lat: 52.3676, lon: 4.9041 },
  IT: { lat: 41.9028, lon: 12.4964 },
  ES: { lat: 40.4168, lon: -3.7038 },
  GB: { lat: 51.5074, lon: -0.1278 },
  AT: { lat: 48.2082, lon: 16.3738 },
  CUSTOM: { lat: 48.8566, lon: 2.3522 }
};

export default function HarveySearchModal({ isOpen, onClose, onSearchComplete }) {
  const [selectedCountry, setSelectedCountry] = useState('RO');
  const [customCountry, setCustomCountry] = useState('');
  const [selectedCities, setSelectedCities] = useState(['București']);
  const [customCity, setCustomCity] = useState('');
  const [selectedNiches, setSelectedNiches] = useState(['Hoteluri & Pensiuni', 'Restaurante']);
  const [customNiche, setCustomNiche] = useState('');
  const [limit, setLimit] = useState(40);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  // Google Places API State
  const [hasGooglePlacesKey, setHasGooglePlacesKey] = useState(false);
  const [googlePlacesApiKey, setGooglePlacesApiKey] = useState('');
  const [showGoogleKeyInput, setShowGoogleKeyInput] = useState(false);
  const [savingGoogleKey, setSavingGoogleKey] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchSettings = async () => {
      try {
        let res;
        try {
          res = await fetch('/api/admin/harvey/settings');
        } catch (e) {
          const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
          res = await fetch(`${baseUrl}/api/admin/harvey/settings`);
        }
        const data = await res.json();
        if (data.success && data.settings) {
          setHasGooglePlacesKey(data.settings.has_google_places_key);
          if (data.settings.google_places_api_key) {
            setGooglePlacesApiKey(data.settings.google_places_api_key);
          }
        }
      } catch (err) {}
    };
    fetchSettings();
  }, [isOpen]);

  const handleSaveGoogleKey = async () => {
    if (!googlePlacesApiKey.trim()) return;
    setSavingGoogleKey(true);
    try {
      let res;
      try {
        res = await fetch('/api/admin/harvey/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ googlePlacesApiKey: googlePlacesApiKey.trim() })
        });
      } catch (e) {
        const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
        res = await fetch(`${baseUrl}/api/admin/harvey/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ googlePlacesApiKey: googlePlacesApiKey.trim() })
        });
      }
      const data = await res.json();
      if (data.success) {
        setHasGooglePlacesKey(true);
        setShowGoogleKeyInput(false);
        setSuccessInfo('Cheia Google Places API a fost salvată! Se vor căuta firme oficiale din Google Maps.');
        setTimeout(() => setSuccessInfo(null), 4000);
      }
    } catch (e) {
      setError('Eroare la salvarea cheii Google: ' + e.message);
    } finally {
      setSavingGoogleKey(false);
    }
  };

  // Map state & toggle
  const [showMap, setShowMap] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapCenter, setMapCenter] = useState({ lat: 44.4323, lon: 26.1063 });
  const [mapBbox, setMapBbox] = useState(null);
  const [isMapMoved, setIsMapMoved] = useState(false);

  const popularNiches = [
    'Cabinete Contabilitate & SAGA',
    'Hoteluri & Pensiuni',
    'Restaurante',
    'Firme Curățenie',
    'Clinici & Cabinete Medicale',
    'Construcții & Instalații',
    'Logistică & Depozite',
    'Saloane Înfrumusețare',
    'Brutării & Panificație',
    'Magazine & Retail',
    'Altă Nișă'
  ];

  const citiesByCountry = {
    RO: [
      'București',
      'Cluj-Napoca',
      'Timișoara',
      'Iași',
      'Brașov',
      'Constanța',
      'Craiova',
      'Oradea',
      'Sibiu',
      'Ploiești',
      'Alt Oraș'
    ],
    BE: [
      'Bruxelles',
      'Anvers / Antwerpen',
      'Gent / Gand',
      'Liège / Luik',
      'Charleroi',
      'Brugge',
      'Namur',
      'Alt Oraș'
    ],
    FR: [
      'Paris',
      'Lyon',
      'Marseille',
      'Toulouse',
      'Nice',
      'Nantes',
      'Strasbourg',
      'Bordeaux',
      'Lille',
      'Alt Oraș'
    ],
    DE: [
      'Berlin',
      'München',
      'Frankfurt',
      'Hamburg',
      'Köln',
      'Stuttgart',
      'Düsseldorf',
      'Alt Oraș'
    ],
    NL: [
      'Amsterdam',
      'Rotterdam',
      'Den Haag',
      'Utrecht',
      'Eindhoven',
      'Alt Oraș'
    ],
    IT: [
      'Roma',
      'Milano',
      'Napoli',
      'Torino',
      'Bologna',
      'Firenze',
      'Alt Oraș'
    ],
    ES: [
      'Madrid',
      'Barcelona',
      'Valencia',
      'Sevilla',
      'Málaga',
      'Alt Oraș'
    ],
    GB: [
      'London',
      'Manchester',
      'Birmingham',
      'Leeds',
      'Glasgow',
      'Alt Oraș'
    ],
    AT: [
      'Wien',
      'Graz',
      'Salzburg',
      'Innsbruck',
      'Alt Oraș'
    ],
    CUSTOM: [
      'Alt Oraș'
    ]
  };

  const handleCountryChange = (c) => {
    setSelectedCountry(c);
    const countryObj = COUNTRIES_LIST.find((item) => item.code === c);
    const defaultCity = countryObj ? countryObj.defaultCity : 'Alt Oraș';
    setSelectedCities([defaultCity]);
    setCustomCity('');
    setIsMapMoved(false);
  };

  const toggleCity = (city) => {
    setSelectedCities((prev) => {
      if (prev.includes(city)) {
        if (prev.length === 1 && !customCity.trim()) return prev;
        return prev.filter((c) => c !== city);
      } else {
        return [...prev, city];
      }
    });

    const cityKey = city.toLowerCase();
    const coords = CITY_COORDS[cityKey];
    if (coords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([coords.lat, coords.lon], 13, { duration: 0.8 });
      setMapCenter(coords);
      setIsMapMoved(false);
    }
  };

  const selectAllCities = () => {
    const all = currentCitiesList.filter((c) => c !== 'Alt Oraș');
    if (selectedCities.length >= all.length) {
      const countryObj = COUNTRIES_LIST.find((item) => item.code === selectedCountry);
      setSelectedCities([countryObj ? countryObj.defaultCity : currentCitiesList[0]]);
    } else {
      setSelectedCities(all);
    }
  };

  // Inițializare și sincronizare hartă Leaflet (doar dacă showMap este activ)
  useEffect(() => {
    if (!isOpen || !showMap) return;

    const primaryCity = selectedCities[0] || 'București';
    const cityKey = (primaryCity === 'Alt Oraș' && customCity.trim() ? customCity.trim().split(',')[0].trim() : primaryCity).toLowerCase();
    const fallbackCoords = COUNTRY_DEFAULT_COORDS[selectedCountry] || COUNTRY_DEFAULT_COORDS.RO;
    const coords = CITY_COORDS[cityKey] || fallbackCoords;
    const targetLat = coords ? coords.lat : fallbackCoords.lat;
    const targetLon = coords ? coords.lon : fallbackCoords.lon;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [targetLat, targetLon],
          zoom: 13,
          zoomControl: false,
        });

        // OpenStreetMap standard tiles (complet gratuit, rapid, fără watermark sau API key)
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
          maxZoom: 19
        }).addTo(map);

        L.control.zoom({ position: 'topright' }).addTo(map);

        map.on('move', () => {
          setIsMapMoved(true);
          const c = map.getCenter();
          setMapCenter({ lat: c.lat, lon: c.lng });
        });

        map.on('moveend', () => {
          const c = map.getCenter();
          const b = map.getBounds();
          setMapCenter({ lat: c.lat, lon: c.lng });
          setMapBbox([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
          setIsMapMoved(true);
        });

        mapInstanceRef.current = map;
        setMapCenter({ lat: targetLat, lon: targetLon });
      } else {
        mapInstanceRef.current.invalidateSize();
        mapInstanceRef.current.flyTo([targetLat, targetLon], 13, { duration: 0.8 });
        setMapCenter({ lat: targetLat, lon: targetLon });
        setIsMapMoved(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, showMap, selectedCountry]);

  // Curățare instanță Leaflet când se ascunde harta
  useEffect(() => {
    if (!showMap && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  }, [showMap]);

  // Curățare instanță Leaflet la închidere
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleRecenter = () => {
    const primaryCity = selectedCities[0] || 'București';
    const cityKey = (primaryCity === 'Alt Oraș' && customCity.trim() ? customCity.trim().split(',')[0].trim() : primaryCity).toLowerCase();
    const fallbackCoords = COUNTRY_DEFAULT_COORDS[selectedCountry] || COUNTRY_DEFAULT_COORDS.RO;
    const coords = CITY_COORDS[cityKey] || fallbackCoords;
    if (coords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([coords.lat, coords.lon], 13, { duration: 0.8 });
      setMapCenter(coords);
      setIsMapMoved(false);
    }
  };

  const toggleNiche = (item) => {
    setSelectedNiches((prev) => {
      if (prev.includes(item)) {
        if (prev.length === 1 && !customNiche) return prev;
        return prev.filter((n) => n !== item);
      } else {
        return [...prev, item];
      }
    });
  };

  const selectAllNiches = () => {
    const all = popularNiches.filter((n) => n !== 'Altă Nișă');
    if (selectedNiches.length >= all.length) {
      setSelectedNiches(['Hoteluri & Pensiuni', 'Restaurante']);
    } else {
      setSelectedNiches(all);
    }
  };

  const currentCitiesList = citiesByCountry[selectedCountry] || citiesByCountry.RO;

  const executeSearch = async (coordsOverride = null, bboxOverride = null) => {
    setLoading(true);
    setError(null);
    setSuccessInfo(null);

    let finalNiches = selectedNiches.filter((n) => n !== 'Altă Nișă');
    if (selectedNiches.includes('Altă Nișă') && customNiche.trim()) {
      finalNiches.push(customNiche.trim());
    }

    let finalCities = selectedCities.filter((c) => c !== 'Alt Oraș');
    if (selectedCities.includes('Alt Oraș')) {
      if (!customCity.trim() && finalCities.length === 0) {
        setError('Specificați numele orașului dorit.');
        setLoading(false);
        return;
      }
      if (customCity.trim()) {
        const extras = customCity.split(',').map((c) => c.trim()).filter(Boolean);
        finalCities = [...finalCities, ...extras];
      }
    }

    if (finalCities.length === 0) {
      setError('Selectați cel puțin un oraș.');
      setLoading(false);
      return;
    }

    if (finalNiches.length === 0) {
      setError('Selectați cel puțin o nișă sau industrie.');
      setLoading(false);
      return;
    }

    const effectiveCoords = coordsOverride || mapCenter;
    const effectiveBbox = bboxOverride || mapBbox;

    const finalCountry = selectedCountry === 'CUSTOM' ? (customCountry.trim() || 'GLOBAL') : selectedCountry;
    if (selectedCountry === 'CUSTOM' && !customCountry.trim()) {
      setError('Specificați numele țării dorite (ex: Elveția, SUA, Polonia etc.).');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        niches: finalNiches,
        city: finalCities[0] || 'București',
        cities: finalCities,
        country: finalCountry,
        limit: Number(limit),
        mapCenter: effectiveCoords,
        bbox: effectiveBbox,
        googlePlacesApiKey: googlePlacesApiKey || undefined
      };

      let res;
      try {
        res = await fetch('/api/admin/harvey/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (proxyErr) {
        const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
        res = await fetch(`${baseUrl}/api/admin/harvey/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      let data = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        // Răspuns non-JSON sau corupt
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || `Eroare server (${res.status}): Căutarea nu a putut fi finalizată.`);
      }

      if (onSearchComplete) {
        onSearchComplete(data.leads, data.message, finalCountry, finalCities, finalNiches);
      }
      onClose();
    } catch (err) {
      if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
        setError('Eroare de conexiune: Serverul backend (port 5001) nu răspunde. Asigurați-vă că este pornit.');
      } else {
        setError(err.message || 'A apărut o eroare la scanare.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeSearch();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Compact */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight truncate">
                  Căutare Companii Reale pe Hartă
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                  hasGooglePlacesKey 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}>
                  {hasGooglePlacesKey ? 'Google Places Activ' : 'OpenStreetMap'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowGoogleKeyInput(prev => !prev)}
                  className="text-[11px] font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                  title="Configurează cheia Google Places API"
                >
                  <Key size={11} />
                  <span>{hasGooglePlacesKey ? 'Cheie API' : '+ Cheie Google'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Alege țara, orașele și nișa pentru a extrage lead-uri
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer ml-2"
          >
            <X size={16} />
          </button>
        </div>

        {/* Bară compactă configurare cheie Google Places (doar la click) */}
        {showGoogleKeyInput && (
          <div className="px-5 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 animate-fade-in text-xs">
            <input
              type="password"
              value={googlePlacesApiKey}
              onChange={(e) => setGooglePlacesApiKey(e.target.value)}
              placeholder="Lipește cheia Google Places API (ex: AIzaSy...)"
              className="flex-1 px-3 h-8 text-xs rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none"
            />
            <button
              type="button"
              onClick={handleSaveGoogleKey}
              disabled={savingGoogleKey || !googlePlacesApiKey.trim()}
              className="px-3 h-8 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              {savingGoogleKey ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              <span>Salvează</span>
            </button>
            <button
              type="button"
              onClick={() => setShowGoogleKeyInput(false)}
              className="px-2.5 h-8 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Închide
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-2.5 text-xs font-semibold text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successInfo && (
            <div className="flex items-center gap-2 p-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* 1. SELECȚIE ȚARĂ (PASUL 1) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Globe size={13} className="text-primary-600" />
                1. Selectează Țara Țintă
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                Alege țara sau introdu manual
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COUNTRIES_LIST.map((c) => {
                const isSelected = selectedCountry === c.code;
                const FlagComponent = c.Flag;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountryChange(c.code)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 shadow-xs ring-1 ring-slate-800'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <FlagComponent />
                    <span>{c.label}</span>
                    {isSelected && <Check size={12} className="shrink-0" />}
                  </button>
                );
              })}
            </div>

            {selectedCountry === 'CUSTOM' && (
              <div className="mt-3 animate-fade-in">
                <input
                  type="text"
                  value={customCountry}
                  onChange={(e) => setCustomCountry(e.target.value)}
                  placeholder="Scrie numele oricărei țări (ex: Elveția, SUA, Polonia, Portugalia, Suedia, Grecia etc.)..."
                  className="w-full px-4 h-10 text-xs font-semibold rounded-full border border-primary-500 dark:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-hidden shadow-xs"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* 2. SELECȚIE ORAȘE & HARTĂ INTERACTIVĂ (PASUL 2) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <MapPin size={14} className="text-primary-600 shrink-0" />
                <span>2. Alege Orașele din {COUNTRY_NAMES[selectedCountry] || customCountry || 'Țara Selectată'} ({selectedCities.length} selectate)</span>
              </label>
              <button
                type="button"
                onClick={selectAllCities}
                className="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer whitespace-nowrap shrink-0"
              >
                {selectedCities.length >= currentCitiesList.filter((c) => c !== 'Alt Oraș').length ? 'Resetează' : 'Selectează Toate'}
              </button>
            </div>

            {/* Pastile selecție orașe (multi-select) */}
            <div className="flex flex-wrap gap-1.5">
              {currentCitiesList.map((item) => {
                const isSelected = selectedCities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleCity(item)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? 'border-primary-600 bg-primary-600 text-white font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{item}</span>
                    {isSelected && <Check size={12} className="shrink-0" />}
                  </button>
                );
              })}
            </div>

            {selectedCities.includes('Alt Oraș') && (
              <input
                type="text"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                placeholder="Specifică alte orașe separate prin virgulă (ex: Suceava, Galați, Brăila, Leuven etc.)..."
                className="w-full px-4 h-9 text-xs rounded-full border border-primary-500 dark:border-primary-500 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-hidden transition-all shadow-xs"
                autoFocus
              />
            )}

            {/* Toggle Opțional pentru Hartă */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                  showMap ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  <MapPin size={12} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white block leading-tight">
                    Căutare pe Hartă («Caută în această zonă»)
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                    {showMap ? 'Harta este activă — poți trage și scana cartiere specifice' : 'Opțional — explorează vizual pe hartă'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextState = !showMap;
                  setShowMap(nextState);
                  if (nextState) {
                    setTimeout(() => {
                      mapInstanceRef.current?.invalidateSize();
                    }, 200);
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                  showMap
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{showMap ? 'Ascunde Harta' : 'Deschide Harta'}</span>
              </button>
            </div>

            {/* HARTĂ INTERACTIVĂ STIL GOOGLE MAPS (DOAR DACĂ showMap ESTE ACTIV) */}
            {showMap && (
              <div className="space-y-2 animate-fade-in">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-800">
                  {/* Map Canvas */}
                  <div 
                    ref={mapContainerRef} 
                    className="w-full h-56 z-0 cursor-grab active:cursor-grabbing" 
                  />

                  {/* Pin central fix de reper */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[400] flex flex-col items-center">
                    <div className="relative flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-primary-500/25 animate-ping absolute" />
                      <div className="w-8 h-8 rounded-full bg-primary-600 text-white shadow-xl flex items-center justify-center border-2 border-white">
                        <MapPin size={18} className="fill-white" />
                      </div>
                    </div>
                    <div className="w-3 h-1 bg-black/40 rounded-full blur-[1px] mt-0.5" />
                  </div>

                  {/* BUTON GOOGLE MAPS: «CAUTĂ ÎN ACEASTĂ ZONĂ» */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[450]">
                    <button
                      type="button"
                      onClick={() => executeSearch()}
                      disabled={loading}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-xl border flex items-center gap-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                        isMapMoved
                          ? 'bg-primary-600 hover:bg-primary-700 text-white border-primary-500 ring-2 ring-primary-500/30 animate-pulse'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                      title="Execută căutarea la coordonatele vizualizate pe hartă"
                    >
                      <Search size={13} className={isMapMoved ? 'text-white shrink-0' : 'text-primary-600 shrink-0'} />
                      <span>Caută în această zonă</span>
                      {isMapMoved && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-ping" />
                      )}
                    </button>
                  </div>

                  {/* Indicator coordonate stânga-jos */}
                  <div className="absolute bottom-2 left-2 z-[450] flex items-center gap-1.5 pointer-events-none">
                    <div className="px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1.5 shadow-md">
                      <Navigation size={10} className="text-primary-400 shrink-0" />
                      <span className="whitespace-nowrap shrink-0">
                        {selectedCities.length === 1 ? selectedCities[0] : `${selectedCities.length} orașe`}: {mapCenter.lat.toFixed(4)}, {mapCenter.lon.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {/* Buton Recentrează dreapta-jos */}
                  <div className="absolute bottom-2 right-2 z-[450]">
                    <button
                      type="button"
                      onClick={handleRecenter}
                      className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold shadow-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0"
                      title="Recentrează pe centrul orașului"
                    >
                      <Crosshair size={11} className="text-primary-600 shrink-0" />
                      <span>Centru Oraș</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. NIȘE / INDUSTRII (PASUL 3) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Building2 size={13} className="text-primary-600" />
                3. Nișă sau Industrie ({selectedNiches.length} selectate)
              </label>
              <button
                type="button"
                onClick={selectAllNiches}
                className="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer whitespace-nowrap shrink-0"
              >
                {selectedNiches.length >= popularNiches.length - 1 ? 'Resetează' : 'Selectează Toate'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-1.5">
              {popularNiches.map((item) => {
                const isSelected = selectedNiches.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleNiche(item)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center justify-between whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? 'border-primary-600 bg-primary-600 text-white font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{item}</span>
                    {isSelected && <Check size={13} className="shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>

            {selectedNiches.includes('Altă Nișă') && (
              <input
                type="text"
                value={customNiche}
                onChange={(e) => setCustomNiche(e.target.value)}
                placeholder="Specifică altă nișă (ex: Farmacii, Service Auto, Depozite)..."
                className="w-full px-4 h-9 text-xs rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none transition-all shadow-xs"
              />
            )}
          </div>

          {/* 4. NUMĂR TOTAL DE REZULTATE (10 - 200) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                4. Număr Companii de Identificat (Rezultate)
              </label>
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                {limit} companii țintă
              </span>
            </div>

            <div className="flex items-center gap-1.5 mb-1.5 overflow-x-auto pb-0.5">
              {[20, 40, 60, 80, 100, 150, 200].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLimit(preset)}
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    limit === preset
                      ? 'border-primary-600 bg-primary-600 text-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full accent-primary-600 cursor-pointer"
            />
          </div>

          {/* Compact Info Line */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 py-1">
            <Building2 size={13} className="text-primary-600 shrink-0" />
            <span className="truncate">Scanare în {selectedCities.length === 1 ? selectedCities[0] : `${selectedCities.length} orașe`} • Se extrag doar companii reale cu contact verificat.</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin shrink-0" />
                  <span>Se scanează companiile din zonă...</span>
                </>
              ) : (
                <>
                  <Search size={16} className="shrink-0" />
                  <span>Pornește Căutarea ({limit} companii din {selectedCities.length === 1 ? (selectedCities[0] === 'Alt Oraș' ? (customCity || 'Oraș') : selectedCities[0]) : `${selectedCities.length} orașe`})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
