/**
 * Bundled sample pose library (original content).
 *
 * Each pose is authored with `FigureSpec`s (see skeletonBuilder.ts) and turned
 * into normalized reference skeletons at load time. Real photos can be added
 * later by setting `imageUrl`; the skeleton is still used for the camera
 * overlay and AI comparison.
 */
import type { CameraAngle, Difficulty, Framing, Pose } from '@/models';
import { buildFigures, type FigureSpec, type LimbSpec } from './skeletonBuilder';

// ---- Reusable limb presets -------------------------------------------------
const A = {
  relaxed: { a: 8, b: 3 },
  loose: { a: 14, b: 8 },
  hip: { a: 42, b: -38 },
  pocket: { a: 16, b: -14 },
  up: { a: 170, b: 176 },
  wave: { a: 110, b: 165 },
  side: { a: 88, b: 90 },
  hair: { a: 150, b: -118 },
  chin: { a: -40, b: -172, s1: 0.6 },
  cross: { a: 12, b: -96, s2: 0.9 },
  flex: { a: 90, b: 172 },
  forward: { a: 60, b: 60, s1: 0.6, s2: 0.6 },
  selfie: { a: 115, b: 128, s1: 0.75, s2: 0.7 },
  peace: { a: 28, b: -150 },
  holdCollar: { a: 20, b: -165, s2: 0.8 },
  around: { a: 72, b: 84 },
  shoulder: { a: 80, b: 8 },
  knee: { a: 25, b: -12 },
  behind: { a: 20, b: -30, s2: 0.5 },
} satisfies Record<string, LimbSpec>;

const L = {
  straight: { a: 3, b: 2 },
  wide: { a: 14, b: 12 },
  relaxed: { a: 8, b: -4 },
  cross: { a: -13, b: -7 },
  bentIn: { a: 4, b: -14 },
  step: { a: 18, b: 6 },
  chairFront: { a: 10, b: 3, s1: 0.35 },
  crossLegFloor: { a: 70, b: -72, s1: 0.9 },
  squat: { a: 62, b: -18, s1: 0.8 },
  jumpTuck: { a: 55, b: -40, s1: 0.8 },
} satisfies Record<string, LimbSpec>;

const stand = (over: Partial<FigureSpec> = {}): FigureSpec => ({
  lArm: A.relaxed,
  rArm: A.relaxed,
  lLeg: L.straight,
  rLeg: L.straight,
  ...over,
});

// ---- Pose factory ----------------------------------------------------------
interface PoseDef {
  id: string;
  title: string;
  categoryIds: string[];
  difficulty: Difficulty;
  framing: Framing;
  cameraAngle?: CameraAngle;
  summary: string;
  instructions: string[];
  bodyTips: string[];
  cameraTips: string[];
  tags: string[];
  isPremium?: boolean;
  popularity: number;
  figures: FigureSpec[];
}

const def = (p: PoseDef): Pose => ({
  id: p.id,
  title: p.title,
  categoryIds: p.categoryIds,
  difficulty: p.difficulty,
  framing: p.framing,
  cameraAngle: p.cameraAngle ?? 'eye-level',
  summary: p.summary,
  instructions: p.instructions,
  bodyTips: p.bodyTips,
  cameraTips: p.cameraTips,
  tags: p.tags,
  isPremium: p.isPremium ?? false,
  popularity: p.popularity,
  figures: buildFigures(p.figures, p.framing),
  createdAt: '2026-09-01T00:00:00.000Z',
});

// ---- Library ---------------------------------------------------------------
export const POSES: Pose[] = [
  // PORTRAIT
  def({
    id: 'soft-chin-rest', title: 'Soft Chin Rest', categoryIds: ['portrait', 'sitting'], difficulty: 'easy', framing: 'half',
    summary: 'A thoughtful, relaxed portrait with your hand lightly framing the jaw.',
    instructions: ['Turn your shoulders slightly away from the camera.', 'Bring one hand up so your fingertips rest just under your chin.', 'Keep the other arm relaxed at your side.', 'Tilt your head a touch towards the raised hand and soften your eyes.'],
    bodyTips: ['Don’t press on your face — the hand should barely touch.', 'Keep the wrist relaxed and slightly bent.', 'Drop your shoulders away from your ears.'],
    cameraTips: ['Shoot at eye level or slightly above.', 'Leave a little space above the head.'],
    tags: ['thoughtful', 'soft', 'classic'], popularity: 88,
    figures: [stand({ turn: 0.25, head: 6, look: 0.2, rArm: A.chin })],
  }),
  def({
    id: 'over-the-shoulder', title: 'Over the Shoulder', categoryIds: ['portrait', 'fashion'], difficulty: 'medium', framing: 'half',
    summary: 'Turn away, then look back — an effortless editorial glance.',
    instructions: ['Turn your body about 60° away from the camera.', 'Look back over your nearest shoulder.', 'Lower that shoulder slightly and lift your chin a little.', 'Let both arms hang loosely.'],
    bodyTips: ['Lead with the chin, not the neck, to avoid creases.', 'Keep your back tall.'],
    cameraTips: ['Frame from the waist up.', 'Focus on the eye closest to the camera.'],
    tags: ['glance', 'editorial', 'elegant'], popularity: 92,
    figures: [stand({ turn: 0.75, head: -8, look: -0.8, lArm: A.loose, rArm: A.relaxed })],
  }),
  def({
    id: 'hands-in-hair', title: 'Hands in Hair', categoryIds: ['portrait', 'fashion'], difficulty: 'medium', framing: 'half',
    summary: 'An open, confident portrait with one hand running through your hair.',
    instructions: ['Face the camera with a slight turn of the hips.', 'Lift one hand and slide it back through your hair.', 'Keep the elbow pointing up and out.', 'Tilt your head gently away from the raised arm.'],
    bodyTips: ['Relax your fingers — no fists.', 'Let the lower arm hang naturally.'],
    cameraTips: ['Shoot slightly from below for a confident feel.', 'Use soft side light.'],
    tags: ['confident', 'open', 'summer'], popularity: 81,
    figures: [stand({ turn: 0.15, head: -8, lArm: A.hair, rArm: A.relaxed })],
  }),
  def({
    id: 'classic-headshot', title: 'Classic Headshot', categoryIds: ['portrait'], difficulty: 'easy', framing: 'closeup',
    summary: 'The go-to professional headshot: angled shoulders, face to camera.',
    instructions: ['Angle your shoulders about 30° away from the lens.', 'Turn your face back towards the camera.', 'Push your forehead slightly forward and down.', 'Smile with your eyes.'],
    bodyTips: ['Sit or stand tall.', 'Keep your chin parallel to the floor.'],
    cameraTips: ['Lens at eye height.', 'Crop mid-chest, never at the neck.'],
    tags: ['linkedin', 'professional', 'headshot'], popularity: 95,
    figures: [stand({ turn: 0.35, head: 3, look: 0.15 })],
  }),

  // COUPLE
  def({
    id: 'forehead-touch', title: 'Forehead Touch', categoryIds: ['couple', 'wedding'], difficulty: 'easy', framing: 'half',
    summary: 'Close, calm and intimate — lean in until your foreheads meet.',
    instructions: ['Stand facing each other, a small step apart.', 'Both lean in from the waist.', 'Gently touch foreheads and close your eyes.', 'Rest hands on each other’s waist or arms.'],
    bodyTips: ['Keep chins slightly down.', 'Breathe out and relax the shoulders.'],
    cameraTips: ['Shoot in profile to see both faces.', 'Backlight creates a soft glow.'],
    tags: ['intimate', 'romantic', 'calm'], popularity: 90,
    figures: [
      stand({ x: -0.13, turn: 0.8, lean: 8, head: 8, lArm: A.around }),
      stand({ x: 0.13, turn: 0.8, lean: -8, head: -8, rArm: A.around }),
    ],
  }),
  def({
    id: 'hand-in-hand-walk', title: 'Hand-in-Hand Walk', categoryIds: ['couple', 'travel', 'full-body'], difficulty: 'easy', framing: 'full',
    summary: 'A candid walk towards the camera, holding hands.',
    instructions: ['Hold hands and walk slowly towards the camera.', 'Take natural, slightly shorter steps.', 'Look at each other, then back at the lens.', 'Repeat a few times — the best frame is mid-step.'],
    bodyTips: ['Swing your free arm gently.', 'Keep your posture tall.'],
    cameraTips: ['Use burst or the timer.', 'Shoot from a low angle to add height.'],
    tags: ['candid', 'movement', 'lifestyle'], popularity: 86,
    figures: [
      stand({ x: -0.18, lArm: { a: 26, b: 20 }, rArm: A.loose, lLeg: L.step, rLeg: L.bentIn, head: 6 }),
      stand({ x: 0.18, rArm: { a: 26, b: 20 }, lArm: A.loose, rLeg: L.step, lLeg: L.bentIn, head: -6 }),
    ],
  }),
  def({
    id: 'back-hug', title: 'Back Hug', categoryIds: ['couple'], difficulty: 'easy', framing: 'half',
    summary: 'One partner hugs from behind — warm and relaxed.',
    instructions: ['Partner A faces the camera.', 'Partner B stands behind and wraps both arms around A’s waist.', 'B rests their chin near A’s shoulder.', 'A places hands over B’s arms.'],
    bodyTips: ['Stay close — no gap between bodies.', 'Tilt heads towards each other.'],
    cameraTips: ['Frame from the hips up.', 'Shoot at eye level.'],
    tags: ['cozy', 'sweet', 'hug'], popularity: 84,
    figures: [
      stand({ x: 0.06, y: -0.02, scale: 1.04, head: -12, lArm: A.cross, rArm: A.cross }),
      stand({ x: 0, head: 6, lArm: { a: 18, b: -70 }, rArm: { a: 18, b: -70 } }),
    ],
  }),
  def({
    id: 'shoulder-lean', title: 'Shoulder Lean', categoryIds: ['couple', 'standing'], difficulty: 'easy', framing: 'half',
    summary: 'Side by side, one head resting on the other’s shoulder.',
    instructions: ['Stand side by side, shoulders touching.', 'The shorter partner leans their head onto the other’s shoulder.', 'The taller partner tilts their head in slightly.', 'Link arms or put an arm around each other.'],
    bodyTips: ['Relax the neck — let the head rest.', 'Keep both faces visible.'],
    cameraTips: ['Frame from the waist up.', 'Centre the pair in the frame.'],
    tags: ['friendly', 'cute', 'simple'], popularity: 79,
    figures: [
      stand({ x: -0.12, lean: 5, head: 22, lArm: A.shoulder }),
      stand({ x: 0.14, y: -0.03, scale: 1.05, head: -6 }),
    ],
  }),

  // FASHION
  def({
    id: 'power-stance', title: 'Power Stance', categoryIds: ['fashion', 'standing', 'full-body'], difficulty: 'easy', framing: 'full',
    summary: 'Wide stance, hands on hips — pure confidence.',
    instructions: ['Stand with feet wider than your hips.', 'Place both hands on your hips, elbows out.', 'Lift your chin slightly.', 'Look straight into the lens.'],
    bodyTips: ['Keep weight evenly on both feet.', 'Pull shoulders back and down.'],
    cameraTips: ['Shoot from low (knee height) for impact.', 'Leave space above the head.'],
    tags: ['bold', 'strong', 'editorial'], popularity: 87,
    figures: [stand({ lArm: A.hip, rArm: A.hip, lLeg: L.wide, rLeg: L.wide })],
  }),
  def({
    id: 'collar-pop', title: 'Collar Grab', categoryIds: ['fashion', 'street'], difficulty: 'medium', framing: 'half',
    summary: 'Hands on your jacket collar with a slight lean.',
    instructions: ['Grab the edges of your collar or jacket with both hands.', 'Lean your shoulders slightly to one side.', 'Drop your chin a little and look into the lens.'],
    bodyTips: ['Elbows close to the body.', 'Keep the grip loose.'],
    cameraTips: ['Frame from the waist up.', 'Try a slightly high angle.'],
    tags: ['jacket', 'cool', 'outfit'], popularity: 72,
    figures: [stand({ lean: 5, head: -4, lArm: A.holdCollar, rArm: A.holdCollar })],
  }),
  def({
    id: 'the-model-walk', title: 'Runway Step', categoryIds: ['fashion', 'full-body', 'street'], difficulty: 'medium', framing: 'full',
    summary: 'Mid-stride runway step, one foot crossing in front.',
    instructions: ['Walk towards the camera placing one foot in front of the other.', 'Let your arms swing slightly.', 'Keep your gaze steady just past the lens.', 'Capture the moment your front foot lands.'],
    bodyTips: ['Lead from the hips.', 'Relax your hands.'],
    cameraTips: ['Shoot from hip height.', 'Use burst to catch the step.'],
    tags: ['runway', 'movement', 'outfit'], isPremium: true, popularity: 76,
    figures: [stand({ lArm: { a: 16, b: 4 }, rArm: { a: 4, b: -6 }, lLeg: L.cross, rLeg: L.relaxed })],
  }),
  def({
    id: 'wall-lean', title: 'Wall Lean', categoryIds: ['fashion', 'street', 'standing'], difficulty: 'easy', framing: 'full',
    summary: 'Lean casually against a wall with legs crossed.',
    instructions: ['Lean one shoulder against a wall.', 'Cross the outside leg over the inside leg.', 'Put one hand in your pocket.', 'Look off to the side, then back at the camera.'],
    bodyTips: ['Let the wall hold your weight.', 'Keep a little space between arm and body.'],
    cameraTips: ['Use the wall as a leading line.', 'Shoot at chest height.'],
    tags: ['casual', 'urban', 'relaxed'], popularity: 83,
    figures: [stand({ lean: 8, turn: 0.3, head: -6, rArm: A.pocket, lArm: A.loose, lLeg: L.straight, rLeg: { a: -18, b: -8 } })],
  }),

  // FITNESS
  def({
    id: 'double-bicep', title: 'Double Bicep', categoryIds: ['fitness', 'standing'], difficulty: 'easy', framing: 'half',
    summary: 'The classic flex: both arms up, biceps tight.',
    instructions: ['Raise both upper arms to shoulder height.', 'Bend your elbows so fists point up.', 'Squeeze your biceps and brace your core.', 'Keep your chin level.'],
    bodyTips: ['Don’t shrug — shoulders stay down.', 'Breathe out as you flex.'],
    cameraTips: ['Side light shows muscle definition.', 'Frame from the hips up.'],
    tags: ['gym', 'strength', 'flex'], popularity: 78,
    figures: [stand({ lArm: A.flex, rArm: A.flex, lLeg: L.wide, rLeg: L.wide })],
  }),
  def({
    id: 'deep-squat', title: 'Deep Squat Hold', categoryIds: ['fitness', 'full-body'], difficulty: 'medium', framing: 'full',
    summary: 'Low squat with arms forward — strong and grounded.',
    instructions: ['Stand with feet shoulder-width apart.', 'Sit back and down until thighs are near parallel.', 'Extend arms forward for balance.', 'Keep your chest up and look at the camera.'],
    bodyTips: ['Knees track over toes.', 'Heels stay on the ground.'],
    cameraTips: ['Shoot from a low, front angle.', 'Leave room around the knees.'],
    tags: ['legs', 'workout', 'strength'], popularity: 64,
    figures: [stand({ torso: 0.95, lArm: A.forward, rArm: A.forward, lLeg: L.squat, rLeg: L.squat })],
  }),
  def({
    id: 'side-lunge', title: 'Warrior Lunge', categoryIds: ['fitness', 'full-body'], difficulty: 'medium', framing: 'full',
    summary: 'Wide lunge with arms extended — balanced and dynamic.',
    instructions: ['Step your feet wide apart.', 'Bend your front knee to about 90°.', 'Extend both arms out at shoulder height.', 'Gaze over your front hand.'],
    bodyTips: ['Back leg stays straight.', 'Keep the torso upright.'],
    cameraTips: ['Shoot from the side for the full line.', 'Use a wide frame.'],
    tags: ['yoga', 'balance', 'stretch'], isPremium: true, popularity: 70,
    figures: [stand({ turn: 0.2, head: 8, look: 0.8, lArm: A.side, rArm: A.side, lLeg: { a: 55, b: 5 }, rLeg: { a: 30, b: 32 } })],
  }),
  def({
    id: 'arms-crossed-athlete', title: 'Athlete Arms Crossed', categoryIds: ['fitness', 'portrait'], difficulty: 'easy', framing: 'half',
    summary: 'Arms crossed, chin up — a confident post-workout look.',
    instructions: ['Stand tall and cross your arms high on the chest.', 'Tuck your hands so biceps look fuller.', 'Turn slightly and lift your chin.'],
    bodyTips: ['Keep shoulders relaxed.', 'Engage your core.'],
    cameraTips: ['Shoot from slightly below.', 'Hard light works well here.'],
    tags: ['gym', 'confident', 'portrait'], popularity: 75,
    figures: [stand({ turn: 0.2, head: -3, lArm: A.cross, rArm: A.cross })],
  }),

  // TRAVEL
  def({
    id: 'arms-wide-view', title: 'Arms Wide Open', categoryIds: ['travel', 'full-body'], difficulty: 'easy', framing: 'full',
    summary: 'Celebrate the view with your arms stretched wide.',
    instructions: ['Stand with the view behind you.', 'Open both arms wide and slightly up.', 'Lift your chin and smile.', 'Try it facing the view too.'],
    bodyTips: ['Fingers relaxed, not stiff.', 'Weight on one leg for a natural line.'],
    cameraTips: ['Place yourself on a third line.', 'Include lots of scenery.'],
    tags: ['freedom', 'landscape', 'joy'], popularity: 91,
    figures: [stand({ head: -4, lArm: { a: 120, b: 125 }, rArm: { a: 120, b: 125 }, lLeg: L.relaxed })],
  }),
  def({
    id: 'looking-away', title: 'Looking at the View', categoryIds: ['travel', 'standing'], difficulty: 'easy', framing: 'full',
    summary: 'Turned towards the scenery, candid and calm.',
    instructions: ['Turn your body towards the view.', 'Rest your hands in your pockets or on a railing.', 'Look into the distance.', 'Stay still for a moment.'],
    bodyTips: ['Shift weight to your back leg.', 'Relax your shoulders.'],
    cameraTips: ['Shoot from behind at a 45° angle.', 'Keep the horizon straight.'],
    tags: ['candid', 'scenery', 'calm'], popularity: 80,
    figures: [stand({ turn: 0.85, look: 1, lArm: A.pocket, rArm: A.pocket, rLeg: L.bentIn })],
  }),
  def({
    id: 'wave-hello', title: 'Hello Wave', categoryIds: ['travel', 'selfie'], difficulty: 'easy', framing: 'half',
    summary: 'A cheerful wave — perfect for landmarks.',
    instructions: ['Face the camera with a big smile.', 'Raise one hand in a wave near head height.', 'Keep the other arm relaxed.'],
    bodyTips: ['Open palm towards the camera.', 'Don’t cover your face.'],
    cameraTips: ['Put the landmark behind your raised hand.', 'Shoot at eye level.'],
    tags: ['fun', 'happy', 'landmark'], popularity: 69,
    figures: [stand({ head: 4, lArm: A.wave })],
  }),
  def({
    id: 'sitting-edge', title: 'Sitting on the Edge', categoryIds: ['travel', 'sitting'], difficulty: 'medium', framing: 'full',
    summary: 'Sit on a ledge or wall, legs dangling, hands beside you.',
    instructions: ['Sit on a safe edge or wall.', 'Let your legs hang, one slightly forward.', 'Place hands beside your hips.', 'Look out at the view.'],
    bodyTips: ['Sit on the front of your hips for a tall back.', 'Point your toes slightly.'],
    cameraTips: ['Shoot from a bit lower than you.', 'Always prioritise safety.'],
    tags: ['relaxed', 'scenery', 'ledge'], isPremium: true, popularity: 67,
    figures: [stand({ lArm: { a: 18, b: 6 }, rArm: { a: 18, b: 6 }, lLeg: { a: 12, b: 4, s1: 0.35 }, rLeg: { a: 8, b: -6, s1: 0.35 } })],
  }),

  // WEDDING (premium)
  def({
    id: 'veil-moment', title: 'Almost Kiss', categoryIds: ['wedding', 'couple'], difficulty: 'medium', framing: 'half', isPremium: true,
    summary: 'Noses nearly touching — the second before the kiss.',
    instructions: ['Face each other and hold hands or waists.', 'Lean in until your noses almost touch.', 'Close your eyes and hold.'],
    bodyTips: ['Keep a tiny gap for tension.', 'Relax your jaw.'],
    cameraTips: ['Profile angle shows both faces.', 'Shoot at golden hour.'],
    tags: ['romantic', 'kiss', 'ceremony'], popularity: 85,
    figures: [
      stand({ x: -0.12, turn: 0.9, lean: 6, head: 6, lArm: { a: 40, b: 70 } }),
      stand({ x: 0.12, turn: 0.9, lean: -6, head: -4, rArm: { a: 40, b: 70 } }),
    ],
  }),
  def({
    id: 'bouquet-glance', title: 'Bouquet Glance', categoryIds: ['wedding', 'portrait'], difficulty: 'easy', framing: 'half', isPremium: true,
    summary: 'Hold the bouquet low and glance down softly.',
    instructions: ['Hold the bouquet with both hands at your hip line.', 'Turn your body 45° away.', 'Glance down at the flowers, then up.'],
    bodyTips: ['Elbows slightly away from the waist.', 'Keep the bouquet low so the dress shows.'],
    cameraTips: ['Frame from the waist up.', 'Use soft window light.'],
    tags: ['bride', 'flowers', 'elegant'], popularity: 74,
    figures: [stand({ turn: 0.5, head: 12, look: 0.4, lArm: { a: 22, b: -60 }, rArm: { a: 22, b: -60 } })],
  }),
  def({
    id: 'wedding-walk', title: 'Newlywed Walk', categoryIds: ['wedding', 'couple', 'full-body'], difficulty: 'easy', framing: 'full', isPremium: true,
    summary: 'Walk together, one hand raised in celebration.',
    instructions: ['Hold hands and walk towards the camera.', 'Raise your free hands in celebration.', 'Laugh and look at each other.'],
    bodyTips: ['Keep steps small and slow.', 'Let the moment be real.'],
    cameraTips: ['Shoot in burst mode.', 'Low angle adds drama.'],
    tags: ['celebration', 'joy', 'aisle'], popularity: 72,
    figures: [
      stand({ x: -0.18, lArm: { a: 26, b: 20 }, rArm: A.wave, lLeg: L.step, rLeg: L.bentIn }),
      stand({ x: 0.18, rArm: { a: 26, b: 20 }, lArm: A.wave, rLeg: L.step, lLeg: L.bentIn }),
    ],
  }),
  def({
    id: 'forehead-kiss', title: 'Forehead Kiss', categoryIds: ['wedding', 'couple'], difficulty: 'easy', framing: 'half', isPremium: true,
    summary: 'A gentle forehead kiss, eyes closed.',
    instructions: ['Stand close, facing each other.', 'The taller partner kisses the other’s forehead.', 'The other partner closes their eyes and smiles.'],
    bodyTips: ['Hands on the chest or waist.', 'Stay relaxed.'],
    cameraTips: ['Profile angle.', 'Tight crop feels intimate.'],
    tags: ['tender', 'romantic'], popularity: 70,
    figures: [
      stand({ x: -0.12, turn: 0.85, head: 8, lArm: { a: 30, b: -40 } }),
      stand({ x: 0.13, y: -0.05, scale: 1.06, turn: 0.85, lean: -6, head: -20, rArm: A.around }),
    ],
  }),

  // STREET
  def({
    id: 'crosswalk-stride', title: 'Crosswalk Stride', categoryIds: ['street', 'full-body'], difficulty: 'medium', framing: 'full',
    summary: 'Confident mid-stride walk across the street.',
    instructions: ['Walk across (safely!) with long strides.', 'Swing your arms naturally.', 'Look ahead, not at the camera.'],
    bodyTips: ['Lead with your chest.', 'Loose hands.'],
    cameraTips: ['Shoot from low and in front.', 'Use burst mode.'],
    tags: ['walking', 'city', 'candid'], popularity: 77,
    figures: [stand({ turn: 0.9, lArm: { a: 25, b: 35 }, rArm: { a: -20, b: -10 }, lLeg: { a: 24, b: 10 }, rLeg: { a: -18, b: -36 } })],
  }),
  def({
    id: 'hands-in-pockets', title: 'Hands in Pockets', categoryIds: ['street', 'standing'], difficulty: 'easy', framing: 'full',
    summary: 'Effortless cool: both hands in pockets, weight on one leg.',
    instructions: ['Put both hands in your front pockets, thumbs out.', 'Shift weight to one leg.', 'Bend the other knee slightly.', 'Look just off camera.'],
    bodyTips: ['Keep elbows away from your body.', 'Relax your face.'],
    cameraTips: ['Shoot at chest height.', 'Use lines in the background.'],
    tags: ['casual', 'cool', 'simple'], popularity: 89,
    figures: [stand({ lean: -3, head: 4, look: 0.3, lArm: A.pocket, rArm: A.pocket, lLeg: L.bentIn })],
  }),
  def({
    id: 'stair-sit', title: 'Stair Sit', categoryIds: ['street', 'sitting'], difficulty: 'easy', framing: 'full',
    summary: 'Sit on steps with elbows on your knees.',
    instructions: ['Sit on a step with feet on a lower step.', 'Rest your elbows on your knees.', 'Clasp your hands loosely.', 'Lean slightly forward.'],
    bodyTips: ['Keep your back long.', 'Knees apart for a relaxed look.'],
    cameraTips: ['Shoot straight on at eye level.', 'Stairs make great leading lines.'],
    tags: ['steps', 'relaxed', 'urban'], popularity: 73,
    figures: [stand({ torso: 0.9, lean: 0, lArm: A.knee, rArm: A.knee, lLeg: { a: 30, b: 4, s1: 0.45 }, rLeg: { a: 30, b: 4, s1: 0.45 } })],
  }),
  def({
    id: 'look-back-street', title: 'Look Back', categoryIds: ['street', 'fashion'], difficulty: 'medium', framing: 'full', isPremium: true,
    summary: 'Walk away and glance back over your shoulder.',
    instructions: ['Walk away from the camera.', 'Mid-step, turn your head back to the lens.', 'Keep your body moving forward.'],
    bodyTips: ['Turn from the shoulders slightly.', 'Keep your chin lifted.'],
    cameraTips: ['Shoot from behind at hip height.', 'Burst mode helps.'],
    tags: ['motion', 'glance', 'city'], popularity: 71,
    figures: [stand({ turn: 0.7, look: -1, head: -6, lLeg: L.relaxed, rLeg: L.step, lArm: A.loose })],
  }),

  // SITTING
  def({
    id: 'chair-lean', title: 'Chair Lean', categoryIds: ['sitting', 'portrait'], difficulty: 'easy', framing: 'full',
    summary: 'Seated with one elbow on your knee, leaning in.',
    instructions: ['Sit on the front half of a chair.', 'Rest one forearm on your knee.', 'Lean slightly forward from the hips.', 'Look straight into the lens.'],
    bodyTips: ['Straight back, not slouched.', 'Feet flat on the ground.'],
    cameraTips: ['Shoot at seated eye level.', 'Include the chair edges.'],
    tags: ['chair', 'relaxed', 'business'], popularity: 76,
    figures: [stand({ lean: 4, lArm: A.knee, rArm: A.relaxed, lLeg: L.chairFront, rLeg: L.chairFront })],
  }),
  def({
    id: 'cross-legged', title: 'Cross-Legged Floor', categoryIds: ['sitting'], difficulty: 'easy', framing: 'full',
    summary: 'Seated on the floor, legs crossed, hands on knees.',
    instructions: ['Sit on the floor and cross your legs.', 'Rest your hands on your knees.', 'Sit tall and relax your shoulders.'],
    bodyTips: ['Lift through the top of your head.', 'Soft smile.'],
    cameraTips: ['Shoot from slightly above.', 'Clean background.'],
    tags: ['floor', 'calm', 'yoga'], popularity: 62,
    figures: [stand({ lArm: { a: 30, b: 10 }, rArm: { a: 30, b: 10 }, lLeg: L.crossLegFloor, rLeg: L.crossLegFloor })],
  }),
  def({
    id: 'knees-up', title: 'Knees Up', categoryIds: ['sitting', 'travel'], difficulty: 'easy', framing: 'full',
    summary: 'Sit side-on with knees up and arms around them.',
    instructions: ['Sit side-on to the camera.', 'Bring your knees up.', 'Wrap your arms loosely around your legs.', 'Turn your face to the camera.'],
    bodyTips: ['Rest your chin lightly if you like.', 'Keep the back rounded softly.'],
    cameraTips: ['Shoot in profile.', 'Great on beaches or grass.'],
    tags: ['cozy', 'beach', 'relaxed'], popularity: 68,
    figures: [stand({ turn: 1, lean: 12, look: 0.7, lArm: { a: 70, b: 80 }, rArm: { a: -70, b: -80 }, lLeg: { a: 118, b: 22 }, rLeg: { a: -115, b: -20 } })],
  }),
  def({
    id: 'side-chair', title: 'Side-Saddle Chair', categoryIds: ['sitting', 'fashion'], difficulty: 'medium', framing: 'full', isPremium: true,
    summary: 'Sit sideways on a chair, arm over the backrest.',
    instructions: ['Sit sideways on the chair.', 'Rest one arm over the backrest.', 'Cross your legs at the knee.', 'Turn your face to the camera.'],
    bodyTips: ['Sit tall.', 'Point the top foot.'],
    cameraTips: ['Shoot at seated eye level.', 'Minimal background.'],
    tags: ['chair', 'editorial', 'elegant'], popularity: 63,
    figures: [stand({ turn: 0.8, look: -0.6, lArm: { a: 80, b: 10 }, rArm: A.relaxed, lLeg: { a: 88, b: 2 }, rLeg: { a: -82, b: -6 } })],
  }),

  // STANDING
  def({
    id: 'contrapposto', title: 'Weight Shift', categoryIds: ['standing', 'portrait', 'full-body'], difficulty: 'easy', framing: 'full',
    summary: 'Classic S-curve: weight on one leg, other knee relaxed.',
    instructions: ['Put your weight on your back leg.', 'Relax the other knee slightly inward.', 'Let your hips tilt naturally.', 'One hand on the hip, one relaxed.'],
    bodyTips: ['Shoulders tilt opposite to the hips.', 'Keep it subtle.'],
    cameraTips: ['Shoot from waist height.', 'Full body with space at feet.'],
    tags: ['classic', 'natural', 'flattering'], popularity: 93,
    figures: [stand({ lean: -3, head: 5, lArm: A.hip, rArm: A.relaxed, lLeg: L.bentIn, rLeg: L.straight })],
  }),
  def({
    id: 'arms-crossed-smile', title: 'Arms Crossed Smile', categoryIds: ['standing', 'portrait'], difficulty: 'easy', framing: 'half',
    summary: 'Friendly and approachable, arms lightly crossed.',
    instructions: ['Cross your arms loosely.', 'Turn your body a little.', 'Smile naturally — think of something funny.'],
    bodyTips: ['Don’t squeeze the arms tight.', 'Relax your shoulders.'],
    cameraTips: ['Eye level.', 'Frame from the hips up.'],
    tags: ['friendly', 'business', 'simple'], popularity: 82,
    figures: [stand({ turn: 0.25, head: 4, lArm: A.cross, rArm: A.cross })],
  }),
  def({
    id: 'one-hand-hip', title: 'One Hand on Hip', categoryIds: ['standing', 'fashion'], difficulty: 'easy', framing: 'full',
    summary: 'A single hand on the hip creates shape and space.',
    instructions: ['Place one hand on your hip.', 'Push the elbow slightly back.', 'Cross the opposite leg lightly in front.'],
    bodyTips: ['Keep space between arm and waist.', 'Chin forward and down.'],
    cameraTips: ['Shoot from hip height.', 'Vertical frame.'],
    tags: ['shape', 'outfit', 'classic'], popularity: 85,
    figures: [stand({ lean: 2, lArm: A.hip, rArm: A.loose, rLeg: { a: -10, b: -6 } })],
  }),
  def({
    id: 'jacket-over-shoulder', title: 'Jacket Over Shoulder', categoryIds: ['standing', 'fashion', 'street'], difficulty: 'medium', framing: 'full', isPremium: true,
    summary: 'Hold a jacket over your shoulder with one hand.',
    instructions: ['Hook your jacket on a finger.', 'Hang it over your shoulder.', 'Other hand in the pocket.', 'Walk a step towards the camera.'],
    bodyTips: ['Elbow points forward and up.', 'Relaxed smile.'],
    cameraTips: ['Shoot from low.', 'Street backgrounds work great.'],
    tags: ['cool', 'outfit', 'jacket'], popularity: 66,
    figures: [stand({ lArm: { a: 150, b: -140, s2: 0.8 }, rArm: A.pocket, lLeg: L.relaxed })],
  }),

  // FULL BODY
  def({
    id: 'jump-shot', title: 'Jump for Joy', categoryIds: ['full-body', 'travel', 'group'], difficulty: 'hard', framing: 'full',
    summary: 'Mid-air jump with arms up and knees tucked.',
    instructions: ['Count down from three.', 'Jump with arms up high.', 'Tuck your knees at the top.', 'Smile!'],
    bodyTips: ['Point your toes.', 'Keep your face relaxed mid-air.'],
    cameraTips: ['Use burst or a fast shutter.', 'Shoot from low for extra height.'],
    tags: ['fun', 'energy', 'action'], popularity: 78,
    figures: [stand({ lArm: A.up, rArm: A.up, lLeg: L.jumpTuck, rLeg: L.jumpTuck })],
  }),
  def({
    id: 'star-pose', title: 'Star Pose', categoryIds: ['full-body', 'fitness'], difficulty: 'easy', framing: 'full',
    summary: 'Arms and legs wide in a big X shape.',
    instructions: ['Stand with feet wide.', 'Reach both arms up and out.', 'Open your chest.', 'Look up or into the lens.'],
    bodyTips: ['Stretch through your fingertips.', 'Engage your core.'],
    cameraTips: ['Centre yourself in the frame.', 'Great against the sky.'],
    tags: ['energy', 'celebrate', 'open'], popularity: 65,
    figures: [stand({ lArm: { a: 135, b: 135 }, rArm: { a: 135, b: 135 }, lLeg: { a: 22, b: 22 }, rLeg: { a: 22, b: 22 } })],
  }),
  def({
    id: 'crossed-legs-lean', title: 'Leg Cross Stance', categoryIds: ['full-body', 'fashion'], difficulty: 'easy', framing: 'full',
    summary: 'Standing with legs crossed at the ankles, hands relaxed.',
    instructions: ['Cross one foot in front of the other.', 'Keep the weight on the back leg.', 'Let your arms hang or hold a bag.'],
    bodyTips: ['Knees soft.', 'Tall spine.'],
    cameraTips: ['Shoot from knee height.', 'Show the full outfit.'],
    tags: ['outfit', 'elegant'], popularity: 71,
    figures: [stand({ lean: 3, head: 5, lArm: A.loose, rArm: A.pocket, lLeg: L.cross, rLeg: L.straight })],
  }),
  def({
    id: 'kneel-one', title: 'One-Knee Kneel', categoryIds: ['full-body', 'fashion'], difficulty: 'medium', framing: 'full', isPremium: true,
    summary: 'Down on one knee, forearm resting on the raised knee.',
    instructions: ['Kneel on one knee.', 'Rest your forearm on the raised knee.', 'Keep your chest lifted.', 'Look straight at the camera.'],
    bodyTips: ['Back straight.', 'Front shin vertical.'],
    cameraTips: ['Shoot from kneeling height.', 'Leave space around the body.'],
    tags: ['strong', 'editorial', 'low'], popularity: 60,
    figures: [stand({ turn: 0.6, lArm: { a: 40, b: 70 }, rArm: A.relaxed, lLeg: { a: 88, b: 2 }, rLeg: { a: 6, b: 88 } })],
  }),

  // SELFIE
  def({
    id: 'high-angle-selfie', title: 'High Angle Selfie', categoryIds: ['selfie', 'portrait'], difficulty: 'easy', framing: 'closeup', cameraAngle: 'high',
    summary: 'Phone slightly above eye level, chin forward.',
    instructions: ['Hold the phone at arm’s length, slightly above your eyes.', 'Push your chin forward and a touch down.', 'Look into the lens, not the screen.'],
    bodyTips: ['Relax your shoulders.', 'Smile with your eyes.'],
    cameraTips: ['Face a window for soft light.', 'Use the timer to avoid shake.'],
    tags: ['selfie', 'flattering', 'quick'], popularity: 94,
    figures: [stand({ head: 6, lArm: A.selfie })],
  }),
  def({
    id: 'peace-selfie', title: 'Peace Sign', categoryIds: ['selfie'], difficulty: 'easy', framing: 'half',
    summary: 'A playful peace sign next to your face.',
    instructions: ['Hold the phone with one hand.', 'Bring the other hand up beside your face.', 'Make a peace sign and tilt your head.'],
    bodyTips: ['Keep the hand below eye level.', 'Tilt towards the hand.'],
    cameraTips: ['Use the front camera timer.', 'Keep the background simple.'],
    tags: ['playful', 'fun'], popularity: 74,
    figures: [stand({ head: -10, lArm: A.selfie, rArm: A.peace })],
  }),
  def({
    id: 'mirror-selfie', title: 'Mirror Outfit Selfie', categoryIds: ['selfie', 'fashion', 'full-body'], difficulty: 'easy', framing: 'full',
    summary: 'Full-length mirror shot with a hand on the hip.',
    instructions: ['Hold the phone at chest height in front of you.', 'Place your free hand on your hip.', 'Pop one knee inward.'],
    bodyTips: ['Stand at a slight angle to the mirror.', 'Keep the phone off your face.'],
    cameraTips: ['Clean the mirror!', 'Use the back camera.'],
    tags: ['outfit', 'ootd', 'mirror'], popularity: 88,
    figures: [stand({ turn: 0.25, lArm: { a: 20, b: -140, s2: 0.8 }, rArm: A.hip, lLeg: L.bentIn })],
  }),
  def({
    id: 'chin-down-selfie', title: 'Chin Down Glance', categoryIds: ['selfie', 'portrait'], difficulty: 'medium', framing: 'closeup', isPremium: true,
    summary: 'Chin slightly lowered, eyes up — moody and striking.',
    instructions: ['Hold the phone at eye level.', 'Lower your chin a little.', 'Look up into the lens.', 'Relax your mouth.'],
    bodyTips: ['Turn your face 15° to one side.', 'Keep eyes wide, not squinting.'],
    cameraTips: ['Side light adds mood.', 'Tight crop.'],
    tags: ['moody', 'eyes'], popularity: 69,
    figures: [stand({ turn: 0.2, head: 4, look: 0.3, lArm: A.selfie })],
  }),

  // GROUP
  def({
    id: 'arm-in-arm-trio', title: 'Arm-in-Arm Trio', categoryIds: ['group', 'standing'], difficulty: 'easy', framing: 'full',
    summary: 'Three friends side by side, arms around shoulders.',
    instructions: ['Stand close in a line.', 'Put your arms around each other’s shoulders.', 'Lean the outer people slightly inward.', 'Everyone looks at the camera.'],
    bodyTips: ['Stagger heights if possible.', 'Keep faces unblocked.'],
    cameraTips: ['Shoot from chest height.', 'Leave space on the sides.'],
    tags: ['friends', 'squad', 'classic'], popularity: 84,
    figures: [
      stand({ x: -0.36, lean: 4, head: 6, lArm: A.shoulder }),
      stand({ x: 0, y: -0.02, lArm: A.shoulder, rArm: A.shoulder }),
      stand({ x: 0.36, lean: -4, head: -6, rArm: A.shoulder }),
    ],
  }),
  def({
    id: 'group-jump', title: 'Group Jump', categoryIds: ['group', 'full-body'], difficulty: 'hard', framing: 'full',
    summary: 'Everyone jumps at the same moment.',
    instructions: ['Stand in a row with space between you.', 'Count down together.', 'Jump with arms up.', 'Repeat until everyone is in the air!'],
    bodyTips: ['Commit to the jump.', 'Big smiles.'],
    cameraTips: ['Burst mode is essential.', 'Low angle.'],
    tags: ['fun', 'energy', 'friends'], popularity: 70,
    figures: [
      stand({ x: -0.4, y: -0.05, lArm: A.up, rArm: A.up, lLeg: L.jumpTuck, rLeg: L.jumpTuck }),
      stand({ x: 0, lArm: { a: 135, b: 140 }, rArm: { a: 135, b: 140 }, lLeg: L.wide, rLeg: L.wide }),
      stand({ x: 0.4, y: -0.08, lArm: A.up, rArm: A.wave, lLeg: L.jumpTuck, rLeg: L.jumpTuck }),
    ],
  }),
  def({
    id: 'staggered-group', title: 'Staggered Heights', categoryIds: ['group', 'portrait'], difficulty: 'medium', framing: 'half', isPremium: true,
    summary: 'Heads at different heights for a dynamic group portrait.',
    instructions: ['Arrange people so no two heads are level.', 'Lean in towards the centre.', 'Turn shoulders slightly towards the middle.'],
    bodyTips: ['Shorter people in front.', 'Hands on shoulders or waists.'],
    cameraTips: ['Frame from the waist up.', 'Focus on the nearest eyes.'],
    tags: ['team', 'portrait'], popularity: 63,
    figures: [
      stand({ x: -0.3, y: 0.06, turn: 0.3, head: 8 }),
      stand({ x: 0, y: -0.06, scale: 1.05 }),
      stand({ x: 0.3, y: 0.02, turn: 0.3, head: -8, rArm: A.hip }),
    ],
  }),
  def({
    id: 'duo-back-to-back', title: 'Back to Back', categoryIds: ['group', 'couple', 'fashion'], difficulty: 'easy', framing: 'full',
    summary: 'Two people back to back, arms crossed.',
    instructions: ['Stand back to back.', 'Cross your arms.', 'Turn your faces towards the camera.'],
    bodyTips: ['Lean lightly into each other.', 'Stand tall.'],
    cameraTips: ['Shoot straight on.', 'Symmetry looks great.'],
    tags: ['duo', 'bold', 'friends'], popularity: 75,
    figures: [
      stand({ x: -0.12, turn: 0.8, look: 0.9, lArm: A.cross, rArm: A.cross }),
      stand({ x: 0.12, turn: 0.8, look: -0.9, lArm: A.cross, rArm: A.cross }),
    ],
  }),
];

/** Canonical "neutral" upright pose used for free camera mode (no pose selected). */
export const FREE_POSE: Pose = def({
  id: 'free', title: 'Free Pose', categoryIds: [], difficulty: 'easy', framing: 'full',
  summary: 'Shoot freely without a guide.',
  instructions: [], bodyTips: [], cameraTips: [], tags: [], popularity: 0,
  figures: [stand()],
});
