import { Activity, FlipHorizontal, Grid3x3, Layers, SwitchCamera, Timer } from 'lucide-react';
import { ListGroup, ListRow, Segmented, Toggle } from '@/components/Controls';
import { TopBar } from '@/components/TopBar';
import { useSettingsStore } from '@/stores/settingsStore';
import './profile.css';

export default function CameraSettingsScreen() {
  const { settings, updateCamera } = useSettingsStore();
  const c = settings.camera;
  return (
    <main className="screen screen--no-tabs settings">
      <TopBar title="Camera Settings" back />
      <div className="page-pad">
        <ListGroup title="Defaults">
          <div className="list-row list-row--stack">
            <span className="list-row__label"><SwitchCamera size={18} aria-hidden /> Start with</span>
            <Segmented label="Default camera" value={c.defaultFacing} onChange={(defaultFacing) => updateCamera({ defaultFacing })} options={[{ value: 'user', label: 'Front' }, { value: 'environment', label: 'Back' }]} />
          </div>
          <div className="list-row list-row--stack">
            <span className="list-row__label"><Timer size={18} aria-hidden /> Timer</span>
            <Segmented<0 | 3 | 10> label="Default timer" value={c.defaultTimer} onChange={(defaultTimer) => updateCamera({ defaultTimer })} options={[{ value: 0, label: 'Off' }, { value: 3, label: '3s' }, { value: 10, label: '10s' }]} />
          </div>
          <div className="list-row list-row--stack">
            <span className="list-row__label"><Layers size={18} aria-hidden /> Pose guide opacity</span>
            <Segmented<number> label="Pose guide opacity" value={c.overlayOpacity} onChange={(overlayOpacity) => updateCamera({ overlayOpacity })} options={[{ value: 0.4, label: 'Subtle' }, { value: 0.7, label: 'Normal' }, { value: 0.95, label: 'Strong' }]} />
          </div>
          <ListRow icon={<Grid3x3 size={18} />} label="Show grid" value={<Toggle label="Show grid" checked={c.showGrid} onChange={(showGrid) => updateCamera({ showGrid })} />} />
        </ListGroup>
        <ListGroup title="Capture" footer="Live tracking detects your body in real time and shows a live match score. It downloads the AI model (~10 MB) the first time.">
          <ListRow icon={<FlipHorizontal size={18} />} label="Mirror front camera photos" value={<Toggle label="Mirror front camera photos" checked={c.mirrorFrontCamera} onChange={(mirrorFrontCamera) => updateCamera({ mirrorFrontCamera })} />} />
          <ListRow icon={<Activity size={18} />} label="Live body tracking" detail="Beta" value={<Toggle label="Live body tracking" checked={c.liveTracking} onChange={(liveTracking) => updateCamera({ liveTracking })} />} />
        </ListGroup>
      </div>
    </main>
  );
}
