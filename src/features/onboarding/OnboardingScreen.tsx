import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Camera, Check, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/Button';
import { PoseArt } from '@/components/PoseArt';
import { PoseFigure } from '@/components/PoseFigure';
import { useCatalogStore } from '@/stores/catalogStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getServices } from '@/services/container';
import './onboarding.css';

const SLIDES = [
  { key: 'discover', title: 'Discover poses', text: 'Dozens of ideas for portraits, couples, travel and more — pick one in seconds.' },
  { key: 'guide', title: 'Follow the visual guide', text: 'A see-through pose overlay sits on your camera so you can match it perfectly.' },
  { key: 'shoot', title: 'Take the shot', text: 'Use the timer, grid and front or back camera. Retake as often as you like.' },
  { key: 'feedback', title: 'Get instant feedback', text: 'AI checks your head, arms, legs and framing, then tells you exactly what to adjust.' },
] as const;

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const complete = useSettingsStore((s) => s.completeOnboarding);
  const poses = useCatalogStore((s) => s.poses);

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };
  const finish = () => {
    complete();
    getServices().analytics.track('onboarding_completed');
    navigate('/', { replace: true });
  };
  const last = index === SLIDES.length - 1;

  return (
    <main className="onboarding">
      <div className="onboarding__top">
        <span className="onboarding__brand">PhotoPose</span>
        {!last && (
          <button className="onboarding__skip" onClick={finish}>
            Skip
          </button>
        )}
      </div>
      <div
        className="onboarding__track"
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {SLIDES.map((s, i) => (
          <section key={s.key} className="onboarding__slide" aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}: ${s.title}`}>
            <div className="onboarding__visual">{visualFor(s.key, poses)}</div>
            <div className="onboarding__copy">
              <span className="t-overline">Step {i + 1}</span>
              <h1 className="t-display">{s.title}</h1>
              <p className="t-body">{s.text}</p>
            </div>
          </section>
        ))}
      </div>
      <div className="onboarding__bottom">
        <div className="dots" role="tablist" aria-label="Onboarding progress">
          {SLIDES.map((s, i) => (
            <button key={s.key} role="tab" aria-selected={i === index} aria-label={`Go to step ${i + 1}`} className={i === index ? 'is-on' : ''} onClick={() => goTo(i)} />
          ))}
        </div>
        <Button block onClick={() => (last ? finish() : goTo(index + 1))} trailingIcon={<ArrowRight size={18} />}>
          {last ? 'Get started' : 'Continue'}
        </Button>
        <p className="onboarding__note">We’ll only ask for camera access when you open the camera.</p>
      </div>
    </main>
  );
}

function visualFor(key: (typeof SLIDES)[number]['key'], poses: ReturnType<typeof useCatalogStore.getState>['poses']) {
  const pick = (id: string) => poses.find((p) => p.id === id) ?? poses[0];
  if (!poses.length) return null;
  switch (key) {
    case 'discover':
      return (
        <div className="ob-fan">
          <PoseArt pose={pick('hands-in-hair')} className="ob-fan__card ob-fan__card--l" />
          <PoseArt pose={pick('power-stance')} className="ob-fan__card ob-fan__card--r" />
          <PoseArt pose={pick('arms-wide-view')} className="ob-fan__card ob-fan__card--c" />
        </div>
      );
    case 'guide':
      return (
        <div className="ob-phone">
          <div className="ob-phone__screen">
            <div className="ob-phone__scene" />
            <PoseFigure figures={pick('contrapposto').figures} variant="overlay" className="ob-phone__overlay" />
            <div className="ob-phone__grid" />
          </div>
        </div>
      );
    case 'shoot':
      return (
        <div className="ob-shoot">
          <div className="ob-shoot__count">3</div>
          <div className="ob-shoot__shutter">
            <Camera size={30} />
          </div>
        </div>
      );
    case 'feedback':
      return (
        <div className="ob-feedback">
          <div className="ob-feedback__score">
            <span>Pose Match</span>
            <strong>86%</strong>
          </div>
          <ul>
            <li className="ok"><Check size={14} /> Head position looks good</li>
            <li className="ok"><Check size={14} /> Shoulder angle looks good</li>
            <li className="warn"><TriangleAlert size={14} /> Raise your right arm slightly</li>
            <li className="ok"><Check size={14} /> Framing looks good</li>
          </ul>
        </div>
      );
  }
}
