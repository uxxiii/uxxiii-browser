import { cn } from '../../lib/utils';
import { useSettingsStore, useBackgroundStore } from '../../stores/settingsStore';
import { THEMES, type ThemeId } from '@shared/types';
import { Check, Image } from 'lucide-react';

export function ThemesPanel() {
  const { settings, updateSettings } = useSettingsStore();
  const { settings: bgSettings, update: updateBg, selectImage } = useBackgroundStore();

  if (!settings) return null;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">Themes</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(THEMES).map((theme) => (
            <button
              key={theme.id}
              onClick={() => updateSettings({ theme: theme.id as ThemeId })}
              className={cn(
                'relative p-3 rounded-xl border transition-all text-left',
                settings.theme === theme.id
                  ? 'border-accent shadow-glow'
                  : 'border-border hover:border-accent/30'
              )}
            >
              <div className="flex gap-1 mb-2">
                {Object.values(theme.colors).slice(0, 4).map((color, i) => (
                  <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="text-sm font-medium text-text-primary">{theme.name}</div>
              {settings.theme === theme.id && (
                <Check size={14} className="absolute top-2 right-2 text-accent" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">Custom Background</h3>
        <button
          onClick={selectImage}
          className="w-full flex items-center gap-3 p-4 rounded-xl border border-dashed border-border hover:border-accent/50 transition-colors"
        >
          <Image size={20} className="text-text-tertiary" />
          <div className="text-left">
            <div className="text-sm text-text-primary">Upload background image</div>
            <div className="text-xs text-text-tertiary">JPG, PNG, WebP supported</div>
          </div>
        </button>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => updateBg({ type: 'default', imagePath: undefined })}
            className="rounded-full px-3 py-2 bg-surface-secondary border border-border text-sm text-text-primary"
          >
            Remove image
          </button>
          <input
            type="color"
            value={bgSettings?.solidColor ?? '#0f172a'}
            onChange={(e) => updateBg({ type: 'default', solidColor: e.target.value })}
            className="w-10 h-10 p-0 border border-border rounded"
            title="Pick solid background color"
          />
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {['#0f172a','#111827','#0ea5a4','#7c3aed','#ef4444','#f59e0b','#10b981','#3b82f6'].map((c) => (
            <button
              key={c}
              onClick={() => updateBg({ type: 'gradient', gradientColors: [c, '#000000'] })}
              className="h-8 rounded"
              style={{ background: `linear-gradient(135deg, ${c} 0%, #000000 100%)` }}
              aria-label={`Use ${c} background`}
            />
          ))}
        </div>

        {bgSettings && (
          <div className="mt-4 space-y-3">
            <SliderSetting
              label="Blur"
              value={bgSettings.blur}
              min={0}
              max={40}
              onChange={(v) => updateBg({ blur: v })}
            />
            <SliderSetting
              label="Brightness"
              value={bgSettings.brightness}
              min={20}
              max={150}
              onChange={(v) => updateBg({ brightness: v })}
            />
            <SliderSetting
              label="Opacity"
              value={bgSettings.opacity}
              min={10}
              max={100}
              onChange={(v) => updateBg({ opacity: v })}
            />
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary">Readability overlay</span>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-tertiary">Auto</label>
                  <select
                    value={bgSettings.accessibilityMode ?? 'auto'}
                    onChange={(e) => updateBg({ accessibilityMode: e.target.value as any })}
                    className="text-sm bg-transparent border border-border rounded px-2 py-1"
                  >
                    <option value="auto">Auto</option>
                    <option value="overlay">Overlay</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!bgSettings.overlayEnabled}
                  onChange={(e) => updateBg({ overlayEnabled: e.target.checked })}
                />
                <span className="text-sm text-text-secondary">Enable overlay</span>
              </div>

              <SliderSetting
                label="Overlay opacity"
                value={bgSettings.overlayOpacity ?? 40}
                min={0}
                max={100}
                onChange={(v) => updateBg({ overlayOpacity: v })}
              />

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!bgSettings.highContrast}
                  onChange={(e) => updateBg({ highContrast: e.target.checked })}
                />
                <span className="text-sm text-text-secondary">High contrast mode</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">Customization</h3>
        <div className="space-y-3">
          <SliderSetting
            label="Background blur (glass)"
            value={settings.customTheme.backgroundBlur}
            min={0}
            max={40}
            onChange={(v) => updateSettings({
              customTheme: { ...settings.customTheme, backgroundBlur: v },
            })}
          />
          <SliderSetting
            label="Animation speed"
            value={settings.customTheme.animationSpeed * 10}
            min={1}
            max={10}
            onChange={(v) => updateSettings({
              customTheme: { ...settings.customTheme, animationSpeed: v / 10 },
            })}
          />
          <SliderSetting
            label="Sidebar width"
            value={settings.customTheme.sidebarWidth}
            min={200}
            max={400}
            onChange={(v) => updateSettings({
              customTheme: { ...settings.customTheme, sidebarWidth: v },
            })}
          />
        </div>
      </div>
    </div>
  );
}

function SliderSetting({
  label, value, min, max, onChange,
}: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs text-text-tertiary">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}
