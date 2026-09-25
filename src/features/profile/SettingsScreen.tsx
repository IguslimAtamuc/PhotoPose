import { useState } from 'react';
import { BarChart3, Moon, RotateCcw, Trash2, Type, Vibrate, Wind } from 'lucide-react';
import { Button } from '@/components/Button';
import { ListGroup, ListRow, Segmented, Toggle } from '@/components/Controls';
import { Sheet } from '@/components/Sheet';
import { TopBar } from '@/components/TopBar';
import type { ThemePreference } from '@/models';
import { getServices } from '@/services/container';
import { useHistoryStore } from '@/stores/historyStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { toast } from '@/stores/toastStore';
import './profile.css';

export default function SettingsScreen() {
  const { settings, update, reset } = useSettingsStore();
  const clearHistory = useHistoryStore((s) => s.clear);
  const clearRecent = useLibraryStore((s) => s.clearRecent);
  const [confirm, setConfirm] = useState(false);

  return (
    <main className="screen screen--no-tabs settings">
      <TopBar title="App Settings" back />
      <div className="page-pad">
        <ListGroup title="Appearance">
          <div className="list-row list-row--stack">
            <span className="list-row__label"><Moon size={18} aria-hidden /> Theme</span>
            <Segmented<ThemePreference>
              label="Theme"
              value={settings.theme}
              onChange={(theme) => update({ theme })}
              options={[
                { value: 'system', label: 'System' },
                { value: 'dark', label: 'Dark' },
                { value: 'light', label: 'Light' },
              ]}
            />
          </div>
          <div className="list-row list-row--stack">
            <span className="list-row__label"><Type size={18} aria-hidden /> Text size</span>
            <Segmented<number>
              label="Text size"
              value={settings.textScale}
              onChange={(textScale) => update({ textScale })}
              options={[
                { value: 0.9, label: 'Small' },
                { value: 1, label: 'Default' },
                { value: 1.15, label: 'Large' },
                { value: 1.3, label: 'XL' },
              ]}
            />
          </div>
          <ListRow icon={<Wind size={18} />} label="Reduce motion" value={<Toggle label="Reduce motion" checked={settings.reduceMotion} onChange={(reduceMotion) => update({ reduceMotion })} />} />
          <ListRow icon={<Vibrate size={18} />} label="Haptics" detail="Where supported by the device" value={<Toggle label="Haptics" checked={settings.haptics} onChange={(haptics) => update({ haptics })} />} />
        </ListGroup>

        <ListGroup title="Privacy" footer="Anonymous usage analytics help us improve PhotoPose. Photos are never included.">
          <ListRow
            icon={<BarChart3 size={18} />}
            label="Share usage analytics"
            value={
              <Toggle
                label="Share usage analytics"
                checked={settings.analyticsEnabled}
                onChange={(analyticsEnabled) => {
                  update({ analyticsEnabled });
                  getServices().analytics.setEnabled(analyticsEnabled);
                }}
              />
            }
          />
        </ListGroup>

        <ListGroup title="Data">
          <ListRow icon={<RotateCcw size={18} />} label="Clear recently viewed" onClick={() => { clearRecent(); toast('Recently viewed cleared'); }} />
          <ListRow icon={<RotateCcw size={18} />} label="Reset settings" onClick={() => { reset(); toast('Settings reset'); }} />
          <ListRow icon={<Trash2 size={18} />} label="Delete all photos & history" danger onClick={() => setConfirm(true)} />
        </ListGroup>
      </div>
      <Sheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete everything?"
        footer={
          <div className="sheet-actions">
            <Button variant="ghost" size="md" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="danger" size="md" onClick={async () => { await clearHistory(); setConfirm(false); toast('All photos deleted'); }}>Delete</Button>
          </div>
        }
      >
        <p className="t-body">This permanently removes all photos and analyses stored by PhotoPose on this device.</p>
      </Sheet>
    </main>
  );
}
