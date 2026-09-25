import { TopBar } from '@/components/TopBar';
import { appConfig } from '@/config/app.config';
import './profile.css';

const PRIVACY = [
  ['Your photos stay on your device', 'Photos you take in PhotoPose are stored locally on your device. Pose analysis runs on-device using an open-source body-landmark model; your images are not uploaded to our servers.'],
  ['What we store', 'Your favorites, history, settings and profile name are saved in your browser’s local storage on this device. Clearing site data or deleting the app removes them.'],
  ['Analytics', 'If enabled in Settings, we collect anonymous usage events (for example “pose viewed”) to improve the app. Analytics never include photos. You can turn this off at any time.'],
  ['Camera & photos', 'Camera access is only used while the camera screen is open. Sharing or saving a photo happens through your device’s share sheet and only when you choose to.'],
  ['Contact', `Questions? Email ${appConfig.brand.supportEmail}.`],
];

const TERMS = [
  ['Using PhotoPose', 'PhotoPose provides pose ideas and automated feedback for personal photography. Feedback is guidance only and may not always be accurate.'],
  ['Your content', 'You own the photos you take. Only take photos of people who agree to it, and follow local laws and venue rules — always put your safety first.'],
  ['Premium', 'Premium features may require a paid subscription. Prices, trial periods and renewal terms are shown before purchase. During the preview, purchases run in test mode and are free.'],
  ['Changes', 'We may update these terms as the product evolves. Continued use means you accept the latest version.'],
];

export default function LegalScreen({ doc }: { doc: 'privacy' | 'terms' }) {
  const items = doc === 'privacy' ? PRIVACY : TERMS;
  return (
    <main className="screen screen--no-tabs legal">
      <TopBar title={doc === 'privacy' ? 'Privacy' : 'Terms of Use'} back />
      <article className="page-pad legal__body">
        <p className="t-caption">Last updated: September 2026 · Draft for the MVP — review with legal counsel before launch.</p>
        {items.map(([h, p]) => (
          <section key={h}>
            <h2 className="t-headline">{h}</h2>
            <p className="t-body">{p}</p>
          </section>
        ))}
      </article>
    </main>
  );
}
