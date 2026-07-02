import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, Plus, MoreVertical } from 'lucide-react';
import { cn, getGreeting, getDomain } from '../lib/utils';
import { getFaviconUrl } from '@shared/types';
import { useBackgroundStore } from '../stores/settingsStore';
import { useTabStore } from '../stores/tabStore';
import type { QuickAccessSite } from '@shared/types';

export function NewTabPage() {
  const [query, setQuery] = useState('');
  const [quickAccess, setQuickAccess] = useState<QuickAccessSite[]>([]);
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<{ temp: number; code: number; location: string } | null>(null);
  const [showAddShortcutModal, setShowAddShortcutModal] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<QuickAccessSite | null>(null);
  const [shortcutName, setShortcutName] = useState('');
  const [shortcutUrl, setShortcutUrl] = useState('');
  const [shortcutError, setShortcutError] = useState<string | null>(null);
  const [activeShortcutMenuId, setActiveShortcutMenuId] = useState<string | null>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const background = useBackgroundStore((s) => s.settings);
  const activeTabId = useTabStore((s) => s.activeTabId);

  useEffect(() => {
    const load = async () => {
      const q = await window.uxxxiii.ntp.getQuickAccess();
      setQuickAccess(q.map((site) => ({
        ...site,
        favicon: site.favicon || getFaviconUrl(site.url),
      })));
    };

    const fetchLocationWeather = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Failed location lookup');
        const locationData = await response.json();
        const latitude = locationData.latitude;
        const longitude = locationData.longitude;
        const place = locationData.city || locationData.region || locationData.country_name || 'Your location';

        if (latitude && longitude) {
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          );
          if (!weatherRes.ok) throw new Error('Failed weather lookup');
          const weatherData = await weatherRes.json();
          setWeather({
            temp: Math.round(weatherData.current_weather.temperature),
            code: weatherData.current_weather.weathercode,
            location: place,
          });
        }
      } catch {
        /* ignore */
      }
    };

    load();
    fetchLocationWeather();

    const clockInterval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    const loadBackgroundImage = async () => {
      if (!background?.imagePath || background.type !== 'image') {
        setBackgroundImageUrl(null);
        return;
      }

      try {
        const dataUrl = await window.uxxxiii.background.getImageData(background.imagePath);
        setBackgroundImageUrl(dataUrl);
      } catch {
        setBackgroundImageUrl(null);
      }
    };

    loadBackgroundImage();
  }, [background?.imagePath, background?.type]);

  const navigate = (url: string) => {
    if (!activeTabId) return;
    window.uxxxiii.nav.go(activeTabId, url);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(query);
  };

  const openAddShortcut = () => {
    setEditingShortcut(null);
    setShortcutName('');
    setShortcutUrl('');
    setShortcutError(null);
    setShowAddShortcutModal(true);
  };

  const openEditShortcut = (site: QuickAccessSite) => {
    setEditingShortcut(site);
    setShortcutName(site.title);
    setShortcutUrl(site.url);
    setShortcutError(null);
    setShowAddShortcutModal(true);
  };

  const closeAddShortcut = () => {
    setShowAddShortcutModal(false);
    setEditingShortcut(null);
    setShortcutError(null);
  };

  const saveShortcut = async () => {
    const name = shortcutName.trim();
    let url = shortcutUrl.trim();

    if (!name || !url) {
      setShortcutError('Please enter both name and URL.');
      return;
    }

    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    try {
      new URL(url);
    } catch {
      setShortcutError('Please enter a valid URL.');
      return;
    }

    const nextQuickAccess = editingShortcut
      ? quickAccess.map((item) =>
          item.id === editingShortcut.id ? { ...item, title: name, url, favicon: item.favicon || getFaviconUrl(url) } : item
        )
      : [
          ...quickAccess,
          {
            id: window.crypto?.randomUUID?.() ?? `${Date.now()}`,
            title: name,
            url,
            favicon: getFaviconUrl(url),
          },
        ];

    setQuickAccess(nextQuickAccess);
    await window.uxxxiii.ntp.setQuickAccess(nextQuickAccess);
    closeAddShortcut();
  };

  const deleteShortcut = async (id: string) => {
    const nextQuickAccess = quickAccess.filter((item) => item.id !== id);
    setQuickAccess(nextQuickAccess);
    await window.uxxxiii.ntp.setQuickAccess(nextQuickAccess);
    setActiveShortcutMenuId(null);
  };

  const normalizeBackgroundImagePath = (path?: string): string | null => {
    if (!path) return null;
    const normalized = path.replace(/\\/g, '/');
    if (normalized.startsWith('file://')) {
      return normalized.replace(/^file:\/\/+/, 'file:///');
    }

    if (/^[A-Za-z]:\//.test(normalized)) {
      return `file:///${encodeURI(normalized)}`;
    }

    try {
      return new URL(normalized, 'file:///').href;
    } catch {
      return normalized;
    }
  };

  const bgImagePath = normalizeBackgroundImagePath(background?.imagePath);
  const isImage = background?.type === 'image' && (backgroundImageUrl || bgImagePath);
  const bgStyle: React.CSSProperties = isImage
    ? {
        backgroundImage: `url("${backgroundImageUrl ?? bgImagePath}")`,
        backgroundSize: background?.scaling ?? 'cover',
        backgroundPosition: background?.position ?? 'center',
        backgroundRepeat: 'no-repeat',
      }
    : background?.type === 'gradient' && background.gradientColors && background.gradientColors.length
    ? {
        background: `linear-gradient(135deg, ${background.gradientColors.join(', ')})`,
      }
    : background?.type === 'default' && background.solidColor
    ? { background: background.solidColor }
    : {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      };

  // accessibility / readability adaptations
  const [avgLuminance, setAvgLuminance] = useState<number | null>(null);

  useEffect(() => {
    const src = backgroundImageUrl ?? bgImagePath;
    if (!src || background?.accessibilityMode === 'none') {
      setAvgLuminance(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const cw = 40;
        const ch = 40;
        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        if (!ctx) return setAvgLuminance(null);
        ctx.drawImage(img, 0, 0, cw, ch);
        const data = ctx.getImageData(0, 0, cw, ch).data;
        let sum = 0;
        let cnt = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          sum += lum;
          cnt++;
        }
        setAvgLuminance(cnt ? sum / cnt : null);
      } catch {
        setAvgLuminance(null);
      }
    };
    img.onerror = () => setAvgLuminance(null);
    img.src = src;
  }, [backgroundImageUrl, bgImagePath, background?.accessibilityMode]);

  const hexToRgba = (hex: string, a: number) => {
    if (!hex) return `rgba(0,0,0,${a})`;
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  };

  const overlayOpacity = (background?.overlayOpacity ?? 40) / 100;
  // decide overlay color: auto uses luminance
  const isBright = avgLuminance !== null ? avgLuminance > 130 : null;
  let overlayColor = background?.overlayColor ?? '#000000';
  if (background?.accessibilityMode === 'auto' && isBright !== null) {
    overlayColor = isBright ? '#000000' : '#ffffff';
  }
  // increase effective overlay when in auto mode for better readability
  const effectiveOverlayOpacity = background?.overlayEnabled
    ? overlayOpacity
    : background?.accessibilityMode === 'auto'
    ? Math.max(overlayOpacity, 0.5)
    : overlayOpacity;
  const showOverlay = !!background && (background.overlayEnabled || background.accessibilityMode === 'overlay' || (background.accessibilityMode === 'auto' && avgLuminance !== null));
  const overlayStyle: React.CSSProperties = showOverlay ? { backgroundColor: hexToRgba(overlayColor, effectiveOverlayOpacity) } : {};

  const textColor = (background?.highContrast
    ? (overlayColor === '#000000' ? '#ffffff' : '#000000')
    : (isBright === null ? (overlayColor === '#000000' ? '#ffffff' : '#000000') : (isBright ? '#ffffff' : '#000000')) ) as string | undefined;
  const textStyle: React.CSSProperties = {
    color: textColor ?? undefined,
    textShadow: background?.highContrast ? '0 2px 8px rgba(0,0,0,0.6)' : undefined,
    fontWeight: background?.highContrast ? 700 : undefined,
  };

  // UI element styles derived from background for readability
  const overlayAlpha = effectiveOverlayOpacity;
  const tileBg = isImage ? hexToRgba(overlayColor, Math.min(overlayAlpha + 0.15, 0.9)) : undefined;
  const tileBorder = isImage ? hexToRgba(overlayColor === '#000000' ? '#ffffff' : '#000000', 0.12) : undefined;
  const tileStyle: React.CSSProperties = {
    backgroundColor: tileBg,
    borderColor: tileBorder,
    color: textStyle.color,
  };

  const inputBg = isImage ? hexToRgba(overlayColor === '#000000' ? '#ffffff' : '#000000', Math.min(overlayAlpha * 0.9, 0.85)) : undefined;
  const inputStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    color: textStyle.color,
    borderColor: tileBorder,
  };

  const modalBg = background?.highContrast ? (overlayColor === '#000000' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)') : undefined;
  const modalTextStyle: React.CSSProperties = {
    color: textStyle.color,
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0" style={bgStyle} />
          {showOverlay && <div className="absolute inset-0" style={overlayStyle} />}
        {!isImage && <div className="absolute inset-0 bg-surface/60 backdrop-blur-sm" />}
      </div>

      <div className="relative flex flex-col items-center justify-center min-h-full px-8 py-12">
        {/* Clock & Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="text-6xl font-light mb-2 tabular-nums" style={textStyle}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-lg" style={textStyle}>
            {getGreeting()}
          </div>
          {weather && (
            <div className="mt-2 text-sm" style={textStyle}>
              {weather.location} · {weather.temp}°C
            </div>
          )}
        </motion.div>

        {/* Search */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSearch}
          className="w-full max-w-xl mb-10"
        >
          <div className="flex items-center gap-3 px-5 h-14 rounded-2xl backdrop-blur-xl shadow-elevated"
            style={{
              backgroundColor: inputStyle.backgroundColor ?? undefined,
              borderColor: inputStyle.borderColor ?? undefined,
              color: inputStyle.color ?? undefined,
            }}
          >
            <Search size={20} className="text-text-tertiary shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the web..."
                  className="flex-1 bg-transparent text-base placeholder:text-text-tertiary outline-none"
                  style={inputStyle}
                  autoFocus
                />
          </div>
        </motion.form>

        {/* Quick Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-2xl"
        >
          <h3 className="text-xs font-medium uppercase tracking-wider mb-3 px-1" style={textStyle}>
            Quick Access
          </h3>
          <div className="grid grid-cols-4 gap-3 mb-8">
                {quickAccess.map((site, i) => (
              <div key={site.id} className="group relative overflow-visible">
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(site.url)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all w-full text-left"
                  style={tileStyle}
                >
                  <div className="w-10 h-10 rounded-xl bg-surface-tertiary flex items-center justify-center">
                    {site.favicon ? (
                      <img src={site.favicon} alt="" className="w-6 h-6 rounded" />
                    ) : (
                      <span className="text-sm font-medium text-accent" style={modalTextStyle}>{site.title[0]}</span>
                    )}
                  </div>
                  <span className="text-xs truncate w-full text-center" style={modalTextStyle}>{site.title}</span>
                </motion.button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveShortcutMenuId((current) => (current === site.id ? null : site.id));
                  }}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-2 bg-surface-secondary/80 hover:bg-surface-secondary border border-border text-text-secondary"
                >
                  <MoreVertical size={16} />
                </button>

                {activeShortcutMenuId === site.id && (
                  <div className="absolute top-12 right-3 z-20 min-w-[140px] rounded-2xl bg-surface-elevated border border-border shadow-elevated overflow-hidden">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditShortcut(site);
                        setActiveShortcutMenuId(null);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
                    >
                      Edit shortcut
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteShortcut(site.id);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary hover:text-rose-400"
                    >
                      Remove shortcut
                    </button>
                  </div>
                )}
              </div>
            ))}

            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={openAddShortcut}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all"
              style={tileStyle}
            >
              <div className="w-10 h-10 rounded-xl bg-surface-tertiary flex items-center justify-center text-accent">
                <Plus size={20} />
              </div>
              <span className="text-xs truncate w-full text-center" style={modalTextStyle}>Add shortcut</span>
            </motion.button>
          </div>

          {showAddShortcutModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-3xl bg-surface-elevated border border-border p-6 shadow-elevated">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-lg font-semibold text-text-primary">Add shortcut</div>
                    <div className="text-sm text-text-secondary">Create a quick access tile for your New Tab page.</div>
                  </div>
                  <button type="button" onClick={closeAddShortcut} className="text-text-secondary hover:text-text-primary">×</button>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm text-text-secondary">Name</label>
                  <input
                    type="text"
                    value={shortcutName}
                    onChange={(e) => setShortcutName(e.target.value)}
                    placeholder="e.g. YouTube"
                    className="w-full rounded-2xl bg-surface-tertiary border border-border px-4 py-3 text-sm text-text-primary outline-none focus:border-accent/40"
                  />

                  <label className="block text-sm text-text-secondary">URL</label>
                  <input
                    type="text"
                    value={shortcutUrl}
                    onChange={(e) => setShortcutUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full rounded-2xl bg-surface-tertiary border border-border px-4 py-3 text-sm text-text-primary outline-none focus:border-accent/40"
                  />

                  {shortcutError && <div className="text-sm text-rose-400">{shortcutError}</div>}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={closeAddShortcut} className="rounded-full border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-tertiary">Cancel</button>
                  <button type="button" onClick={saveShortcut} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black hover:bg-accent-hover">Done</button>
                </div>
              </div>
            </div>
          )}

        </motion.div>

        {/* Productivity widget */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="fixed bottom-6 right-6 p-4 rounded-2xl shadow-soft max-w-xs"
          style={{
            backgroundColor: tileStyle.backgroundColor ?? undefined,
            border: `1px solid ${tileStyle.borderColor ?? 'rgba(255,255,255,0.12)'}`,
            color: modalTextStyle.color ?? undefined,
          }}
        >
          <div className="text-xs font-medium mb-2" style={modalTextStyle}>Focus</div>
          <div className="text-sm" style={modalTextStyle}>Stay productive. One tab at a time.</div>
        </motion.div>
      </div>
    </div>
  );
}