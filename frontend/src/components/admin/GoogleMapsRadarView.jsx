import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MapPin, 
  Compass, 
  Search, 
  Sparkles, 
  Phone, 
  Mail, 
  MessageCircle, 
  ExternalLink, 
  Star, 
  Building2, 
  RefreshCw, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Crosshair, 
  Filter, 
  Globe, 
  Tag, 
  X, 
  Navigation,
  Send,
  RotateCcw,
  Eye,
  Check,
  ChevronDown,
  Table as TableIcon,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Trash2,
  Pencil,
  CheckSquare,
  Square,
  ChevronUp,
  ArrowUpDown
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as XLSX from 'xlsx';
import { getApiUrl, getAuthHeaders } from '../../utils/apiUrl';
import HarveyReviewEmailModal from './HarveyReviewEmailModal';

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
  // Franța
  'paris': { lat: 48.8566, lon: 2.3522 },
  'lyon': { lat: 45.7640, lon: 4.8357 },
  'marseille': { lat: 43.2965, lon: 5.3698 },
  // Germania
  'berlin': { lat: 52.5200, lon: 13.4050 },
  'münchen': { lat: 48.1351, lon: 11.5820 },
  'frankfurt': { lat: 50.1109, lon: 8.6821 },
  // Olanda
  'amsterdam': { lat: 52.3676, lon: 4.9041 },
  'rotterdam': { lat: 51.9244, lon: 4.4777 },
  // Italia
  'roma': { lat: 41.9028, lon: 12.4964 },
  'milano': { lat: 45.4642, lon: 9.1900 },
  // Spania
  'madrid': { lat: 40.4168, lon: -3.7038 },
  'barcelona': { lat: 41.3879, lon: 2.1699 },
  // UK
  'london': { lat: 51.5074, lon: -0.1278 }
};

const COUNTRY_COORDS = {
  RO: { lat: 45.9432, lon: 24.9668 },
  BE: { lat: 50.5039, lon: 4.4699 },
  FR: { lat: 46.2276, lon: 2.2137 },
  DE: { lat: 51.1657, lon: 10.4515 },
  NL: { lat: 52.1326, lon: 5.2913 },
  IT: { lat: 41.8719, lon: 12.5674 },
  ES: { lat: 40.4637, lon: -3.7492 },
  GB: { lat: 55.3781, lon: -3.4360 },
  AT: { lat: 47.5162, lon: 14.5501 }
};

const POPULAR_NICHES = [
  'Toate Nișele',
  'Hoteluri & Pensiuni',
  'Restaurante & Baruri',
  'Construcții & Instalații',
  'Clinici & Cabinete Medicale',
  'Depozite & Logistică',
  'Transport & Distribuție',
  'Fabrici & Producție',
  'Saloane & Frizerii',
  'Service Auto & Piese'
];

const CITIES_BY_COUNTRY = {
  RO: ['Toate Orașele', 'București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Brașov', 'Constanța', 'Craiova', 'Oradea', 'Sibiu', 'Ploiești', 'Arad', 'Galați'],
  BE: ['Toate Orașele', 'Bruxelles', 'Antwerpen', 'Gent', 'Liège'],
  FR: ['Toate Orașele', 'Paris', 'Lyon', 'Marseille'],
  DE: ['Toate Orașele', 'Berlin', 'München', 'Frankfurt'],
  NL: ['Toate Orașele', 'Amsterdam', 'Rotterdam'],
  IT: ['Toate Orașele', 'Roma', 'Milano'],
  ES: ['Toate Orașele', 'Madrid', 'Barcelona'],
  GB: ['Toate Orașele', 'London']
};

export default function GoogleMapsRadarView({ onConvertToTenant }) {
  const [country, setCountry] = useState('RO');
  const [city, setCity] = useState('Toate Orașele');
  const [niche, setNiche] = useState('Hoteluri & Pensiuni');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'whatsapp' | 'email' | 'rated'
  const [showMap, setShowMap] = useState(true); // Harta afișată permanent deasupra tabelului
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanningMap, setScanningMap] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [hasGooglePlacesKey, setHasGooglePlacesKey] = useState(true);

  // Selecție Multiplă Checkbox pentru Acțiuni Bulk
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Modale: Editare & Ștergere
  const [editingLead, setEditingLead] = useState(null);
  const [editFormData, setEditFormData] = useState({
    companyName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    cui: '',
    notes: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteConfirmState, setDeleteConfirmState] = useState(null); // { type: 'single' | 'bulk', id?: number, ids?: number[] }
  const [selectedLeadForEmailReview, setSelectedLeadForEmailReview] = useState(null); // Modal Extins de Revizuire/Editare Email Harvey (Human-in-the-Loop)
  const [leadToSendConfirm, setLeadToSendConfirm] = useState(null); // Modal In-App Rapid de Confirmare Trimitere / Retrimitere Email
  const [isSendingConfirm, setIsSendingConfirm] = useState(false);
  const [showEmailPreviewInConfirm, setShowEmailPreviewInConfirm] = useState(false);

  // Paginare Tabel
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const radarCircleRef = useRef(null);
  const userMarkerRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Verificare status cheie Google Places
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const baseUrl = getApiUrl();
        const res = await fetch(`${baseUrl}/api/admin/harvey/settings`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.settings) {
            setHasGooglePlacesKey(Boolean(data.settings.has_google_places_key));
          }
        }
      } catch (e) {}
    };
    fetchSettings();
  }, []);

  // Încărcare lead-uri inițiale din baza de date
  const loadExistingLeads = async (customCity = null, customCountry = null) => {
    setLoading(true);
    try {
      const targetCountry = customCountry || country;
      const targetCity = customCity !== null ? customCity : city;
      const baseUrl = getApiUrl();
      let url = `${baseUrl}/api/admin/harvey/leads?country=${targetCountry}`;
      if (targetCity && targetCity !== 'Toate Orașele' && targetCity !== 'all') {
        url += `&city=${encodeURIComponent(targetCity)}`;
      }
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.leads) {
          setLeads(data.leads);
          setSelectedLeadIds(new Set());
        }
      }
    } catch (e) {
      console.warn('Eroare fetch leads radar:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExistingLeads();
  }, [country, city]);

  // Aplicare coordonate și pin pe hartă
  const applyDetectedCoords = (lat, lon, label = 'Locația Ta', autoScan = false) => {
    setUserLocation({ lat, lon });

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.flyTo([lat, lon], 14, { duration: 1.2 });
      } catch (_) {}
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const userPinHtml = `
      <div style="position: relative; width: 28px; height: 28px;">
        <div style="position: absolute; inset: -6px; border-radius: 9999px; background: rgba(37, 99, 235, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; inset: 0; border-radius: 9999px; background: #2563eb; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="7"></circle>
          </svg>
        </div>
      </div>
    `;
    const userPin = L.divIcon({
      className: 'user-pulse-pin',
      html: userPinHtml,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    if (mapInstanceRef.current) {
      userMarkerRef.current = L.marker([lat, lon], { icon: userPin }).addTo(mapInstanceRef.current);
      userMarkerRef.current.bindPopup(
        `<div style="display:flex;align-items:center;gap:6px;font-family:system-ui,sans-serif;font-weight:800;font-size:12px;color:#1e40af;padding:2px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><span>${label}</span></div>`
      ).openPopup();
    }

    if (radarCircleRef.current) {
      radarCircleRef.current.setLatLng([lat, lon]);
    }
  };

  // Fallback automat prin Rețea/IP dacă GPS-ul din browser este blocat sau indisponibil
  const detectLocationByIpFallback = async (autoScan = false) => {
    try {
      showToast('GPS indisponibil. Se detectează locația prin rețea...', 'info');
      // Încercăm întâi endpoint-ul securizat al serverului
      let data = null;
      try {
        const srvRes = await fetch('/api/admin/harvey/my-location');
        if (srvRes.ok) {
          const json = await srvRes.json();
          if (json?.success && json?.lat && json?.lon) {
            data = json;
          }
        }
      } catch (_) {}

      // Fallback la serviciul extern dacă serverul nu răspunde
      if (!data) {
        const ipRes = await fetch('https://ipwho.is/');
        if (ipRes.ok) {
          const json = await ipRes.json();
          if (json?.success && json?.latitude && json?.longitude) {
            data = {
              city: json.city,
              country: json.country_code || 'RO',
              lat: Number(json.latitude),
              lon: Number(json.longitude)
            };
          }
        }
      }

      if (!data || !data.lat || !data.lon) {
        throw new Error('Nu s-au putut extrage coordonatele IP');
      }

      const lat = Number(data.lat);
      const lon = Number(data.lon);
      let detectedCity = data.city || 'București';
      if (detectedCity.toLowerCase() === 'bucharest') detectedCity = 'București';
      const detectedCountry = data.country || 'RO';

      applyDetectedCoords(lat, lon, 'Locație Rețea/IP', autoScan);

      setCountry(detectedCountry);
      setCity(detectedCity);
      setDetectingLocation(false);
      showToast(`Locație detectată: ${detectedCity} (${detectedCountry})`);

      if (autoScan) {
        handleScanRadarWithCoords({ lat, lon }, detectedCity, detectedCountry);
      } else {
        loadExistingLeads(detectedCity, detectedCountry);
      }
      return true;
    } catch (e) {
      console.warn('Fallback IP eșuat:', e);
      setDetectingLocation(false);
      showToast('Permisiunea GPS este refuzată de browser. Deblochează din iconița de setări / lăcățel din bara de adresă a browserului.', 'warning');
      return false;
    }
  };

  // Funcție de detectare GPS a poziției utilizatorului (cu fallback automat pe IP)
  const detectCurrentLocation = (autoScan = false) => {
    setDetectingLocation(true);

    if (!navigator.geolocation) {
      detectLocationByIpFallback(autoScan);
      return;
    }

    showToast('Se identifică poziția GPS exactă...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const rawLat = pos?.coords?.latitude;
        const rawLon = pos?.coords?.longitude;
        const lat = Number(rawLat);
        const lon = Number(rawLon);

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          detectLocationByIpFallback(autoScan);
          return;
        }

        applyDetectedCoords(lat, lon, 'Locația Ta Curentă (GPS)', autoScan);

        let detectedCity = 'București';
        let detectedCountry = 'RO';

        try {
          const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
            headers: { 'Accept': 'application/json' }
          });
          if (revRes.ok) {
            const revData = await revRes.json();
            const addr = revData.address || {};
            const foundCity = addr.city || addr.town || addr.municipality || addr.village || addr.county;
            if (foundCity) {
              detectedCity = foundCity.replace('Municipiul ', '').replace('Județul ', '').trim();
            }
            if (addr.country_code) {
              detectedCountry = addr.country_code.toUpperCase();
            }
          }
        } catch (e) {
          let minDist = Infinity;
          for (const [cName, cCoord] of Object.entries(CITY_COORDS)) {
            const d = Math.hypot(cCoord.lat - lat, cCoord.lon - lon);
            if (d < minDist) {
              minDist = d;
              detectedCity = cName.charAt(0).toUpperCase() + cName.slice(1);
            }
          }
        }

        setCountry(detectedCountry);
        setCity(detectedCity);
        setDetectingLocation(false);
        showToast(`Locație detectată: ${detectedCity} (${detectedCountry})`);

        if (autoScan) {
          handleScanRadarWithCoords({ lat, lon }, detectedCity, detectedCountry);
        } else {
          loadExistingLeads(detectedCity, detectedCountry);
        }
      },
      (err) => {
        console.warn('GPS refuzat sau eroare:', err);
        // Dacă browserul a refuzat permisiunea (ex: permisiune blocată în Chrome pe localhost), facem fallback automat pe IP!
        detectLocationByIpFallback(autoScan);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
    );
  };

  // Verificare sigură coordonate valide (finite)
  const isValidCoord = (c) => Boolean(c && Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lon)));

  const getSafeCityCoords = () => {
    if (isValidCoord(userLocation)) {
      return { lat: Number(userLocation.lat), lon: Number(userLocation.lon) };
    }
    const effectiveCity = (!city || city === 'Toate Orașele') ? 'bucurești' : city;
    const cityKey = String(effectiveCity).trim().toLowerCase();
    if (CITY_COORDS[cityKey] && isValidCoord(CITY_COORDS[cityKey])) {
      return { lat: Number(CITY_COORDS[cityKey].lat), lon: Number(CITY_COORDS[cityKey].lon) };
    }
    const countryKey = String(country || 'RO').trim().toUpperCase();
    if (COUNTRY_COORDS[countryKey] && isValidCoord(COUNTRY_COORDS[countryKey])) {
      return { lat: Number(COUNTRY_COORDS[countryKey].lat), lon: Number(COUNTRY_COORDS[countryKey].lon) };
    }
    return { lat: 44.4323, lon: 26.1063 }; // București
  };

  // Inițializare și gestionare ciclu de viață hartă Leaflet (deasupra tabelului)
  useEffect(() => {
    if (!showMap) {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (_) {}
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
        radarCircleRef.current = null;
      }
      return;
    }

    if (!mapContainerRef.current) return;

    const initCoords = getSafeCityCoords();

    // Resetare container dacă are deja _leaflet_id
    if (mapContainerRef.current && mapContainerRef.current._leaflet_id && !mapInstanceRef.current) {
      mapContainerRef.current._leaflet_id = null;
    }

    if (!mapInstanceRef.current && mapContainerRef.current) {
      try {
        const map = L.map(mapContainerRef.current, {
          center: [initCoords.lat, initCoords.lon],
          zoom: 13,
          zoomControl: false
        });

        // Google Maps Standard Tiles (Real Google Maps, Zero Watermarks, High-Res)
        L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps'
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        markersGroupRef.current = L.featureGroup().addTo(map);

        radarCircleRef.current = L.circle([initCoords.lat, initCoords.lon], {
          radius: 3500,
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '4, 8'
        }).addTo(map);

        mapInstanceRef.current = map;

        setTimeout(() => {
          map.invalidateSize();
        }, 150);
      } catch (e) {
        console.warn('Eroare Leaflet init:', e);
      }
    } else if (mapInstanceRef.current) {
      try {
        if (Number.isFinite(initCoords.lat) && Number.isFinite(initCoords.lon)) {
          mapInstanceRef.current.flyTo([initCoords.lat, initCoords.lon], 13, { duration: 1 });
          if (radarCircleRef.current) {
            radarCircleRef.current.setLatLng([initCoords.lat, initCoords.lon]);
          }
        }
        setTimeout(() => {
          mapInstanceRef.current?.invalidateSize();
        }, 100);
      } catch (e) {
        console.warn('Eroare flyTo initCoords:', e);
      }
    }
  }, [city, country, showMap]);

  // Redimensionare hartă când utilizatorul afișează secțiunea de hartă
  useEffect(() => {
    if (showMap && mapInstanceRef.current) {
      setTimeout(() => {
        try {
          mapInstanceRef.current?.invalidateSize();
        } catch (_) {}
      }, 200);
    }
  }, [showMap]);

  // Actualizare pini pe hartă
  useEffect(() => {
    if (!showMap || !mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    const cityCoords = getSafeCityCoords();

    leads.forEach((lead, idx) => {
      let lat = Number(lead.lat);
      let lon = Number(lead.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        const angle = (idx * 137.5) * (Math.PI / 180);
        const radius = 0.005 + (idx % 6) * 0.004;
        lat = cityCoords.lat + radius * Math.cos(angle);
        lon = cityCoords.lon + radius * Math.sin(angle);
      }

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        lat = cityCoords.lat;
        lon = cityCoords.lon;
      }

      const hasPhone = Boolean(lead.phone);
      const isMobile = hasPhone && (lead.phone.includes('07') || lead.phone.includes('+407') || lead.phone.includes('+40 7'));
      const isSelectedRow = selectedLeadIds.has(lead.id);
      const pinColor = isSelectedRow ? '#f59e0b' : (isMobile ? '#10b981' : (lead.rating && lead.rating >= 4.5 ? '#8b5cf6' : '#2563eb'));

      const customIcon = L.divIcon({
        className: 'custom-radar-pin',
        html: `
          <div style="background-color: ${pinColor}; width: 28px; height: 28px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white; cursor: pointer; transform: scale(${selectedLead?.id === lead.id ? '1.25' : '1'}); transition: transform 0.2s;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      try {
        const marker = L.marker([lat, lon], { icon: customIcon });

        const popupContent = `
          <div style="min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${lead.company_name}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${lead.address || lead.city}</div>
            ${lead.phone ? `<div style="font-size: 11px; font-weight: 700; color: #059669; margin-bottom: 4px;">Tel: ${lead.phone}</div>` : ''}
            ${lead.email ? `<div style="font-size: 11px; color: #2563eb; margin-bottom: 6px;">${lead.email}</div>` : ''}
            <div style="display: flex; gap: 4px; margin-top: 8px;">
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.company_name + ' ' + (lead.address || lead.city))}" target="_blank" style="padding: 4px 8px; border-radius: 9999px; background: #2563eb; color: white; text-decoration: none; font-size: 10px; font-weight: 700;">Google Maps</a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          setSelectedLead(lead);
        });

        markersGroupRef.current.addLayer(marker);
      } catch (e) {
        console.warn('Marker skipped due to coord error:', e);
      }
    });
  }, [leads, selectedLead, selectedLeadIds, city, country, userLocation, showMap]);

  // Scanare radar cu coordonate
  const handleScanRadarWithCoords = async (coordsOverride = null, cityOverride = null, countryOverride = null) => {
    setScanningMap(true);
    try {
      const targetCountry = countryOverride || country;
      let targetCity = cityOverride || city;
      if (!targetCity || targetCity === 'Toate Orașele') {
        targetCity = 'București';
      }
      const cityKey = targetCity.toLowerCase();
      const coords = coordsOverride || userLocation || CITY_COORDS[cityKey] || COUNTRY_COORDS[targetCountry] || { lat: 44.4323, lon: 26.1063 };

      const activeNiches = niche === 'Toate Nișele' 
        ? ['Hoteluri & Pensiuni', 'Restaurante & Baruri', 'Construcții & Instalații'] 
        : [niche];

      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/admin/harvey/search`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          city: targetCity,
          cities: [targetCity],
          niche: activeNiches[0],
          niches: activeNiches,
          country: targetCountry,
          limit: 25,
          mapCenter: coords
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Eroare server (${res.status}) la scanarea radar`);
      }

      const data = await res.json();
      if (data.leads && data.leads.length > 0) {
        setLeads(data.leads);
        setCurrentPage(1);
        setSelectedLeadIds(new Set());
        showToast(data.message || `Au fost identificate ${data.leads.length} companii prin Google Places.`);
      } else {
        showToast('Nu au fost găsite companii noi în această zonă.', 'warning');
      }
    } catch (err) {
      showToast(err.message || 'Eroare la scanare', 'error');
    } finally {
      setScanningMap(false);
    }
  };

  const handleScanRadar = () => {
    handleScanRadarWithCoords(userLocation || null);
  };

  // Filtrare lead-uri pe tabel
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (lead.company_name && lead.company_name.toLowerCase().includes(q)) ||
        (lead.city && lead.city.toLowerCase().includes(q)) ||
        (lead.address && lead.address.toLowerCase().includes(q)) ||
        (lead.phone && lead.phone.toLowerCase().includes(q)) ||
        (lead.email && lead.email.toLowerCase().includes(q)) ||
        (lead.cui && lead.cui.toLowerCase().includes(q));

      const hasPhone = Boolean(lead.phone);
      const isMobile = hasPhone && (lead.phone.includes('07') || lead.phone.includes('+407') || lead.phone.includes('+40 7'));

      if (filterType === 'whatsapp') return matchesSearch && isMobile;
      if (filterType === 'email') return matchesSearch && Boolean(lead.email);
      if (filterType === 'rated') return matchesSearch && (lead.rating >= 4.5 || (lead.notes && lead.notes.includes('Rating')));
      return matchesSearch;
    });
  }, [leads, searchQuery, filterType]);

  // Sortare tabel pe orice coloană
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (columnKey) => {
    setSortConfig((prev) => {
      if (prev.key === columnKey) {
        if (prev.direction === 'asc') return { key: columnKey, direction: 'desc' };
        return { key: null, direction: 'asc' };
      }
      return { key: columnKey, direction: columnKey === 'rating' ? 'desc' : 'asc' };
    });
  };

  const sortedLeads = useMemo(() => {
    let items = [...filteredLeads];
    if (sortConfig.key) {
      items.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'rating') {
          aVal = aVal ? parseFloat(aVal) : 0;
          bVal = bVal ? parseFloat(bVal) : 0;
        } else {
          aVal = (aVal || '').toString().toLowerCase();
          bVal = (bVal || '').toString().toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [filteredLeads, sortConfig]);

  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown size={10} className="text-slate-400 opacity-60 shrink-0" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={12} className="text-blue-600 shrink-0 font-bold" />
      : <ChevronDown size={12} className="text-blue-600 shrink-0 font-bold" />;
  };

  // Paginare tabel
  const totalItems = sortedLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLeads.slice(start, start + pageSize);
  }, [sortedLeads, currentPage, pageSize]);

  // Checkbox: toggle un rând
  const toggleSelectRow = (id, e) => {
    e.stopPropagation();
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Checkbox: toggle toate pe pagina curentă
  const isAllCurrentPageSelected = paginatedLeads.length > 0 && paginatedLeads.every((l) => selectedLeadIds.has(l.id));
  const toggleSelectAllCurrentPage = () => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (isAllCurrentPageSelected) {
        paginatedLeads.forEach((l) => next.delete(l.id));
      } else {
        paginatedLeads.forEach((l) => next.add(l.id));
      }
      return next;
    });
  };

  // Checkbox: selectează absolut toate rezultatele filtrate
  const selectAllFiltered = () => {
    setSelectedLeadIds(new Set(filteredLeads.map((l) => l.id)));
  };

  // Checkbox: deselectează tot
  const clearSelection = () => {
    setSelectedLeadIds(new Set());
  };

  // Bulk Send Emails
  const handleBulkSendEmails = async () => {
    if (selectedLeadIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/admin/harvey/leads/bulk-send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ leadIds: Array.from(selectedLeadIds) })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Eroare la trimiterea în masă.');
      }
      showToast(data.message || `Au fost trimise emailurile pentru ${selectedLeadIds.size} companii.`);
      clearSelection();
      loadExistingLeads();
    } catch (err) {
      showToast(err.message || 'Eroare la trimiterea bulk', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Bulk Delete Leads
  const handleConfirmDelete = async () => {
    if (!deleteConfirmState) return;
    setBulkActionLoading(true);
    try {
      const baseUrl = getApiUrl();
      if (deleteConfirmState.type === 'single') {
        const res = await fetch(`${baseUrl}/api/admin/harvey/leads/${deleteConfirmState.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Eroare la ștergerea companiei.');
        setLeads((prev) => prev.filter((l) => l.id !== deleteConfirmState.id));
        showToast('Compania a fost ștearsă din tabel.');
      } else {
        const ids = deleteConfirmState.ids || Array.from(selectedLeadIds);
        const res = await fetch(`${baseUrl}/api/admin/harvey/leads/bulk-delete`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ leadIds: ids })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Eroare la ștergerea în lot.');
        setLeads((prev) => prev.filter((l) => !ids.includes(l.id)));
        setSelectedLeadIds(new Set());
        showToast(data.message || `Au fost șterse ${ids.length} companii.`);
      }
    } catch (err) {
      showToast(err.message || 'Eroare la ștergere', 'error');
    } finally {
      setBulkActionLoading(false);
      setDeleteConfirmState(null);
    }
  };

  // Edit Lead Modal
  const openEditModal = (lead, e) => {
    e.stopPropagation();
    setEditingLead(lead);
    setEditFormData({
      companyName: lead.company_name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      address: lead.address || '',
      city: lead.city || '',
      cui: lead.cui || '',
      notes: lead.notes || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingLead) return;
    setSavingEdit(true);
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/admin/harvey/leads/${editingLead.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          companyName: editFormData.companyName,
          phone: editFormData.phone,
          email: editFormData.email,
          address: editFormData.address,
          city: editFormData.city,
          cui: editFormData.cui,
          notes: editFormData.notes
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Eroare la salvarea modificărilor.');
      
      setLeads((prev) => prev.map((l) => (l.id === editingLead.id ? { ...l, ...data.lead } : l)));
      showToast(`Datele pentru "${editFormData.companyName}" au fost actualizate.`);
      setEditingLead(null);
    } catch (err) {
      showToast(err.message || 'Eroare la salvare', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const getWhatsAppUrl = (lead) => {
    if (!lead || !lead.phone) return null;
    const cleanDigits = lead.phone.replace(/\D/g, '');
    let targetPhone = cleanDigits;
    if (cleanDigits.startsWith('07') && cleanDigits.length === 10) {
      targetPhone = '4' + cleanDigits;
    } else if (cleanDigits.startsWith('7') && cleanDigits.length === 9) {
      targetPhone = '40' + cleanDigits;
    }
    const message = encodeURIComponent(
      `Bună ziua,\n\nVă contactez în legătură cu ${lead.company_name}. Oferim soluția modernă Pontaj.app — pontaj digital pe tabletă cu cod QR, fără condică pe hârtie și cu export automat de pontaj în SAGA Salarii.\n\nPutem programa o scurtă demonstrație gratuită de 5 minute?`
    );
    return `https://wa.me/${targetPhone}?text=${message}`;
  };

  const isMobileNumber = (phone) => {
    if (!phone) return false;
    const p = phone.replace(/\s+/g, '');
    return p.includes('07') || p.includes('+407') || p.includes('407');
  };

  // Helper extragere adrese email multiple (identic cu Harvey SDR)
  const getLeadEmails = (emailStr) => {
    if (!emailStr) return [];
    const parts = String(emailStr).split(/[;,\/\|\n\r\s]+/);
    const seen = new Set();
    const list = [];
    for (let p of parts) {
      p = p.trim().replace(/^<|>$/g, '').replace(/^['"]|['"]$/g, '').toLowerCase();
      if (p && p.includes('@') && !seen.has(p)) {
        seen.add(p);
        list.push(p);
      }
    }
    return list;
  };

  // Trimitere directă cu Confirmare In-App (Identic cu Harvey SDR)
  const handleInitiateSend = (lead, openPreview = false) => {
    setShowEmailPreviewInConfirm(Boolean(openPreview));
    setLeadToSendConfirm(lead);
  };

  const handleConfirmSendDirect = async () => {
    if (!leadToSendConfirm) return;
    setIsSendingConfirm(true);
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/admin/harvey/leads/${leadToSendConfirm.id}/send`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Trimiterea a eșuat.');
      }
      showToast(data.message || `Email trimis cu succes către ${leadToSendConfirm.company_name}!`);
      setLeadToSendConfirm(null);
      loadExistingLeads();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSendingConfirm(false);
    }
  };

  // Export Excel
  const exportToExcel = (onlySelected = false) => {
    try {
      const source = onlySelected 
        ? filteredLeads.filter((l) => selectedLeadIds.has(l.id))
        : filteredLeads;

      const exportRows = source.map((lead, idx) => ({
        'Nr.': idx + 1,
        'Companie': lead.company_name,
        'Oraș': lead.city,
        'Adresă': lead.address,
        'Telefon': lead.phone || '',
        'Email': lead.email || '',
        'Website': lead.website || '',
        'Rating Google': lead.rating || '',
        'Recenzii': lead.user_ratings_total || 0,
        'CUI': lead.cui || '',
        'Nișă': lead.industry || '',
        'Data': lead.created_at ? new Date(lead.created_at).toLocaleDateString('ro-RO') : ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Google Maps Leads');
      XLSX.writeFile(wb, `Google_Maps_Leads_${city}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast(`Fișierul Excel cu ${exportRows.length} companii a fost descărcat.`);
    } catch (e) {
      showToast('Eroare la exportul Excel: ' + e.message, 'error');
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in pb-12">
      {/* Toast intern */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-full text-xs font-bold text-white shadow-xl flex items-center gap-2 animate-fade-in ${
          toastMessage.type === 'error' ? 'bg-rose-600' : toastMessage.type === 'warning' ? 'bg-amber-600' : 'bg-emerald-600'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25">
            <Compass size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Google Maps Radar
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap shrink-0 flex items-center gap-1">
                <CheckCircle2 size={10} />
                <span>{hasGooglePlacesKey ? 'Google Places API Activ' : 'Directory Activ'}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 whitespace-nowrap shrink-0">
                {leads.length} companii în bază
              </span>
              {userLocation && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 whitespace-nowrap shrink-0 flex items-center gap-1">
                  <Crosshair size={10} />
                  <span>GPS: {city}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Scanare teritorială de companii pe Google Maps, acțiuni bulk, selecție multiplă cu checkbox și export tabelar
            </p>
          </div>
        </div>

        {/* Butoane Acțiuni Header */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Buton Ascunde / Arată Harta deasupra tabelului */}
          <button
            type="button"
            onClick={() => setShowMap((prev) => !prev)}
            className={`h-9 px-3.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
              showMap
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
            title={showMap ? 'Ascunde secțiunea de hartă de deasupra tabelului' : 'Afișează harta deasupra tabelului'}
          >
            <MapPin size={13} className="shrink-0 text-blue-600" />
            <span>{showMap ? 'Ascunde Harta' : 'Arată Harta'}</span>
            {showMap ? <ChevronUp size={13} className="shrink-0 text-slate-400" /> : <ChevronDown size={13} className="shrink-0 text-slate-400" />}
          </button>

          {/* Buton Detectează Locația Mea (GPS) */}
          <button
            onClick={() => detectCurrentLocation(true)}
            disabled={detectingLocation}
            className="h-9 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Detectează automat locația ta GPS din browser și scanează companiile din jur"
          >
            <Navigation size={13} className={detectingLocation ? 'animate-spin text-blue-600' : 'text-blue-600'} />
            <span>{detectingLocation ? 'GPS...' : 'Locația Mea'}</span>
          </button>

          {/* Buton Principal de Scanare Radar */}
          <button
            onClick={handleScanRadar}
            disabled={scanningMap}
            className="h-9 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-60"
          >
            <Crosshair size={14} className={scanningMap ? 'animate-spin' : ''} />
            <span>{scanningMap ? 'Se scanează...' : (city === 'Toate Orașele' ? 'Scanează Radar' : `Scanează ${city}`)}</span>
          </button>
          
          <button
            onClick={() => loadExistingLeads()}
            disabled={loading}
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title="Reîmprospătează"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {/* Selector Filtre: Țară, Oraș, Nișă & Căutare */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center gap-2.5">
        {/* Selector Țară */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Țară:</span>
          <select
            value={country}
            onChange={(e) => {
              const newC = e.target.value;
              setCountry(newC);
              const available = CITIES_BY_COUNTRY[newC] || ['București'];
              setCity(available[0]);
            }}
            className="h-9 px-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer shrink-0"
          >
            <option value="RO">România (RO)</option>
            <option value="BE">Belgia (BE)</option>
            <option value="FR">Franța (FR)</option>
            <option value="DE">Germania (DE)</option>
            <option value="NL">Olanda (NL)</option>
            <option value="IT">Italia (IT)</option>
            <option value="ES">Spania (ES)</option>
            <option value="GB">Marea Britanie (UK)</option>
          </select>
        </div>

        {/* Selector Oraș */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Oraș:</span>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-9 px-3.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer shrink-0"
          >
            {(CITIES_BY_COUNTRY[country] || ['București']).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            {!CITIES_BY_COUNTRY[country]?.includes(city) && (
              <option value={city}>{city} (Locație GPS)</option>
            )}
          </select>
        </div>

        {/* Selector Nișă */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nișă:</span>
          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="h-9 px-3.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer shrink-0"
          >
            {POPULAR_NICHES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Căutare rapidă în tabel */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Filtrează după companie, adresă, telefon, CUI..."
            className="w-full h-9 pl-9 pr-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filtre rapide pill */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => { setFilterType('all'); setCurrentPage(1); }}
            className={`h-8 px-3 rounded-full text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-all ${
              filterType === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Toate ({leads.length})
          </button>
          <button
            onClick={() => { setFilterType('whatsapp'); setCurrentPage(1); }}
            className={`h-8 px-3 rounded-full text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 transition-all ${
              filterType === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60'
            }`}
          >
            <MessageCircle size={11} className="shrink-0" />
            <span>WhatsApp Direct</span>
          </button>
          <button
            onClick={() => { setFilterType('email'); setCurrentPage(1); }}
            className={`h-8 px-3 rounded-full text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 transition-all ${
              filterType === 'email'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60'
            }`}
          >
            <Mail size={11} className="shrink-0" />
            <span>Email Verificat</span>
          </button>
        </div>
      </div>

      {/* 1. HARTA RADAR GOOGLE MAPS — AȘEZATĂ PERMANENT DEASUPRA TABELULUI */}
      {showMap && (
        <div className="w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden flex flex-col transition-all">
          <div className="p-3 sm:px-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-blue-600" />
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                Harta Radar — {city === 'Toate Orașele' ? `România (${filteredLeads.length} companii)` : `${city}, ${country}`}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 whitespace-nowrap shrink-0">
                {filteredLeads.length} locații pe hartă
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMap(false)}
                className="h-7 px-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                title="Ascunde temporar harta de deasupra tabelului"
              >
                <ChevronUp size={12} />
                <span>Ascunde Harta</span>
              </button>
            </div>
          </div>

          {/* Container Hartă */}
          <div className="relative w-full h-[360px] sm:h-[420px] bg-slate-100 dark:bg-slate-900">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Buton Plutitor Recentrare Oraș */}
            <button
              onClick={() => {
                const cityKey = (city || 'București').toLowerCase();
                const coords = userLocation || CITY_COORDS[cityKey] || COUNTRY_COORDS[country];
                if (coords && mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo([coords.lat, coords.lon], 13, { duration: 0.8 });
                }
              }}
              className="absolute bottom-4 left-4 z-10 px-3.5 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 transition-all whitespace-nowrap shrink-0"
              title="Recentrare pe oraș"
            >
              <Navigation size={12} className="text-blue-600 shrink-0" />
              <span>Recentrează</span>
            </button>

            {/* Buton Plutitor Locația Mea GPS */}
            <button
              onClick={() => detectCurrentLocation(false)}
              disabled={detectingLocation}
              className="absolute bottom-4 left-36 z-10 px-3.5 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 active:scale-95"
              title="Centrează pe poziția ta GPS exactă"
            >
              <Crosshair size={13} className={detectingLocation ? 'animate-spin' : ''} />
              <span>Locația Mea</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. VIZUALIZARE TABEL DE REZULTATE (afișat permanent deasupra sau sub hartă) */}
      <div className="w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden flex flex-col">
          {/* Antet Tabel & Acțiuni Bulk */}
          <div className="p-3.5 sm:px-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3 flex-wrap bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Tabel Rezultate Google Maps
              </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 whitespace-nowrap shrink-0">
              {filteredLeads.length} companii
            </span>

            {/* Bara de Acțiuni Bulk când sunt elemente selectate */}
            {selectedLeadIds.size > 0 && (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700 animate-fade-in flex-wrap">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white whitespace-nowrap shrink-0 shadow-xs">
                  {selectedLeadIds.size} selectate
                </span>

                {/* Buton Trimite Ofertă Email (Bulk) */}
                <button
                  type="button"
                  onClick={handleBulkSendEmails}
                  disabled={bulkActionLoading}
                  className="h-8 px-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                  title="Trimite email cu pitch-ul pregătit companiilor selectate"
                >
                  <Send size={12} className={bulkActionLoading ? 'animate-spin' : ''} />
                  <span>Trimite Email ({selectedLeadIds.size})</span>
                </button>

                {/* Buton Șterge Selectate (Bulk Delete) */}
                <button
                  type="button"
                  onClick={() => setDeleteConfirmState({ type: 'bulk', ids: Array.from(selectedLeadIds) })}
                  disabled={bulkActionLoading}
                  className="h-8 px-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                  title="Șterge definitiv companiile selectate din bază"
                >
                  <Trash2 size={12} />
                  <span>Șterge ({selectedLeadIds.size})</span>
                </button>

                {/* Buton Export Selectate */}
                <button
                  type="button"
                  onClick={() => exportToExcel(true)}
                  className="h-8 px-3 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
                  title="Exportă doar companiile selectate în Excel"
                >
                  <Download size={12} />
                  <span>Export Selectate</span>
                </button>

                {/* Buton Deselectează Tot */}
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold cursor-pointer underline whitespace-nowrap shrink-0"
                >
                  Deselectează
                </button>
              </div>
            )}
          </div>

          {/* Butoane Export & Utilitare */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className="h-8 px-3 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Deschide vizualizarea pe hartă"
            >
              <MapPin size={12} className="shrink-0 text-blue-600" />
              <span>Vezi pe Hartă</span>
            </button>
            <button
              type="button"
              onClick={() => exportToExcel(false)}
              className="h-8 px-3.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Descarcă toate companiile filtrate în format Excel"
            >
              <Download size={13} className="shrink-0 text-slate-500" />
              <span>Export Toate ({filteredLeads.length})</span>
            </button>
          </div>
        </div>

        {/* Corp Tabel */}
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw size={26} className="animate-spin text-blue-600" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Se încarcă tabelul de companii...
            </span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <Building2 size={40} className="text-slate-400" />
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Nicio companie găsită cu filtrele curente
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              Apasă butonul "Scanează {city} acum" sau "Locația Mea (GPS)" pentru a căuta firme reale în Google Maps.
            </p>
            <button
              onClick={handleScanRadar}
              disabled={scanningMap}
              className="mt-2 h-9 px-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Crosshair size={13} />
              <span>Scanează {city} acum</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/75 dark:bg-slate-800/80">
                  {/* Checkbox Master */}
                  <th className="py-2.5 px-2.5 w-8 text-center whitespace-nowrap shrink-0">
                    <input
                      type="checkbox"
                      checked={isAllCurrentPageSelected}
                      onChange={toggleSelectAllCurrentPage}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title={isAllCurrentPageSelected ? 'Deselectează pagina' : 'Selectează toate pe pagină'}
                    />
                  </th>

                  {/* 1. NIȘĂ (Prima Coloană) */}
                  <th 
                    onClick={() => handleSort('industry')}
                    className="py-2.5 px-2.5 whitespace-nowrap shrink-0 cursor-pointer hover:text-blue-600 transition-colors select-none"
                    title="Apasă pentru sortare după Nișă"
                  >
                    <div className="flex items-center gap-1">
                      <span>Nișă</span>
                      {renderSortIndicator('industry')}
                    </div>
                  </th>

                  {/* 2. COMPANIE & RATING (Rating pe același rând) */}
                  <th 
                    onClick={() => handleSort('company_name')}
                    className="py-2.5 px-2.5 whitespace-nowrap shrink-0 cursor-pointer hover:text-blue-600 transition-colors select-none"
                    title="Apasă pentru sortare după Nume Companie"
                  >
                    <div className="flex items-center gap-1">
                      <span>Companie & Rating</span>
                      {renderSortIndicator('company_name')}
                    </div>
                  </th>

                  {/* 3. TELEFON */}
                  <th 
                    onClick={() => handleSort('phone')}
                    className="py-2.5 px-2 whitespace-nowrap shrink-0 cursor-pointer hover:text-blue-600 transition-colors select-none"
                    title="Apasă pentru sortare după Telefon"
                  >
                    <div className="flex items-center gap-1">
                      <span>Telefon</span>
                      {renderSortIndicator('phone')}
                    </div>
                  </th>

                  {/* 4. EMAIL OFICIAL */}
                  <th 
                    onClick={() => handleSort('email')}
                    className="py-2.5 px-2 whitespace-nowrap shrink-0 cursor-pointer hover:text-blue-600 transition-colors select-none"
                    title="Apasă pentru sortare după Email"
                  >
                    <div className="flex items-center gap-1">
                      <span>Email Oficial</span>
                      {renderSortIndicator('email')}
                    </div>
                  </th>

                  {/* 5. ACȚIUNI */}
                  <th className="py-2.5 px-2.5 text-right whitespace-nowrap shrink-0 w-56">
                    Acțiuni
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                {paginatedLeads.map((lead) => {
                  const isSelected = selectedLead?.id === lead.id;
                  const isChecked = selectedLeadIds.has(lead.id);
                  const hasPhone = Boolean(lead.phone);
                  const isMobile = isMobileNumber(lead.phone);
                  const waUrl = getWhatsAppUrl(lead);

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => {
                        setSelectedLead(lead);
                        if (lead.lat && lead.lon && mapInstanceRef.current && showMap) {
                          mapInstanceRef.current.flyTo([parseFloat(lead.lat), parseFloat(lead.lon)], 15, { duration: 0.8 });
                        }
                      }}
                      className={`cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-amber-50/60 dark:bg-amber-950/20'
                          : isSelected 
                          ? 'bg-blue-50/60 dark:bg-blue-950/30 font-medium' 
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-700/40'
                      }`}
                    >
                      {/* Checkbox Rând */}
                      <td className="py-2.5 px-2.5 w-8 text-center whitespace-nowrap shrink-0" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => toggleSelectRow(lead.id, e)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* 1. NIȘĂ & CUI (Prima Coloană) */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap shrink-0">
                        <div className="flex items-center gap-1 whitespace-nowrap shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                            {lead.industry || 'General'}
                          </span>
                          {lead.cui && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-50 dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 whitespace-nowrap shrink-0">
                              {lead.cui}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. COMPANIE & RATING (Rating pe același rând cu numele!) */}
                      <td className="py-2.5 px-2.5 max-w-[270px]">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white truncate max-w-[170px]" title={lead.company_name}>
                              {lead.company_name}
                            </span>

                            {/* RATING GOOGLE PE ACELAȘI RÂND CU NUMELE */}
                            {lead.rating ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap shrink-0">
                                <Star size={9} className="fill-amber-500 text-amber-500 shrink-0" />
                                <span>{lead.rating}</span>
                                {lead.user_ratings_total ? (
                                  <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">
                                    ({lead.user_ratings_total >= 1000 ? `${(lead.user_ratings_total / 1000).toFixed(1)}k` : lead.user_ratings_total})
                                  </span>
                                ) : null}
                              </span>
                            ) : null}

                            {lead.website && (
                              <a
                                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                                title="Website oficial"
                              >
                                <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[260px]">
                            {lead.address || `${lead.city}, ${lead.country || 'RO'}`}
                          </div>
                        </div>
                      </td>

                      {/* 3. TELEFON */}
                      <td className="py-2.5 px-2 whitespace-nowrap shrink-0">
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone.replace(/\s+/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs"
                          >
                            <Phone size={10} className="text-slate-400 shrink-0" />
                            <span>{lead.phone}</span>
                            {isMobile && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Număr mobil (WhatsApp disponibil)"></span>
                            )}
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic whitespace-nowrap shrink-0">
                            -
                          </span>
                        )}
                      </td>

                      {/* 4. EMAIL OFICIAL (Click deschide Modulul Identic Harvey Email) */}
                      <td className="py-2.5 px-2 whitespace-nowrap shrink-0 max-w-[170px]">
                        {lead.email ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInitiateSend(lead, false);
                            }}
                            className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-1.5 truncate text-xs cursor-pointer text-left group"
                            title="Deschide fereastra de confirmare și trimitere email"
                          >
                            <Mail size={11} className="shrink-0 text-blue-500 group-hover:scale-110 transition-transform" />
                            <span className="truncate max-w-[145px]">{lead.email}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic whitespace-nowrap shrink-0">
                            -
                          </span>
                        )}
                      </td>

                      {/* 5. ACȚIUNI (Strict Iconițe Rotunde!) */}
                      <td className="py-2.5 px-2.5 text-right whitespace-nowrap shrink-0 w-56">
                        <div className="flex items-center justify-end gap-1 whitespace-nowrap shrink-0">
                          {/* 1-Click WhatsApp Direct */}
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0 active:scale-95"
                              title="1-Click WhatsApp Direct (deschide chat cu mesaj pregătit)"
                            >
                              <MessageCircle size={13} className="shrink-0" />
                            </a>
                          )}

                          {/* Previzualizează Email în fereastra de confirmare */}
                          {lead.email && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInitiateSend(lead, true);
                              }}
                              className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                              title="Previzualizează și trimite email (Confirmare rapidă)"
                            >
                              <Eye size={13} className="shrink-0" />
                            </button>
                          )}

                          {/* Trimite sau Retrimite Direct — cu confirmare in-app (Exact ca în Harvey SDR!) */}
                          {lead.email && (
                            lead.status === 'sent' ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInitiateSend(lead);
                                }}
                                className="w-7 h-7 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                                title="Retrimite email către acest lead (cu confirmare in-app)"
                              >
                                <RotateCcw size={12} className="shrink-0" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInitiateSend(lead);
                                }}
                                className="w-7 h-7 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                                title="Aprobă și trimite acum (cu confirmare in-app)"
                              >
                                <Send size={12} className="shrink-0" />
                              </button>
                            )
                          )}

                          {/* Google Maps Link */}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.company_name + ' ' + (lead.address || lead.city))}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors shrink-0"
                            title="Deschide în Google Maps"
                          >
                            <MapPin size={13} className="shrink-0" />
                          </a>

                          {/* Convertește în Tenant */}
                          {onConvertToTenant && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onConvertToTenant(lead);
                              }}
                              className="w-7 h-7 rounded-full bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0 active:scale-95"
                              title="Convertește în Tenant (creează cont client)"
                            >
                              <UserPlus size={13} className="shrink-0" />
                            </button>
                          )}

                          {/* Editare Companie */}
                          <button
                            type="button"
                            onClick={(e) => openEditModal(lead, e)}
                            className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            title="Editează compania"
                          >
                            <Pencil size={12} className="shrink-0" />
                          </button>

                          {/* Ștergere Companie */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmState({ type: 'single', id: lead.id, name: lead.company_name });
                            }}
                            className="w-7 h-7 rounded-full border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            title="Șterge din tabel"
                          >
                            <Trash2 size={12} className="shrink-0" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginare Tabel */}
        {filteredLeads.length > 0 && (
          <div className="p-3 sm:px-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3 flex-wrap bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
              <span>Afișează:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-7 px-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value={10}>10 / pagină</option>
                <option value={15}>15 / pagină</option>
                <option value={25}>25 / pagină</option>
                <option value={50}>50 / pagină</option>
                <option value={100}>100 / pagină</option>
              </select>
              <span>
                &bull; Pagina {currentPage} din {totalPages} ({totalItems} companii)
              </span>
            </div>

            <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="h-7 px-2.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
              >
                <ChevronLeft size={13} />
                <span>Anterior</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-7 px-2.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
              >
                <span>Următor</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL EDITARE LEAD */}
      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingLead(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Pencil size={18} className="text-blue-600 shrink-0" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Editează Compania
              </h2>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nume Companie
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.companyName}
                  onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
                  className="w-full h-9 px-3.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Telefon Contact
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    placeholder="+40..."
                    className="w-full h-9 px-3.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Email Oficial
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    placeholder="contact@..."
                    className="w-full h-9 px-3.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Oraș
                  </label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full h-9 px-3.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    CUI / Cod Fiscal
                  </label>
                  <input
                    type="text"
                    value={editFormData.cui}
                    onChange={(e) => setEditFormData({ ...editFormData, cui: e.target.value })}
                    placeholder="RO..."
                    className="w-full h-9 px-3.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Adresă Completă
                </label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full h-9 px-3.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Notițe / Observații
                </label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="h-9 px-4 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="h-9 px-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {savingEdit ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>{savingEdit ? 'Se salvează...' : 'Salvează Modificările'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMARE ȘTERGERE (FĂRĂ CONFIRM NATIV) */}
      {deleteConfirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Trash2 size={24} />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              {deleteConfirmState.type === 'single'
                ? `Ștergi compania "${deleteConfirmState.name}"?`
                : `Ștergi definitiv ${deleteConfirmState.ids?.length} companii selectate?`}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-sm mx-auto leading-relaxed">
              Această acțiune va elimina înregistrările din tabelul bazei de date. Acțiunea nu poate fi anulată ulterior.
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmState(null)}
                className="h-9 px-4 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={bulkActionLoading}
                className="h-9 px-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
              >
                {bulkActionLoading ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                <span>{bulkActionLoading ? 'Se șterge...' : 'Șterge definitiv'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL IN-APP DE CONFIRMARE TRIMITERE / RETRIMITERE EMAIL INDIVIDUAL (IDENTIC HARVEY) */}
      {leadToSendConfirm && (() => {
        const recipientList = getLeadEmails(leadToSendConfirm.email);
        const isMultiple = recipientList.length > 1;
        const isResend = leadToSendConfirm.status === 'sent' || !!leadToSendConfirm.email_sent_at;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                    isResend 
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/40' 
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/40'
                  }`}>
                    {isResend ? <RotateCcw size={18} /> : <Send size={18} />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {isResend ? 'Confirmare Retrimitere Email' : 'Confirmare Trimitere Email'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isResend ? 'Reexpediere manuală prin Brevo' : 'Verificare manuală înainte de expediere Brevo'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !isSendingConfirm && setLeadToSendConfirm(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  disabled={isSendingConfirm}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Companie:</span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[210px]">
                    {leadToSendConfirm.company_name}
                  </span>
                </div>
                {leadToSendConfirm.email_sent_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Trimis anterior:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(leadToSendConfirm.email_sent_at).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                    {isMultiple ? `Destinatari (${recipientList.length}):` : 'Destinatar:'}
                  </span>
                  <div className="flex flex-col items-end gap-1 max-w-[230px]">
                    {recipientList.length > 0 ? (
                      recipientList.map((em, idx) => (
                        <span key={idx} className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-full">
                          {em}
                        </span>
                      ))
                    ) : (
                      <span className="font-semibold text-slate-400">
                        {leadToSendConfirm.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Subiect:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[210px]">
                    {leadToSendConfirm.draft_subject || 'Pontaj digital QR'}
                  </span>
                </div>

                {/* Previzualizare Rapidă Inline Text Email */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => setShowEmailPreviewInConfirm(!showEmailPreviewInConfirm)}
                    className="w-full flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 py-0.5 transition-colors cursor-pointer select-none"
                  >
                    <span className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                      <Eye size={13} className="shrink-0" />
                      <span>{showEmailPreviewInConfirm ? 'Ascunde previzualizarea' : 'Previzualizează conținutul emailului'}</span>
                    </span>
                    <ChevronDown size={14} className={`transform transition-transform shrink-0 ${showEmailPreviewInConfirm ? 'rotate-180' : ''}`} />
                  </button>

                  {showEmailPreviewInConfirm && (
                    <div className="mt-2.5 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                      {leadToSendConfirm.draft_body ? (
                        leadToSendConfirm.draft_body
                      ) : (
                        <span className="italic text-slate-400">
                          (Textul va fi adaptat și generat automat de Harvey SDR în momentul expedierii)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {isResend ? (
                  isMultiple ? (
                    <>
                      Acest lead a fost contactat anterior. Ești sigur că vrei să <strong>retrimiți</strong> acest email către <strong>{leadToSendConfirm.company_name}</strong>? Mesajul va fi reexpediat către <strong>toate cele {recipientList.length} adrese</strong> ({recipientList.join(', ')}).
                    </>
                  ) : (
                    <>
                      Acest lead a fost contactat anterior. Ești sigur că vrei să <strong>retrimiți</strong> acest email către <strong>{leadToSendConfirm.company_name}</strong>? Mesajul va fi reexpediat pe adresa de contact salvată.
                    </>
                  )
                ) : (
                  isMultiple ? (
                    <>
                      Ești sigur că vrei să expediezi acest email către <strong>{leadToSendConfirm.company_name}</strong>? Mesajul va fi livrat garantat către <strong>toate cele {recipientList.length} adrese</strong> de contact ({recipientList.join(', ')}).
                    </>
                  ) : (
                    <>
                      Ești sigur că vrei să expediezi acest email către <strong>{leadToSendConfirm.company_name}</strong>? Mesajul va fi livrat direct pe adresa de contact salvată.
                    </>
                  )
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLeadToSendConfirm(null)}
                  disabled={isSendingConfirm}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  Anulează
                </button>

                {/* Buton Preview Email (comută previzualizarea inline în fereastra de confirmare) */}
                <button
                  type="button"
                  onClick={() => setShowEmailPreviewInConfirm(!showEmailPreviewInConfirm)}
                  disabled={isSendingConfirm}
                  className="px-3.5 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                  title="Afișează sau ascunde previzualizarea textului emailului"
                >
                  <Eye size={13} className="shrink-0" />
                  <span>{showEmailPreviewInConfirm ? 'Ascunde Preview' : 'Preview Email'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSendDirect}
                  disabled={isSendingConfirm}
                  className={`px-4.5 py-2 text-xs font-semibold text-white rounded-full shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 ${
                    isResend ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isSendingConfirm ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Se expediază...</span>
                    </>
                  ) : (
                    <>
                      {isResend ? <RotateCcw size={13} /> : <Send size={13} />}
                      <span>{isResend ? 'Retrimite Acum' : 'Trimite Acum prin Brevo'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL REVIZUIRE ȘI TRIMITERE EMAIL HARVEY (IDENTIC CU CEL DIN TABELUL HARVEY) */}
      {selectedLeadForEmailReview && (
        <HarveyReviewEmailModal
          isOpen={!!selectedLeadForEmailReview}
          onClose={() => setSelectedLeadForEmailReview(null)}
          lead={selectedLeadForEmailReview}
          onUpdated={(updated) => {
            setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
            setSelectedLeadForEmailReview(updated);
          }}
          onSent={(sentLead) => {
            setLeads((prev) => prev.map((l) => (l.id === sentLead.id ? sentLead : l)));
            setSelectedLeadForEmailReview(null);
            showToast(`Emailul către ${sentLead.company_name} a fost trimis cu succes!`);
            loadExistingLeads();
          }}
        />
      )}
    </div>
  );
}
