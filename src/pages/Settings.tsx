import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import BackButton from '@/components/ui/BackButton';
import { 
  School,
  Save,
  Loader2,
  Calendar,
  Layers,
  GraduationCap,
  Plus,
  Trash2,
  Info,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Lock,
  Navigation,
  Clock,
  History,
  AlertTriangle,
  AlertCircle,
  UserCog,
  Search,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Shield,
  FileSpreadsheet,
  RotateCcw,
  Key,
  MapPin,
  Eye,
  EyeOff,
  RefreshCw,
  Unlock,
  ShieldAlert,
  Crosshair
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getGeofenceConfig, setGeofenceConfig as persistGeofenceConfig, GeofenceConfig, calculateDistance } from '@/lib/geofence';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { loadGoogleMapsScript, useGoogleMapsReady } from '@/hooks/useGoogleMaps';
import { useGoogleMapsApiKey } from '@/hooks/useGoogleMapsApiKey';

const SETTINGS_MASTER_KEY = 'munyaka_system_settings_v3';
const SETTINGS_ROW_ID = 'default';

type Action = 'read' | 'create' | 'edit' | 'delete';
type PermissionState = Record<string, Record<Action, boolean>>;

const MODULES = [
  { id: 'sys_config', title: 'System Configuration & Security', desc: 'RBAC, Audit Logs, System Backups' },
  { id: 'academic_grading', title: 'Academic & CBC Grading Setup', desc: 'Assessments, Report Cards, Grade Bounds' },
  { id: 'student_records', title: 'Student & Guardian Records', desc: 'Enrollment, Bio Data, Attendance' },
  { id: 'finance_fees', title: 'Fee Management & Finance', desc: 'Billing, Invoices, Payment Collections' },
  { id: 'staff_mgmt', title: 'Staff Management & Geofence', desc: 'Staff Profiles, Compound GPS Tracking' }
];

const ROLES = [
  { id: 'super_admin', label: 'System Administrator' },
  { id: 'head_teacher', label: 'Principal / Head' },
  { id: 'bursar', label: 'Bursar / Accountant' },
  { id: 'teacher', label: 'Class Teacher' },
  { id: 'parent', label: 'Parent / Guardian' },
  { id: 'student', label: 'Learner' }
];

const DEFAULT_AUDIT_LOGS = [
  { timestamp: "2026-03-31 09:14:02", admin: "System Admin", action: "Geofence Radius Updated (150m)", ip: "192.168.1.102 (Chrome/Win)" },
  { timestamp: "2026-03-30 16:45:11", admin: "System Admin", action: "Credentials Reset for J. Mwangi", ip: "192.168.1.102 (Chrome/Win)" },
  { timestamp: "2026-03-28 11:20:30", admin: "Head Teacher", action: "Grade Bounds Modified (Grade 4)", ip: "192.168.1.108 (Safari/Mac)" },
  { timestamp: "2026-03-25 08:30:15", admin: "System Admin", action: "Idle Session Timeout set to 30m", ip: "192.168.1.102 (Chrome/Win)" }
];

const getPasswordStrength = (pass: string) => {
  if (!pass) return { score: 0, label: 'Not Set', color: 'bg-slate-200 text-slate-400' };
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 10) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 2) return { score: 33, label: 'Weak', color: 'bg-rose-500 text-rose-600' };
  if (score <= 4) return { score: 66, label: 'Medium', color: 'bg-amber-500 text-amber-600' };
  return { score: 100, label: 'Strong', color: 'bg-emerald-500 text-emerald-600' };
};

const Settings = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(false);
  const [showAuthPass, setShowAuthPass] = useState(false);

  const { location: currentGeoLoc, isLoading: isLocating, error: geoError, refresh: refreshGeo } = useGeolocation();
  const { apiKey: googleMapsApiKey, isLoading: isLoadingApiKey, refetch: refetchApiKey } = useGoogleMapsApiKey();
  const googleMapsReady = useGoogleMapsReady(googleMapsApiKey);

  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [activeTab, setActiveTab] = useState(() => {
    // Honour a ?tab= URL param so other parts of the app can deep-link
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (['general', 'academic', 'roles', 'security'].includes(tab ?? '')) return tab as string;
    }
    return 'roles';
  });

  const [generalConfig, setGeneralConfig] = useState({
    schoolName: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
    motto: "KNOWLEDGE IS POWER",
    postalAddress: "P.O. BOX 5239-30100 ELDORET",
    phone: "+254 712 345 678",
    email: "info@munyaka.sc.ke",
    location: "Munyaka, Eldoret East, Uasin Gishu County",
    maintenanceMode: false,
    googleMapsApiKey: ""
  });

  const [academicConfig, setAcademicConfig] = useState({
    activeYear: "2026",
    activeTerm: "term1",
    termStartDate: "2026-01-05",
    termEndDate: "2026-04-10",
    gradingScale: [
      { level: "EE", descriptor: "Exceeding Expectations", min: 80, max: 100, points: 4 },
      { level: "ME", descriptor: "Meeting Expectations", min: 50, max: 79, points: 3 },
      { level: "AE", descriptor: "Approaching Expectations", min: 30, max: 49, points: 2 },
      { level: "BE", descriptor: "Below Expectations", min: 0, max: 29, points: 1 }
    ]
  });

  const [expandedRole, setExpandedRole] = useState<string | null>('super_admin');
  const [permissions, setPermissions] = useState<Record<string, PermissionState>>(() => {
    const initialState: Record<string, PermissionState> = {};
    ROLES.forEach(role => {
      initialState[role.id] = {};
      MODULES.forEach(mod => {
        initialState[role.id][mod.id] = {
          read: true,
          create: role.id === 'super_admin' || role.id === 'head_teacher',
          edit: role.id === 'super_admin' || role.id === 'head_teacher',
          delete: role.id === 'super_admin'
        };
      });
    });
    return initialState;
  });

  const [pinForm, setPinForm] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: ""
  });
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Geofence state — defaults to the new Munyaka School coordinates
  const [geofenceConfig, setGeofenceState] = useState<GeofenceConfig>({
    lat: 0.5304,
    lng: 35.3078,
    radius: 150
  });
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [devBypass, setDevBypass] = useState(false);

  const [sessionSecurity, setSessionSecurity] = useState({
    idleTimeout: "30m",
    requirePasswordOnFirstLogin: true
  });

  const [auditLogs, setAuditLogs] = useState(DEFAULT_AUDIT_LOGS);

  // Admin Location Picker state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Refs to the underlying Google Maps objects so we can re-style them
  // whenever the geofence config changes without rebuilding the map.
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const handleAuthorizeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPassword.trim()) {
      setAuthError("Please enter your admin password.");
      return;
    }

    setIsVerifyingAuth(true);
    setAuthError("");

    await new Promise(r => setTimeout(r, 600));

    const currentAdminPass = localStorage.getItem('munyaka_admin_pass') || 'munyaka5239';

    if (authPassword === currentAdminPass) {
      setIsAuthorized(true);
      setAuthPassword("");
      showSuccess("Admin authorization granted. Opening System Configuration...");
    } else {
      setAuthError("Invalid Admin Password. Access denied.");
      setAuthPassword("");
      showError("Authentication failed");
    }
    setIsVerifyingAuth(false);
  };

  const handleLockSettings = () => {
    setIsAuthorized(false);
    setAuthPassword("");
    setAuthError("");
    showSuccess("Configuration console locked.");
  };

  const fetchSettingsFromDatabase = useCallback(async () => {
    setIsLoadingSettings(true);

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', SETTINGS_ROW_ID)
        .single();

      if (!error && data) {
        setGeneralConfig({
          schoolName: data.school_name || "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
          motto: data.motto || "KNOWLEDGE IS POWER",
          postalAddress: data.postal_address || "P.O. BOX 5239-30100 ELDORET",
          phone: data.phone || "+254 712 345 678",
          email: data.email || "info@munyaka.sc.ke",
          location: data.location || "Munyaka, Eldoret East, Uasin Gishu County",
          maintenanceMode: !!data.maintenance_mode,
          googleMapsApiKey: data.google_maps_api_key || ""
        });

        setAcademicConfig({
          activeYear: data.active_year || "2026",
          activeTerm: data.active_term || "term1",
          termStartDate: data.term_start_date || "2026-01-05",
          termEndDate: data.term_end_date || "2026-04-10",
          gradingScale: data.grading_scale || academicConfig.gradingScale
        });

        if (data.rbac_permissions) setPermissions(data.rbac_permissions);
        if (data.geofence_lat !== undefined && data.geofence_lng !== undefined) {
          setGeofenceState({
            lat: data.geofence_lat,
            lng: data.geofence_lng,
            radius: data.geofence_radius || 150
          });
        }
        if (data.geofence_enabled !== undefined) setGeofenceEnabled(!!data.geofence_enabled);
        if (data.dev_bypass !== undefined) setDevBypass(!!data.dev_bypass);
        if (data.session_security) setSessionSecurity(data.session_security);
        if (data.audit_logs) setAuditLogs(data.audit_logs);

      } else {
        const savedMaster = localStorage.getItem(SETTINGS_MASTER_KEY);
        if (savedMaster) {
          const parsed = JSON.parse(savedMaster);
          if (parsed.general) setGeneralConfig(parsed.general);
          if (parsed.academic) setAcademicConfig(parsed.academic);
          if (parsed.permissions) setPermissions(parsed.permissions);
          if (parsed.geofence) setGeofenceState(parsed.geofence);
          if (parsed.geofenceEnabled !== undefined) setGeofenceEnabled(parsed.geofenceEnabled);
          if (parsed.devBypass !== undefined) setDevBypass(parsed.devBypass);
          if (parsed.sessionSecurity) setSessionSecurity(parsed.sessionSecurity);
          if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
        } else {
          const geoConf = getGeofenceConfig();
          setGeofenceState(geoConf);
        }
      }
    } catch (err) {
      console.warn("Supabase fetch fallback to local state:", err);
    } finally {
      setIsLoadingSettings(false);
      setHasUnsavedChanges(false);
    }
  }, []);

  useEffect(() => {
    fetchSettingsFromDatabase();
  }, [fetchSettingsFromDatabase]);

  /**
   * ============================================
   * Admin Location Picker: Google Maps bootstrap
   * ============================================
   * When the Google Maps API is ready AND the user has the Security
   * tab active, build an interactive map inside the
   * #admin-location-map container. The map lets the admin:
   *   1. Click anywhere to drop the school pin
   *   2. Search for a place via the autocomplete
   *   3. Use their current GPS as the school location
   *
   * All three actions update `geofenceConfig` and mark the form
   * as having unsaved changes. A blue circle overlay renders the
   * active geofence radius so the admin can visually validate the
   * distance threshold they choose.
   */
  useEffect(() => {
    if (!googleMapsReady || activeTab !== 'security') return;
    if (typeof window === 'undefined' || !window.google?.maps) return;

    const container = document.getElementById('admin-location-map');
    if (!container) return;
    if (mapRef.current) return; // Already initialised

    // Clear any previous map contents (e.g. on re-render)
    container.innerHTML = '';

    const center = { lat: geofenceConfig.lat, lng: geofenceConfig.lng };

    const map = new window.google.maps.Map(container, {
      center,
      zoom: 17,
      mapTypeId: 'roadmap',
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });
    mapRef.current = map;

    // School pin (draggable so the admin can fine-tune)
    const marker = new window.google.maps.Marker({
      position: center,
      map,
      draggable: true,
      title: 'School Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4f46e5',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });
    markerRef.current = marker;

    // Geofence circle overlay
    const circle = new window.google.maps.Circle({
      strokeColor: '#4f46e5',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#4f46e5',
      fillOpacity: 0.15,
      map,
      center,
      radius: geofenceConfig.radius,
    });
    circleRef.current = circle;

    // Click anywhere on the map to move the school pin
    map.addListener('click', (e: any) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      marker.setPosition({ lat, lng });
      circle.setCenter({ lat, lng });
      setGeofenceState(prev => ({ ...prev, lat, lng }));
      setHasUnsavedChanges(true);
    });

    // Drag the pin to fine-tune
    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      if (!pos) return;
      const lat = pos.lat();
      const lng = pos.lng();
      circle.setCenter({ lat, lng });
      setGeofenceState(prev => ({ ...prev, lat, lng }));
      setHasUnsavedChanges(true);
    });

    // Attach autocomplete to the search input
    if (searchInputRef.current && window.google.maps.places) {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['school', 'establishment', 'geocode'],
        fields: ['place_id', 'name', 'geometry', 'formatted_address'],
      });
      autocompleteRef.current = autocomplete;
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          marker.setPosition({ lat, lng });
          circle.setCenter({ lat, lng });
          map.setCenter({ lat, lng });
          map.setZoom(17);
          setGeofenceState(prev => ({ ...prev, lat, lng }));
          setSearchQuery(place.name || '');
          setShowSearchResults(false);
          setHasUnsavedChanges(true);
          showSuccess(`School location set to: ${place.name}`);
        }
      });
    }

    return () => {
      // Cleanup on unmount or when deps change
      if (markerRef.current) markerRef.current.setMap(null);
      if (circleRef.current) circleRef.current.setMap(null);
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
      autocompleteRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleMapsReady, activeTab]);

  /**
   * Whenever the geofence radius or coordinates change in state,
   * reflect those changes on the existing map objects so the
   * admin sees the new circle and pin in real time.
   */
  useEffect(() => {
    if (mapRef.current && markerRef.current && circleRef.current && window.google?.maps) {
      markerRef.current.setPosition({ lat: geofenceConfig.lat, lng: geofenceConfig.lng });
      circleRef.current.setCenter({ lat: geofenceConfig.lat, lng: geofenceConfig.lng });
      circleRef.current.setRadius(geofenceConfig.radius);
    }
  }, [geofenceConfig.lat, geofenceConfig.lng, geofenceConfig.radius]);

  const handleSaveAllSettings = async () => {
    setIsSaving(true);

    const payload = {
      id: SETTINGS_ROW_ID,
      school_name: generalConfig.schoolName,
      motto: generalConfig.motto,
      postal_address: generalConfig.postalAddress,
      phone: generalConfig.phone,
      email: generalConfig.email,
      location: generalConfig.location,
      maintenance_mode: generalConfig.maintenanceMode,
      google_maps_api_key: generalConfig.googleMapsApiKey,
      active_year: academicConfig.activeYear,
      active_term: academicConfig.activeTerm,
      term_start_date: academicConfig.termStartDate,
      term_end_date: academicConfig.termEndDate,
      grading_scale: academicConfig.gradingScale,
      rbac_permissions: permissions,
      geofence_lat: geofenceConfig.lat,
      geofence_lng: geofenceConfig.lng,
      geofence_radius: geofenceConfig.radius,
      geofence_enabled: geofenceEnabled,
      dev_bypass: devBypass,
      session_security: sessionSecurity,
      audit_logs: auditLogs,
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn("Supabase upsert warning:", error.message);
      }

      const masterLocal = {
        general: generalConfig,
        academic: academicConfig,
        permissions,
        geofence: geofenceConfig,
        geofenceEnabled,
        devBypass,
        sessionSecurity,
        auditLogs
      };
      localStorage.setItem(SETTINGS_MASTER_KEY, JSON.stringify(masterLocal));
      // Mirror the change into the canonical geofence key so that
      // isWithinGeofence() / getGeofenceConfig() everywhere else in
      // the app picks it up immediately.
      persistGeofenceConfig(geofenceConfig);

      // Re-fetch the Google Maps API key so the map reloads with any
      // updated credentials saved in System Configuration.
      refetchApiKey();

      setHasUnsavedChanges(false);
      showSuccess("System settings saved successfully!");
    } catch (err: any) {
      showError(`Failed to save settings: ${err.message || 'Network error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = async () => {
    showSuccess("Discarded uncommitted changes. Re-fetching committed record...");
    await fetchSettingsFromDatabase();
  };

  const handleUseCurrentLocation = () => {
    if (currentGeoLoc) {
      const newLat = parseFloat(currentGeoLoc.lat.toFixed(6));
      const newLng = parseFloat(currentGeoLoc.lng.toFixed(6));
      setGeofenceState(prev => ({ ...prev, lat: newLat, lng: newLng }));
      setHasUnsavedChanges(true);
      // Also push the change to the map immediately if it is loaded
      if (markerRef.current && circleRef.current && mapRef.current && window.google?.maps) {
        markerRef.current.setPosition({ lat: newLat, lng: newLng });
        circleRef.current.setCenter({ lat: newLat, lng: newLng });
        mapRef.current.setCenter({ lat: newLat, lng: newLng });
      }
      showSuccess(`Auto-filled coordinates: ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`);
    } else if (geoError) {
      showError(`Geolocation Error: ${geoError}`);
    } else {
      showError("Acquiring GPS signal. Please allow location permissions in your browser.");
    }
  };

  /**
   * Centre the map on the user's current GPS location. The pin stays
   * where it is — only the viewport moves — so the admin can
   * preview how their target school location looks relative to
   * where they currently are.
   */
  const handleCenterOnMe = () => {
    if (currentGeoLoc && mapRef.current && window.google?.maps) {
      mapRef.current.setCenter({ lat: currentGeoLoc.lat, lng: currentGeoLoc.lng });
      mapRef.current.setZoom(17);
    } else if (geoError) {
      showError(`Geolocation Error: ${geoError}`);
    } else {
      showError("Acquiring GPS signal. Please allow location permissions in your browser.");
    }
  };

  const handleUpdateMasterPin = async () => {
    const storedAdminPass = localStorage.getItem('munyaka_admin_pass') || 'munyaka5239';
    
    if (pinForm.currentPin !== storedAdminPass) {
      showError("Current Admin PIN/Password is incorrect.");
      return;
    }

    if (!pinForm.newPin || pinForm.newPin.length < 6) {
      showError("New PIN/Password must be at least 6 characters long.");
      return;
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      showError("New PINs do not match.");
      return;
    }

    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));

    localStorage.setItem('munyaka_admin_pass', pinForm.newPin);

    const newLog = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      admin: "System Admin",
      action: "Admin Master Password / PIN Updated",
      ip: "192.168.1.102 (Chrome/Win)"
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);

    setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
    setIsSaving(false);
    setHasUnsavedChanges(true);
    showSuccess("Administrative Master PIN updated successfully!");
  };

  const togglePermission = (roleId: string, modId: string, action: Action) => {
    setPermissions(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [modId]: {
          ...prev[roleId][modId],
          [action]: !prev[roleId][modId][action]
        }
      }
    }));
    setHasUnsavedChanges(true);
  };

  const toggleAllForRole = (roleId: string, checked: boolean) => {
    setPermissions(prev => {
      const updatedRole = { ...prev[roleId] };
      MODULES.forEach(mod => {
        updatedRole[mod.id] = { read: checked, create: checked, edit: checked, delete: checked };
      });
      return { ...prev, [roleId]: updatedRole };
    });
    setHasUnsavedChanges(true);
  };

  const strength = useMemo(() => getPasswordStrength(pinForm.newPin), [pinForm.newPin]);
  const isPinMatching = pinForm.confirmPin.length > 0 && pinForm.newPin === pinForm.confirmPin;

  /**
   * Live distance from the admin's current GPS to the school's
   * configured target. Used in the "Live Distance Check" panel
   * so the admin can immediately see whether the radius they
   * choose will catch their physical location on school grounds.
   */
  const liveDistanceMeters = useMemo(() => {
    if (!currentGeoLoc) return null;
    return calculateDistance(
      currentGeoLoc.lat,
      currentGeoLoc.lng,
      geofenceConfig.lat,
      geofenceConfig.lng
    );
  }, [currentGeoLoc, geofenceConfig.lat, geofenceConfig.lng]);

  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex items-center gap-3 mb-6">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Configuration</h1>
            <p className="text-xs text-slate-500 font-medium">Restricted Administrative Settings</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-2">
          <CardContent className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-rose-100">
                <Lock size={36} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Authorization Required</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Enter your administrative PIN / password to access system configuration, RBAC permissions, and security parameters.
              </p>
            </div>

            <form onSubmit={handleAuthorizeSettings} className="space-y-6">
              {authError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                  <ShieldAlert size={18} className="shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Admin PIN / Password</Label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    type={showAuthPass ? "text" : "password"}
                    value={authPassword}
                    onChange={(e) => {
                      setAuthPassword(e.target.value);
                      if (authError) setAuthError("");
                    }}
                    placeholder="••••••••"
                    className="h-14 pl-12 pr-12 rounded-2xl bg-slate-50 border-none font-bold text-lg focus:bg-white focus:ring-2 ring-indigo-100"
                    autoFocus
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowAuthPass(!showAuthPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showAuthPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isVerifyingAuth || !authPassword.trim()}
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-xl shadow-indigo-100 gap-2 transition-all active:scale-95"
              >
                {isVerifyingAuth ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    <Unlock size={20} />
                    Authorize Access
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Admin Security Notice</p>
              <p className="text-xs text-slate-500 font-medium">Default admin credential: <strong className="text-slate-800">munyaka5239</strong></p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingSettings) {
    return (
      <div className="max-w-7xl mx-auto p-12 flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-500 font-bold text-sm">Executing database fetch for system settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 action-bar">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">System Configuration</h1>
              <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[10px] px-2.5 py-0.5">
                <ShieldCheck size={12} className="mr-1 inline" /> Unlocked
              </Badge>
            </div>
            <p className="text-muted-foreground">Master console for institutional policy, RBAC roles, and security parameters.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <>
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse font-bold px-3 py-1 text-xs">
                <AlertTriangle size={14} className="mr-1.5" /> Uncommitted Changes
              </Badge>
              <Button 
                variant="outline"
                onClick={handleDiscardChanges}
                disabled={isSaving}
                className="rounded-2xl border-slate-200 text-slate-600 font-bold h-14 px-6 hover:bg-slate-50"
              >
                <RotateCcw size={16} className="mr-2" /> Discard
              </Button>
            </>
          )}
          
          <Button 
            variant="outline"
            onClick={handleLockSettings}
            className="rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 font-bold h-14 px-6 gap-2"
          >
            <Lock size={16} /> Lock Console
          </Button>

          <Button 
            onClick={handleSaveAllSettings} 
            disabled={isSaving} 
            className="rounded-2xl px-8 h-14 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save All Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(tab) => {
        setActiveTab(tab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url.toString());
      }} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-14 mb-8 flex overflow-x-auto">
          <TabsTrigger value="general" className="rounded-xl px-8 h-full font-bold text-xs">General</TabsTrigger>
          <TabsTrigger value="academic" className="rounded-xl px-8 h-full font-bold text-xs">Academic Setup</TabsTrigger>
          <TabsTrigger value="roles" className="rounded-xl px-8 h-full font-bold text-xs">Users & Roles</TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-8 h-full font-bold text-xs">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b">
              <CardTitle className="text-2xl font-black text-slate-900">Institutional Identity</CardTitle>
              <CardDescription>Primary school details displayed on transcripts, receipts, and public communications.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">School Name</Label>
                  <Input 
                    value={generalConfig.schoolName} 
                    onChange={e => { setGeneralConfig({...generalConfig, schoolName: e.target.value}); setHasUnsavedChanges(true); }}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Motto</Label>
                  <Input 
                    value={generalConfig.motto} 
                    onChange={e => { setGeneralConfig({...generalConfig, motto: e.target.value}); setHasUnsavedChanges(true); }}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Official Email</Label>
                  <Input 
                    value={generalConfig.email} 
                    onChange={e => { setGeneralConfig({...generalConfig, email: e.target.value}); setHasUnsavedChanges(true); }}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Contact Phone</Label>
                  <Input
                    value={generalConfig.phone}
                    onChange={e => { setGeneralConfig({...generalConfig, phone: e.target.value}); setHasUnsavedChanges(true); }}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Google Maps API Key</Label>
                    <Badge
                      className={cn(
                        "font-bold text-[10px] px-2 py-0.5",
                        generalConfig.googleMapsApiKey
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      )}
                    >
                      {generalConfig.googleMapsApiKey ? "✓ Configured" : "✗ Missing"}
                    </Badge>
                  </div>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                      type={showAuthPass ? "text" : "password"}
                      value={generalConfig.googleMapsApiKey}
                      onChange={e => { setGeneralConfig({...generalConfig, googleMapsApiKey: e.target.value}); setHasUnsavedChanges(true); }}
                      placeholder="AIzaSy… (paste your Google Maps JavaScript API key here)"
                      className="h-12 pl-12 pr-12 rounded-xl bg-slate-50 border-none font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAuthPass(!showAuthPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      title={showAuthPass ? "Hide key" : "Show key"}
                    >
                      {showAuthPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Required by the Admin Location Picker and other map views. Generate a key with the <em>Maps JavaScript API</em> enabled in the Google Cloud Console and restrict it to this domain.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">System Maintenance Mode</p>
                  <p className="text-xs text-slate-500">Temporarily restrict portal access for parents and students during term rollover.</p>
                </div>
                <Switch 
                  checked={generalConfig.maintenanceMode}
                  onCheckedChange={checked => { setGeneralConfig({...generalConfig, maintenanceMode: checked}); setHasUnsavedChanges(true); }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b">
              <CardTitle className="text-2xl font-black text-slate-900">Active Academic Calendar</CardTitle>
              <CardDescription>Configure term dates and national CBC grading thresholds.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Active Academic Year</Label>
                  <Select 
                    value={academicConfig.activeYear} 
                    onValueChange={val => { setAcademicConfig({...academicConfig, activeYear: val}); setHasUnsavedChanges(true); }}
                  >
                    <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Active Term</Label>
                  <Select 
                    value={academicConfig.activeTerm} 
                    onValueChange={val => { setAcademicConfig({...academicConfig, activeTerm: val}); setHasUnsavedChanges(true); }}
                  >
                    <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term1">Term 1</SelectItem>
                      <SelectItem value="term2">Term 2</SelectItem>
                      <SelectItem value="term3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Term Start Date</Label>
                  <Input 
                    type="date"
                    value={academicConfig.termStartDate}
                    onChange={e => { setAcademicConfig({...academicConfig, termStartDate: e.target.value}); setHasUnsavedChanges(true); }}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
              <UserCog size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">RBAC Permission Matrix</h2>
              <p className="text-sm text-slate-500">Configure module-level access rights for each system role.</p>
            </div>
          </div>

          <div className="space-y-4">
            {ROLES.map((role) => {
              const isOpen = expandedRole === role.id;
              const rolePerms = permissions[role.id] || {};
              const allChecked = MODULES.every(m => rolePerms[m.id]?.read && rolePerms[m.id]?.create && rolePerms[m.id]?.edit && rolePerms[m.id]?.delete);

              return (
                <div key={role.id} className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => setExpandedRole(isOpen ? null : role.id)}
                    className={cn(
                      "w-full px-8 py-6 flex items-center justify-between transition-colors",
                      isOpen ? "bg-indigo-600 text-white" : "bg-white hover:bg-slate-50 text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-xl transition-colors",
                        isOpen ? "bg-white/20" : "bg-indigo-50 text-indigo-600"
                      )}>
                        <Shield size={20} />
                      </div>
                      <span className="text-lg font-bold tracking-tight">{role.label}</span>
                    </div>
                    {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} className="text-slate-400" />}
                  </button>

                  {isOpen && (
                    <div className="p-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="text-indigo-600" size={20} />
                          <div>
                            <p className="font-bold text-slate-900">Full Administrative Access</p>
                            <p className="text-xs text-slate-500">Grant all CRUD permissions for this role across every module.</p>
                          </div>
                        </div>
                        <Switch 
                          checked={allChecked} 
                          onCheckedChange={(checked) => toggleAllForRole(role.id, checked)}
                          className="data-[state=checked]:bg-indigo-600"
                        />
                      </div>

                      <div className="overflow-hidden border border-slate-100 rounded-3xl">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr>
                              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Module & Description</th>
                              <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Read</th>
                              <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Create</th>
                              <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Edit</th>
                              <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Delete</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {MODULES.map((mod) => (
                              <tr key={mod.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-6 py-5">
                                  <p className="font-bold text-slate-900">{mod.title}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{mod.desc}</p>
                                </td>
                                {(['read', 'create', 'edit', 'delete'] as Action[]).map((action) => (
                                  <td key={action} className="px-4 py-5 text-center">
                                    <Checkbox
                                      checked={rolePerms[mod.id]?.[action] || false}
                                      onCheckedChange={() => togglePermission(role.id, mod.id, action)}
                                      className="rounded-md border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                  <Key size={24} />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900">Master Administrative Credentials</CardTitle>
                  <CardDescription>Protects sensitive operations like geofence overrides, grade deletions, and fee structure updates.</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 font-bold px-3 py-1">
                High Privilege Level
              </Badge>
            </CardHeader>

            <CardContent className="px-0 pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Current Admin PIN / Password</Label>
                  <div className="relative">
                    <Input 
                      type={showCurrentPin ? "text" : "password"}
                      value={pinForm.currentPin}
                      onChange={e => setPinForm({...pinForm, currentPin: e.target.value})}
                      placeholder="••••••••"
                      className="rounded-xl h-12 bg-slate-50 border-none font-bold pr-10"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowCurrentPin(!showCurrentPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPin ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">New Admin PIN / Password</Label>
                  <div className="relative">
                    <Input 
                      type={showNewPin ? "text" : "password"}
                      value={pinForm.newPin}
                      onChange={e => setPinForm({...pinForm, newPin: e.target.value})}
                      placeholder="••••••••"
                      className="rounded-xl h-12 bg-slate-50 border-none font-bold pr-10"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNewPin(!showNewPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPin ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {pinForm.newPin && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">Strength Indicator</span>
                        <span className={strength.color.split(' ')[1]}>{strength.label}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${strength.color.split(' ')[0]}`} style={{ width: `${strength.score}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Confirm New PIN / Password</Label>
                  <div className="relative">
                    <Input 
                      type={showConfirmPin ? "text" : "password"}
                      value={pinForm.confirmPin}
                      onChange={e => setPinForm({...pinForm, confirmPin: e.target.value})}
                      placeholder="••••••••"
                      className="rounded-xl h-12 bg-slate-50 border-none font-bold pr-10"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPin ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {pinForm.confirmPin && (
                    <p className={`text-xs font-bold flex items-center gap-1 ${isPinMatching ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isPinMatching ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {isPinMatching ? "PINs match" : "PINs do not match"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleUpdateMasterPin}
                  disabled={isSaving || !pinForm.currentPin || !isPinMatching}
                  className="rounded-xl px-8 h-12 font-bold bg-slate-900 text-white hover:bg-slate-800 gap-2 shadow-lg"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                  Update Master PIN
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <MapPin size={24} />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900">Geofence & Location Security Rules</CardTitle>
                  <CardDescription>Control global GPS parameters for staff daily attendance check-ins.</CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-indigo-50/60 p-3 px-5 rounded-2xl border border-indigo-100">
                <Label htmlFor="geofence-master-toggle" className="text-xs font-black uppercase tracking-widest text-indigo-900 cursor-pointer">
                  Geofence Enforcement
                </Label>
                <Switch 
                  id="geofence-master-toggle"
                  checked={geofenceEnabled}
                  onCheckedChange={checked => { setGeofenceEnabled(checked); setHasUnsavedChanges(true); }}
                />
              </div>
            </CardHeader>

            <CardContent className="px-0 pt-6 space-y-6">
              {/* Admin Location Picker - Interactive Google Map */}
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Admin Location Picker</h3>
                    <p className="text-sm text-slate-500">Search for the school, click the map to drop a pin, or use your current GPS location. The blue circle shows the active geofence radius.</p>
                  </div>
                  <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 font-bold px-3 py-1">
                    <MapPin size={12} className="mr-1 inline" /> Interactive Map
                  </Badge>
                </div>

                {/* Place Search / Autocomplete */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  <Input 
                    ref={searchInputRef}
                    placeholder="Search for school, address, or landmark..." 
                    className="pl-11 h-12 rounded-2xl border border-slate-200 bg-white font-medium focus:ring-2 ring-indigo-100"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(false); }}
                  />
                  {isLoadingApiKey ? (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-indigo-600" size={18} />
                  ) : googleMapsReady ? (
                    <Badge className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px] px-2 py-0.5 pointer-events-none">
                      ✓ Live search
                    </Badge>
                  ) : (
                    <Badge className="absolute right-3 top-1/2 -translate-y-1/2 bg-amber-50 text-amber-700 border-amber-200 font-bold text-[10px] px-2 py-0.5 pointer-events-none">
                      ✗ Unavailable
                    </Badge>
                  )}
                </div>

                {/* Live Map */}
                <div
                  className="relative w-full overflow-hidden rounded-2xl border-2 border-slate-200 shadow-lg"
                  style={{ height: '400px' }}
                  data-testid="admin-location-map-container"
                >
                  {/* No API key in System Configuration — show actionable error */}
                  {!isLoadingApiKey && !googleMapsApiKey ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-50 text-slate-500 p-8 text-center">
                      <div className="w-14 h-14 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center">
                        <MapPin size={28} />
                      </div>
                      <p className="text-sm font-bold text-slate-700">Google Maps API Key Missing</p>
                      <p className="text-xs max-w-xs leading-relaxed text-slate-400">
                        Add your Google Maps API key here or go to the General tab.
                      </p>

                      {/* Inline API key quick-setup */}
                      <div className="mt-2 w-full max-w-sm space-y-2">
                        <Input
                          id="quick-api-key-input"
                          type="password"
                          placeholder="Paste Google Maps API key here…"
                          value={generalConfig.googleMapsApiKey}
                          onChange={e => { setGeneralConfig({...generalConfig, googleMapsApiKey: e.target.value}); setHasUnsavedChanges(true); }}
                          className="h-10 rounded-xl bg-white border border-slate-200 font-mono text-xs text-center"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow"
                            onClick={async () => {
                              // Save directly to localStorage and re-trigger the key fetch
                              const savedMaster = localStorage.getItem('munyaka_system_settings_v3');
                              const parsed = savedMaster ? JSON.parse(savedMaster) : {};
                              const updated = {
                                ...parsed,
                                general: {
                                  ...(parsed.general || {}),
                                  googleMapsApiKey: generalConfig.googleMapsApiKey
                                }
                              };
                              localStorage.setItem('munyaka_system_settings_v3', JSON.stringify(updated));
                              setHasUnsavedChanges(true);
                              await handleSaveAllSettings();
                            }}
                          >
                            <Save size={13} /> Save & Load Map
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-9 rounded-xl border-slate-200 text-slate-600 font-bold text-xs gap-1.5"
                            onClick={() => {
                              setActiveTab('general');
                              const url = new URL(window.location.href);
                              url.searchParams.set('tab', 'general');
                              window.history.replaceState({}, '', url.toString());
                            }}
                          >
                            <ChevronRight size={13} /> General Tab
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : googleMapsReady ? (
                    <>
                      <div
                        id="admin-location-map"
                        style={{ width: '100%', height: '100%', display: 'block' }}
                        data-testid="admin-location-map"
                        aria-label="Interactive map for setting school geofence location"
                      />
                      <Button
                        onClick={handleCenterOnMe}
                        disabled={!currentGeoLoc}
                        size="icon"
                        className="absolute top-4 right-4 z-10 rounded-2xl w-12 h-12 bg-white shadow-xl text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 border border-slate-200"
                        title="Centre map on my current location"
                      >
                        <Crosshair size={20} />
                      </Button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-50 text-slate-400">
                      <Loader2 className="animate-spin" size={32} />
                      <p className="text-sm font-bold">Loading Google Maps…</p>
                      <p className="text-xs">First-time load may take a few seconds.</p>
                    </div>
                  )}
                </div>

                {/* Coordinate + Radius Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Latitude</Label>
                    <Input 
                      type="number"
                      step="0.000001"
                      value={geofenceConfig.lat}
                      onChange={e => {
                        const lat = parseFloat(e.target.value) || 0;
                        setGeofenceState({...geofenceConfig, lat});
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="e.g. 0.5304"
                      className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Longitude</Label>
                    <Input 
                      type="number"
                      step="0.000001"
                      value={geofenceConfig.lng}
                      onChange={e => {
                        const lng = parseFloat(e.target.value) || 0;
                        setGeofenceState({...geofenceConfig, lng});
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="e.g. 35.3078"
                      className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Geofence Radius (meters)</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        min="50"
                        max="1000"
                        value={geofenceConfig.radius}
                        onChange={e => {
                          const radius = parseInt(e.target.value) || 50;
                          setGeofenceState({...geofenceConfig, radius});
                          setHasUnsavedChanges(true);
                        }}
                        className="w-24 h-12 rounded-xl bg-slate-50 border-none font-bold text-center"
                      />
                      <span className="text-xs font-bold text-slate-500">Meters</span>
                    </div>
                  </div>

                  <div className="space-y-2 flex flex-col justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUseCurrentLocation}
                      disabled={isLocating}
                      className="h-12 rounded-xl border-indigo-200 bg-indigo-50/50 text-indigo-700 font-bold hover:bg-indigo-100 gap-2"
                    >
                      {isLocating ? <Loader2 className="animate-spin" size={16} /> : <Navigation size={16} />}
                      Use My Current Location
                    </Button>
                  </div>
                </div>

                {/* Live Distance Verification Panel */}
                <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Live Distance Verification</p>
                      <p className="text-xs text-amber-800">Distance from your current GPS to the configured school target</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {currentGeoLoc && liveDistanceMeters !== null ? (
                      <>
                        <div className="text-right">
                          <p className="text-2xl font-black text-slate-900">
                            {Math.round(liveDistanceMeters)} m
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">from school</p>
                        </div>
                        <Badge className={cn("rounded-full font-bold px-3 py-1", 
                          liveDistanceMeters <= geofenceConfig.radius 
                            ? "bg-emerald-50 text-emerald-700" 
                            : "bg-rose-50 text-rose-700"
                        )}>
                          {liveDistanceMeters <= geofenceConfig.radius 
                            ? <><CheckCircle2 size={12} className="mr-1 inline" /> Inside {geofenceConfig.radius}m</>
                            : <><AlertCircle size={12} className="mr-1 inline" /> Outside {geofenceConfig.radius}m</>
                          }
                        </Badge>
                      </>
                    ) : (
                      <div className="text-slate-500 text-sm">
                        <p>Enable location access to see live distance</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save & Update Target Location Button */}
                <div className="pt-4 border-t flex justify-end">
                  <Button
                    onClick={handleSaveAllSettings}
                    disabled={isSaving}
                    className="rounded-xl px-8 h-12 font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-100"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Save & Update Target Location
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Allowed Geofence Radius Limit</Label>
                    <p className="text-xs text-slate-500 mt-0.5">Staff check-ins outside this distance from school coordinates will be rejected.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number"
                      value={geofenceConfig.radius}
                      onChange={e => {
                        const radius = parseInt(e.target.value) || 50;
                        setGeofenceState({...geofenceConfig, radius});
                        setHasUnsavedChanges(true);
                      }}
                      className="w-24 h-10 rounded-xl bg-slate-50 font-black text-center"
                    />
                    <span className="text-xs font-bold text-slate-500">Meters</span>
                  </div>
                </div>

                <input 
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={geofenceConfig.radius}
                  onChange={e => {
                    const radius = parseInt(e.target.value);
                    setGeofenceState({...geofenceConfig, radius});
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Development / Localhost Bypass</p>
                    <p className="text-xs text-amber-800">Skip GPS distance enforcement for local software testing and offline demonstrations.</p>
                  </div>
                </div>
                <Switch 
                  checked={devBypass}
                  onCheckedChange={checked => { setDevBypass(checked); setHasUnsavedChanges(true); }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/30 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
                  <History size={24} />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-slate-900">System Security Audit Trail</CardTitle>
                  <CardDescription>Read-only log of high-privilege configuration and authentication events.</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-slate-200 text-slate-600 font-bold">
                Immutable Ledger
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-4 font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                      <th className="px-8 py-4 font-black uppercase tracking-widest text-slate-400">Admin User</th>
                      <th className="px-8 py-4 font-black uppercase tracking-widest text-slate-400">Action Taken</th>
                      <th className="px-8 py-4 font-black uppercase tracking-widest text-slate-400 text-right">IP / Device Origin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log, index) => (
                      <tr key={index} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-8 py-4 font-mono text-slate-500">{log.timestamp}</td>
                        <td className="px-8 py-4 font-bold text-slate-900">{log.admin}</td>
                        <td className="px-8 py-4">
                          <Badge variant="outline" className="rounded-lg border-indigo-100 bg-indigo-50/50 text-indigo-700 font-bold">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-8 py-4 text-right font-mono text-slate-400">{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;