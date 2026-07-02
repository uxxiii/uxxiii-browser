import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useSettingsStore } from '../../stores/settingsStore';
import { THEMES, SEARCH_ENGINES, type ThemeId, type SearchEngine } from '@shared/types';
import {
  Palette, Globe, Shield, Zap, Rocket, Type, Keyboard,
  Download, Trash2, Upload, RotateCcw,
} from 'lucide-react';

const SECTIONS = [
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
  { id: 'search', label: 'Search', icon: <Globe size={16} /> },
  { id: 'privacy', label: 'Privacy', icon: <Shield size={16} /> },
  { id: 'performance', label: 'Performance', icon: <Zap size={16} /> },
  { id: 'startup', label: 'Startup', icon: <Rocket size={16} /> },
  { id: 'fonts', label: 'Fonts', icon: <Type size={16} /> },
  { id: 'downloads', label: 'Downloads', icon: <Download size={16} /> },
  { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={16} /> },
  { id: 'data', label: 'Data', icon: <Trash2 size={16} /> },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

export function SettingsPanel() {
  const [section, setSection] = useState<SectionId>('appearance');
  const { settings, updateSettings } = useSettingsStore();

  if (!settings) return null;

  return (
    <div className="flex h-full">
      <div className="w-36 shrink-0 border-r border-border-subtle py-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors',
              section === s.id
                ? 'text-accent bg-accent-muted'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary'
            )}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {section === 'appearance' && (
          <>
            <SettingGroup title="Theme">
              <div className="grid grid-cols-3 gap-2">
                {Object.values(THEMES).map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => updateSettings({ theme: theme.id as ThemeId })}
                    className={cn(
                      'p-2 rounded-lg border text-xs transition-all',
                      settings.theme === theme.id
                        ? 'border-accent bg-accent-muted text-accent'
                        : 'border-border hover:border-accent/50 text-text-secondary'
                    )}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </SettingGroup>
            <SettingGroup title="Accent Color">
              <input
                type="color"
                value={settings.customTheme.accentColor}
                onChange={(e) => updateSettings({
                  customTheme: { ...settings.customTheme, accentColor: e.target.value },
                })}
                className="w-10 h-10 rounded-lg cursor-pointer"
              />
            </SettingGroup>
            <SettingGroup title="Corner Radius">
              <input
                type="range"
                min={4}
                max={24}
                value={settings.customTheme.cornerRadius}
                onChange={(e) => updateSettings({
                  customTheme: { ...settings.customTheme, cornerRadius: Number(e.target.value) },
                })}
                className="w-full accent-accent"
              />
              <span className="text-xs text-text-tertiary">{settings.customTheme.cornerRadius}px</span>
            </SettingGroup>
            <ToggleSetting
              label="Show bookmarks bar"
              checked={settings.showBookmarksBar}
              onChange={(v) => updateSettings({ showBookmarksBar: v })}
            />
          </>
        )}

        {section === 'search' && (
          <>
            <SettingGroup title="Search Engine">
              <div className="space-y-1">
                {Object.values(SEARCH_ENGINES).filter((e) => e.id !== 'custom').map((engine) => (
                  <button
                    key={engine.id}
                    onClick={() => updateSettings({ searchEngine: engine.id as SearchEngine })}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                      settings.searchEngine === engine.id
                        ? 'bg-accent-muted text-accent'
                        : 'hover:bg-surface-tertiary text-text-secondary'
                    )}
                  >
                    {engine.name}
                  </button>
                ))}
              </div>
            </SettingGroup>
            <SettingGroup title="Homepage">
              <input
                type="text"
                value={settings.homepage}
                onChange={(e) => updateSettings({ homepage: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-surface-tertiary border border-border text-sm text-text-primary outline-none focus:border-accent"
              />
            </SettingGroup>
          </>
        )}

        {section === 'privacy' && (
          <>
            <ToggleSetting label="Block trackers" checked={settings.blockTrackers} onChange={(v) => updateSettings({ blockTrackers: v })} />
            <ToggleSetting label="Block third-party cookies" checked={settings.blockThirdPartyCookies} onChange={(v) => updateSettings({ blockThirdPartyCookies: v })} />
            <ToggleSetting label="Do Not Track" checked={settings.doNotTrack} onChange={(v) => updateSettings({ doNotTrack: v })} />
            <ToggleSetting label="Clear data on exit" checked={settings.clearOnExit} onChange={(v) => updateSettings({ clearOnExit: v })} />
            <div className="pt-2 space-y-2">
              <ActionButton label="Clear cache" onClick={() => window.uxxxiii.settings.clearCache()} />
              <ActionButton label="Clear cookies" onClick={() => window.uxxxiii.settings.clearCookies()} />
            </div>
          </>
        )}

        {section === 'performance' && (
          <ToggleSetting
            label="Hardware acceleration"
            checked={settings.hardwareAcceleration}
            onChange={(v) => updateSettings({ hardwareAcceleration: v })}
          />
        )}

        {section === 'startup' && (
          <>
            <SettingGroup title="On startup">
              {(['new-tab', 'restore', 'homepage'] as const).map((behavior) => (
                <button
                  key={behavior}
                  onClick={() => updateSettings({ startupBehavior: behavior })}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-1',
                    settings.startupBehavior === behavior
                      ? 'bg-accent-muted text-accent'
                      : 'hover:bg-surface-tertiary text-text-secondary'
                  )}
                >
                  {behavior === 'new-tab' ? 'Open new tab' : behavior === 'restore' ? 'Restore session' : 'Open homepage'}
                </button>
              ))}
            </SettingGroup>
            <ToggleSetting label="Restore session after crash" checked={settings.restoreSession} onChange={(v) => updateSettings({ restoreSession: v })} />
          </>
        )}

        {section === 'fonts' && (
          <>
            <SettingGroup title="Font size">
              <input
                type="range"
                min={12}
                max={20}
                value={settings.fontSize}
                onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                className="w-full accent-accent"
              />
              <span className="text-xs text-text-tertiary">{settings.fontSize}px</span>
            </SettingGroup>
            <SettingGroup title="Font family">
              <select
                value={settings.fontFamily}
                onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-surface-tertiary border border-border text-sm text-text-primary outline-none"
              >
                {['Inter', 'SF Pro Display', 'Segoe UI', 'Roboto', 'JetBrains Mono'].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </SettingGroup>
          </>
        )}

        {section === 'downloads' && (
          <>
            <SettingGroup title="Download location">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.downloadPath}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-lg bg-surface-tertiary border border-border text-sm text-text-secondary outline-none"
                />
                <button
                  onClick={async () => {
                    const path = await window.uxxxiii.dialog.selectFolder();
                    if (path) updateSettings({ downloadPath: path });
                  }}
                  className="px-3 py-2 rounded-lg bg-surface-tertiary text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Browse
                </button>
              </div>
            </SettingGroup>
            <ToggleSetting label="Ask where to save" checked={settings.askDownloadLocation} onChange={(v) => updateSettings({ askDownloadLocation: v })} />
          </>
        )}

        {section === 'shortcuts' && (
          <div className="space-y-2">
            {Object.entries(settings.keyboardShortcuts).map(([action, shortcut]) => (
              <div key={action} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-tertiary/50">
                <span className="text-sm text-text-secondary capitalize">{action.replace(/-/g, ' ')}</span>
                <kbd className="px-2 py-1 rounded bg-surface-elevated text-xs text-text-tertiary font-mono">{shortcut}</kbd>
              </div>
            ))}
          </div>
        )}

        {section === 'data' && (
          <div className="space-y-3">
            <ActionButton label="Export browser data" icon={<Upload size={14} />} onClick={async () => {
              const data = await window.uxxxiii.settings.export();
              await window.uxxxiii.clipboard.write(data);
            }} />
            <ActionButton label="Import browser data" icon={<Download size={14} />} onClick={async () => {
              const data = await window.uxxxiii.clipboard.read();
              if (data) await window.uxxxiii.settings.import(data);
            }} />
            <ActionButton label="Reset browser" icon={<RotateCcw size={14} />} onClick={() => window.uxxxiii.settings.reset()} danger />
          </div>
        )}
      </div>
    </div>
  );
}

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  );
}

function ToggleSetting({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-text-secondary">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'w-10 h-6 rounded-full transition-colors relative',
          checked ? 'bg-accent' : 'bg-surface-tertiary'
        )}
      >
        <div className={cn(
          'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm',
          checked ? 'translate-x-5' : 'translate-x-1'
        )} />
      </button>
    </label>
  );
}

function ActionButton({ label, onClick, icon, danger }: { label: string; onClick: () => void; icon?: React.ReactNode; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors',
        danger
          ? 'text-red-400 hover:bg-red-400/10'
          : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
      )}
    >
      {icon}
      {label}
    </button>
  );
}
