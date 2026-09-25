import { useState } from 'react';
import { Bell, BellRing, Sparkles } from 'lucide-react';
import { Button } from '@/components/Button';
import { ListGroup, ListRow, Toggle } from '@/components/Controls';
import { TopBar } from '@/components/TopBar';
import { getServices } from '@/services/container';
import { useSettingsStore } from '@/stores/settingsStore';
import { toast } from '@/stores/toastStore';
import './profile.css';

export default function NotificationsScreen() {
  const { settings, updateNotifications } = useSettingsStore();
  const n = settings.notifications;
  const svc = getServices().notifications;
  const [perm, setPerm] = useState(svc.getPermission());

  const enable = async (on: boolean) => {
    if (!on) return updateNotifications({ enabled: false });
    const p = await svc.requestPermission();
    setPerm(p);
    if (p === 'granted') {
      updateNotifications({ enabled: true });
      await svc.registerForPush();
    } else if (p === 'unsupported') {
      toast('Add PhotoPose to your Home Screen to enable notifications on iPhone.', 'info');
    } else {
      toast('Notifications are blocked. You can enable them in Settings.', 'error');
    }
  };

  return (
    <main className="screen screen--no-tabs settings">
      <TopBar title="Notifications" back />
      <div className="page-pad">
        <ListGroup footer={perm === 'denied' ? 'Notifications are blocked for PhotoPose. Enable them in your device settings.' : undefined}>
          <ListRow icon={<Bell size={18} />} label="Allow notifications" value={<Toggle label="Allow notifications" checked={n.enabled && perm === 'granted'} onChange={enable} />} />
        </ListGroup>
        <ListGroup title="What to send" footer="Push delivery requires the PhotoPose notification server, coming soon.">
          <ListRow icon={<Sparkles size={18} />} label="Daily pose inspiration" value={<Toggle label="Daily pose inspiration" checked={n.dailyInspiration} onChange={(dailyInspiration) => updateNotifications({ dailyInspiration })} />} />
          <ListRow icon={<BellRing size={18} />} label="New poses & collections" value={<Toggle label="New poses" checked={n.newPoses} onChange={(newPoses) => updateNotifications({ newPoses })} />} />
        </ListGroup>
        {perm === 'default' && !n.enabled && (
          <Button block variant="secondary" onClick={() => enable(true)}>Turn on notifications</Button>
        )}
      </div>
    </main>
  );
}
