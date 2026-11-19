// Fills one account with demo data that shows the app in use: about 12 weeks of workouts from the
// ABC templates with progressive loads, a deload and a business trip, weekly measurements with
// a downward trend and three custom templates. Every document id starts with `demo-`, so the data
// is told apart from the account's own entries and `--remove` deletes only it. `--apply` refuses
// when demo data is already there; the week plan and other documents are never touched.
//
// Usage (credentials: `gcloud auth application-default login` or GOOGLE_APPLICATION_CREDENTIALS;
// with FIRESTORE_EMULATOR_HOST set it writes to the emulator):
//   node scripts/seed-demo-data.ts --project <project id> --uid <uid> [--until YYYY-MM-DD] [--apply | --remove]
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { z } from 'zod';
import { WorkoutDocumentSchema } from '../src/types/workout.types.ts';
import { MeasurementDocumentSchema } from '../src/types/measurement.types.ts';
import { WorkoutTemplateSchema } from '../src/types/template.types.ts';

export const DEMO_PREFIX = 'demo-';
export const DEMO_COLLECTIONS = ['sessions', 'measurements', 'templates'] as const;

type WorkoutDocument = z.infer<typeof WorkoutDocumentSchema>;
type MeasurementDocument = z.infer<typeof MeasurementDocumentSchema>;
type TemplateDocument = Omit<z.infer<typeof WorkoutTemplateSchema>, 'id'>;
type DemoCollection = (typeof DEMO_COLLECTIONS)[number];

export type DemoData = {
  sessions: Record<string, WorkoutDocument>;
  measurements: Record<string, MeasurementDocument>;
  templates: Record<string, TemplateDocument>;
};

/**
 * How an exercise is performed: a fixed rep scheme (`reps` per set), a rep range for every set
 * (double progression) or sets to failure (`max`, with the reps of the first week). `start` is the
 * load in kg (0 for body weight); it grows by `step` every `every` weeks and is rounded to `round`.
 */
type Load = { start: number; step: number; every: number; round: number };
type Plan =
  | (Load & { kind: 'scheme'; reps: number[] })
  | (Load & { kind: 'range'; sets: number; min: number; max: number })
  | (Load & { kind: 'max'; sets: number; reps: number });

/** An exercise exactly as the template lists it; without a plan (warm-up, finisher) it gets no sets. */
type DemoExercise = { name: string; plan?: Plan };
type DemoTemplate = { id: string; name: string; duration: number; exercises: DemoExercise[] };

const scheme = (reps: number[], start: number, step: number, every = 2, round = 2.5): Plan =>
  ({ kind: 'scheme', reps, start, step, every, round });
const range = (sets: number, min: number, max: number, start: number, step: number, every = 3, round = 1): Plan =>
  ({ kind: 'range', sets, min, max, start, step, every, round });
const toFailure = (sets: number, reps: number, start = 0, step = 0, every = 4, round = 2.5): Plan =>
  ({ kind: 'max', sets, reps, start, step, every, round });

const PYRAMID_5 = [12, 10, 10, 8, 8];
const WARM_UP: DemoExercise[] = [
  { name: 'Rozgrzewka: Wioślarz 1000m (opór 7/8)' },
  { name: 'Rozgrzewka: Ski-erg 1000m (opór 7/8)' },
];
const FINISHER: DemoExercise = { name: 'Finisher: Rower 300 Cal (opór 6/7)' };

// Names, ids and exercise lists of the default ABC templates (src/features/templates/defaultTemplates.ts),
// so the workouts link to the templates, their last results and the technique videos.
export const ABC_TEMPLATES: Record<'A' | 'B' | 'C', DemoTemplate> = {
  A: {
    id: 'ABC-A',
    name: 'Trening A - Klatka + Barki',
    duration: 90,
    exercises: [
      ...WARM_UP,
      { name: 'Wyciskanie Hummer wąsko – 5x (12/10/10/8/8)', plan: scheme(PYRAMID_5, 60, 2.5) },
      { name: 'Wyciskanie Smith dodatnia 15° – 5x (12/10/10/8/8)', plan: scheme(PYRAMID_5, 50, 2.5) },
      { name: 'Wyciskanie hantli pozioma – 5x12-15', plan: range(5, 12, 15, 26, 2) },
      { name: 'Wznosy sztangi wzdłuż tułowia – 5x (12/10/10/8/8)', plan: scheme(PYRAMID_5, 30, 2.5, 3) },
      { name: 'Wznosy hantli na boki siedząc – 5x12-15', plan: range(5, 12, 15, 10, 1, 4) },
      { name: 'A\'lahy wyciąg górny – 4x MAX', plan: toFailure(4, 15, 40, 2.5) },
      FINISHER,
    ],
  },
  B: {
    id: 'ABC-B',
    name: 'Trening B - Plecy + Barki Tylne',
    duration: 90,
    exercises: [
      ...WARM_UP,
      { name: 'Hummer z góry szeroko – 5x (12/10/10/8/8)', plan: scheme(PYRAMID_5, 60, 2.5) },
      { name: 'Hummer wiosło podchwytem – 5x (12/10/10/8/8)', plan: scheme(PYRAMID_5, 70, 2.5) },
      { name: 'Ściąganie łapek poziomo – 5x (12/10/10/8/8)', plan: scheme(PYRAMID_5, 55, 2.5) },
      { name: 'Prostownik – 3x MAX', plan: toFailure(3, 15) },
      { name: 'Wyciskanie żołnierskie siedząc – 5x12-15', plan: range(5, 12, 15, 40, 2.5, 3, 2.5) },
      { name: 'Odwrotny butterfly – 5x12-15', plan: range(5, 12, 15, 35, 2.5, 3, 2.5) },
      { name: 'Podciąganie kolan na stojaku – 4x MAX', plan: toFailure(4, 12) },
      FINISHER,
    ],
  },
  C: {
    id: 'ABC-C',
    name: 'Trening C - Nogi + Ramiona',
    duration: 90,
    exercises: [
      ...WARM_UP,
      { name: 'Wykroki – 5x20 wykroków', plan: scheme([20, 20, 20, 20, 20], 16, 2, 4, 2) },
      { name: 'Przysiad kettla z przodu – 5x12-15 (12kg)', plan: range(5, 12, 15, 12, 4, 6, 4) },
      { name: 'Wypychanie suwnicy – 4x (12/10/10/8)', plan: scheme([12, 10, 10, 8], 140, 10) },
      { name: 'Zginanie podudzia (1 noga) – 5x12-15', plan: range(5, 12, 15, 20, 2.5, 3, 2.5) },
      { name: 'SUPERSET: Biceps młotek – 4x12-15', plan: range(4, 12, 15, 14, 2, 4, 2) },
      { name: 'SUPERSET: Triceps francuskie – 4x12-15', plan: range(4, 12, 15, 25, 2.5, 3, 2.5) },
      { name: 'SUPERSET: Biceps dolny wyciąg – 4x12-15', plan: range(4, 12, 15, 25, 2.5, 3, 2.5) },
      { name: 'SUPERSET: Triceps górny wyciąg – 4x12-15', plan: range(4, 12, 15, 30, 2.5, 3, 2.5) },
      FINISHER,
    ],
  },
};

const CUSTOM_TEMPLATES: Record<string, DemoTemplate & Omit<TemplateDocument, 'name' | 'exercises' | 'estimatedDuration'>> = {
  'demo-template-conditioning': {
    id: 'demo-template-conditioning',
    name: 'Sobota – Kondycja + Core',
    description: 'Krótka sobotnia jednostka: kettlebell, praca z masą ciała i core. Uzupełnia plan ABC. ~50 min.',
    category: 'hybrid',
    difficulty: 'intermediate',
    color: 'bg-teal-600',
    icon: '⏱️',
    duration: 50,
    exercises: [
      { name: 'Rozgrzewka: Ski-erg 500m' },
      { name: 'Kettlebell swing – 4x20', plan: scheme([20, 20, 20, 20], 20, 4, 6, 4) },
      { name: 'Przysiad goblet – 4x12-15', plan: range(4, 12, 15, 20, 4, 6, 4) },
      { name: 'Pompki – 4x MAX', plan: toFailure(4, 22) },
      { name: 'Wiosłowanie TRX – 4x12-15', plan: range(4, 12, 15, 0, 0) },
      { name: 'Wznosy nóg w zwisie – 3x MAX', plan: toFailure(3, 12) },
      { name: 'Finisher: Wioślarz 2000m' },
    ],
  },
  'demo-template-travel': {
    id: 'demo-template-travel',
    name: 'Full Body – siłownia hotelowa',
    description: 'Cały trening na hantlach do 30 kg, gdy nie ma dostępu do maszyn. ~45 min.',
    category: 'strength',
    difficulty: 'beginner',
    color: 'bg-indigo-600',
    icon: '🎯',
    duration: 45,
    exercises: [
      { name: 'Przysiad z hantlami – 4x12-15', plan: range(4, 12, 15, 22, 0) },
      { name: 'Wyciskanie hantli na ławce – 4x10-12', plan: range(4, 10, 12, 26, 0) },
      { name: 'Wiosłowanie hantlem – 4x10-12 (na stronę)', plan: range(4, 10, 12, 28, 0) },
      { name: 'Wyciskanie hantli nad głowę – 3x10-12', plan: range(3, 10, 12, 18, 0) },
      { name: 'Martwy ciąg rumuński hantlami – 3x12', plan: scheme([12, 12, 12], 26, 0) },
      { name: 'Spięcia brzucha na piłce – 3x MAX', plan: toFailure(3, 20) },
    ],
  },
  'demo-template-mobility': {
    id: 'demo-template-mobility',
    name: 'Mobilność i rozciąganie',
    description: 'Spokojna sesja na dzień wolny: biodra, odcinek piersiowy, barki. ~25 min.',
    category: 'custom',
    difficulty: 'beginner',
    color: 'bg-slate-600',
    icon: '🧘',
    duration: 25,
    exercises: [
      { name: 'Rolowanie: łydki, uda, plecy – 5 min' },
      { name: 'Cat-cow – 2x10' },
      { name: 'Rozciąganie zginaczy bioder – 2x45s na stronę' },
      { name: 'Otwieranie klatki przy ścianie – 2x10' },
      { name: 'Pozycja gołębia – 2x60s na stronę' },
      { name: 'Wiszenie na drążku – 3x30s' },
    ],
  },
};

const WEEKS = 12;
const DELOAD_WEEK = 9;
const TRAVEL_WEEK = 6;
const DAY_MS = 86_400_000;

/** Deterministic pseudo-random numbers (mulberry32), so every run builds the same data. */
const random = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const roundTo = (value: number, step: number) => Math.round(value / step) * step;
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

const buildSets = (plan: Plan, week: number, rand: () => number) => {
  const deload = week === DELOAD_WEEK;
  const blockWeek = week % plan.every;
  const top = plan.start === 0
    ? 0
    : roundTo((plan.start + plan.step * Math.floor(week / plan.every)) * (deload ? 0.85 : 1), plan.round);
  const weight = (share = 1) => (top === 0 ? '' : String(roundTo(top * share, plan.round)));
  const rir = (value: number) => String(deload ? value + 2 : value);

  if (plan.kind === 'scheme') {
    const pyramid = new Set(plan.reps).size > 1;
    return plan.reps.map((reps, i) => ({
      // A rising pyramid: the first, longest set is lighter than the top sets.
      weight: weight(pyramid ? [0.85, 0.92, 0.92, 1, 1][i] ?? 1 : 1),
      reps: String(reps + (!deload && rand() < 0.15 ? 1 : 0)),
      rir: rir(pyramid ? [3, 2, 2, 1, 1][i] ?? 1 : i < plan.reps.length - 1 ? 2 : 1),
    }));
  }
  if (plan.kind === 'range') {
    // Double progression: reps climb towards the top of the range until the load goes up.
    const progress = plan.every > 1 ? blockWeek / (plan.every - 1) : 1;
    const first = deload ? plan.min : Math.round(plan.min + (plan.max - plan.min) * progress);
    return Array.from({ length: plan.sets }, (_, i) => ({
      weight: weight(),
      reps: String(Math.max(plan.min - 1, first - (i >= plan.sets - 2 && rand() < 0.6 ? 1 : 0))),
      rir: rir(i < plan.sets - 1 ? 2 : 1),
    }));
  }
  const best = plan.reps + Math.floor(week / 2) - (deload ? 3 : 0);
  return Array.from({ length: plan.sets }, (_, i) => ({
    weight: weight(),
    reps: String(Math.max(1, best - i * 2 - (rand() < 0.3 ? 1 : 0))),
    rir: '0',
  }));
};

const workout = (template: DemoTemplate, finishedAt: Date, week: number, notes: string, rand: () => number): WorkoutDocument => ({
  type: template.name,
  templateId: template.id,
  date: finishedAt.toISOString(),
  exercises: template.exercises.map(({ name, plan }) => ({ name, sets: plan ? buildSets(plan, week, rand) : [] })),
  notes,
  duration: template.duration + Math.round((rand() - 0.4) * 20),
  completed: true,
});

/** Notes of particular sessions, keyed by `week:day` (day 0 = Monday). */
const NOTES: Record<string, string> = {
  '0:0': 'Start nowego bloku. Ciężary zachowawczo, skupienie na technice i pełnym zakresie.',
  '1:4': 'Nogi ciężko po całym tygodniu, ale wszystkie serie zrobione.',
  '2:2': 'Wiosło podchwytem w końcu bez bujania tułowiem.',
  '3:2': 'W piątek wyjazd rodzinny, więc C wypada – w sobotę nadrobię kondycją.',
  '4:0': 'Rekord na Hummerze wąsko 🎉 Bark bez bólu.',
  '5:4': 'Suwnica +10 kg i dalej dwa powtórzenia w zapasie.',
  '6:0': 'Ostatni trening przed delegacją.',
  '6:2': 'Delegacja – siłownia hotelowa, same hantle do 30 kg.',
  '6:3': 'Drugi trening w hotelu. Krótko, ale intensywnie.',
  '7:0': 'Powrót po wyjeździe. Ciężary sprzed tygodnia weszły bez problemu.',
  '8:4': 'Mocny tydzień, czuć zmęczenie – w przyszłym tygodniu deload.',
  [`${DELOAD_WEEK}:0`]: 'Tydzień deloadu: ok. 85% ciężaru, RIR 3–4, technika.',
  '10:0': 'Po deloadzie siła wróciła z nawiązką. Smith +2,5 kg.',
  '11:3': 'Trening B przesunięty ze środy na czwartek – nadgodziny w pracy.',
  '12:0': 'Najlepszy trening bloku. Pora zaplanować kolejny.',
};

/** Weeks start on Monday; `until` falls in the last one, and nothing later than `until` is built. */
export const buildDemoData = (until: Date): DemoData => {
  const rand = random(20261119);
  const untilDay = Date.UTC(until.getUTCFullYear(), until.getUTCMonth(), until.getUTCDate());
  const lastMonday = untilDay - ((until.getUTCDay() + 6) % 7) * DAY_MS;
  const firstMonday = lastMonday - WEEKS * 7 * DAY_MS;
  const day = (week: number, weekday: number) => new Date(firstMonday + (week * 7 + weekday) * DAY_MS);
  const { A, B, C } = ABC_TEMPLATES;
  const conditioning = CUSTOM_TEMPLATES['demo-template-conditioning'];
  const travel = CUSTOM_TEMPLATES['demo-template-travel'];

  const data: DemoData = { sessions: {}, measurements: {}, templates: {} };

  for (let week = 0; week <= WEEKS; week++) {
    const schedule: [number, DemoTemplate][] =
      week === TRAVEL_WEEK
        ? [[0, A], [2, travel], [3, travel]]
        : [[0, A], [week === 11 ? 3 : 2, B], ...(week === 3 ? [] : [[4, C] as [number, DemoTemplate]])];
    if (week % 2 === 1 && week !== TRAVEL_WEEK) schedule.push([5, conditioning]);

    for (const [weekday, template] of schedule) {
      // Finished in the evening, between 17:15 and 19:00 UTC.
      const finishedAt = new Date(day(week, weekday).getTime() + (17 * 60 + 15 + Math.floor(rand() * 105)) * 60_000);
      if (finishedAt.getTime() > until.getTime()) continue;
      const note = NOTES[`${week}:${weekday}`] ?? (week === 3 && template === conditioning ? 'Odrobione za piątek.' : '');
      data.sessions[`${DEMO_PREFIX}session-${isoDay(finishedAt)}`] = workout(template, finishedAt, week, note, rand);
    }

    // Weekly measurement on Monday morning; the trip adds a little water weight.
    const measuredOn = day(week, 0);
    if (measuredOn.getTime() <= until.getTime()) {
      const share = week / WEEKS;
      data.measurements[`${DEMO_PREFIX}measurement-${isoDay(measuredOn)}`] = {
        date: isoDay(measuredOn),
        weight: Math.round((89.6 - 4.1 * share + (rand() - 0.5) * 0.6 + (week === TRAVEL_WEEK + 1 ? 0.5 : 0)) * 10) / 10,
        waist: roundTo(99 - 5.5 * share + (rand() - 0.5), 0.5),
      };
    }
  }

  for (const { id, name, duration, exercises, ...appearance } of Object.values(CUSTOM_TEMPLATES)) {
    data.templates[id] = {
      name,
      exercises: exercises.map(e => e.name),
      estimatedDuration: duration,
      ...appearance,
      isCustom: true,
      createdAt: day(0, 0).toISOString(),
    };
  }

  // The same validation as reading in the app, so every document shows up there.
  Object.values(data.sessions).forEach(d => WorkoutDocumentSchema.parse(d));
  Object.values(data.measurements).forEach(d => MeasurementDocumentSchema.parse(d));
  Object.entries(data.templates).forEach(([id, d]) => WorkoutTemplateSchema.parse({ id, ...d }));
  return data;
};

const collectionOf = (db: Firestore, uid: string, name: DemoCollection) => db.collection(`users/${uid}/${name}`);

/** Ids of the demo documents already in the account, per collection. */
export const findDemoData = async (db: Firestore, uid: string): Promise<Record<DemoCollection, string[]>> => {
  const entries = await Promise.all(
    DEMO_COLLECTIONS.map(async name => {
      const refs = await collectionOf(db, uid, name).listDocuments();
      return [name, refs.map(ref => ref.id).filter(id => id.startsWith(DEMO_PREFIX))] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<DemoCollection, string[]>;
};

/** Writes the demo data in one atomic batch; throws without writing when demo data is already there. */
export const seedDemoData = async (db: Firestore, uid: string, data: DemoData): Promise<void> => {
  const existing = Object.values(await findDemoData(db, uid)).flat();
  if (existing.length > 0) {
    throw new Error(`users/${uid} already has ${existing.length} demo documents — run with --remove first`);
  }
  const batch = db.batch();
  for (const name of DEMO_COLLECTIONS) {
    for (const [id, document] of Object.entries(data[name])) {
      batch.create(collectionOf(db, uid, name).doc(id), document);
    }
  }
  await batch.commit();
};

/** Deletes every document with a `demo-` id from the account in one atomic batch; returns their number. */
export const removeDemoData = async (db: Firestore, uid: string): Promise<number> => {
  const found = await findDemoData(db, uid);
  const batch = db.batch();
  let count = 0;
  for (const name of DEMO_COLLECTIONS) {
    for (const id of found[name]) {
      batch.delete(collectionOf(db, uid, name).doc(id));
      count++;
    }
  }
  await batch.commit();
  return count;
};

const main = async () => {
  const { values } = parseArgs({
    options: {
      project: { type: 'string' },
      uid: { type: 'string' },
      until: { type: 'string' },
      apply: { type: 'boolean', default: false },
      remove: { type: 'boolean', default: false },
    },
  });
  const until = values.until ? new Date(`${values.until}T23:59:59Z`) : new Date();
  if (!values.project || !values.uid || (values.apply && values.remove) || Number.isNaN(until.getTime())) {
    console.error('Usage: node scripts/seed-demo-data.ts --project <project id> --uid <uid> [--until YYYY-MM-DD] [--apply | --remove]');
    process.exit(2);
  }
  const db = getFirestore(initializeApp({ projectId: values.project }));
  const target = process.env.FIRESTORE_EMULATOR_HOST ? `emulator ${process.env.FIRESTORE_EMULATOR_HOST}` : 'PRODUCTION';
  const mode = values.apply ? 'APPLY' : values.remove ? 'REMOVE' : 'DRY RUN';
  console.warn(`${mode} — project ${values.project} (${target}), users/${values.uid}`);

  if (values.remove) {
    console.warn(`Removed ${await removeDemoData(db, values.uid)} demo documents.`);
    return;
  }
  const data = buildDemoData(until);
  for (const name of DEMO_COLLECTIONS) {
    console.warn(`${name}: ${Object.keys(data[name]).length} demo documents`);
  }
  const existing = await findDemoData(db, values.uid);
  for (const name of DEMO_COLLECTIONS) {
    if (existing[name].length > 0) console.warn(`${name}: ${existing[name].length} demo documents already there`);
  }
  if (!values.apply) return;
  await seedDemoData(db, values.uid, data);
  const written = Object.values(await findDemoData(db, values.uid)).flat().length;
  const expected = DEMO_COLLECTIONS.reduce((sum, name) => sum + Object.keys(data[name]).length, 0);
  console.warn(written === expected ? `Check: ${written} demo documents written.` : `Check FAILED: ${written} of ${expected}.`);
  if (written !== expected) process.exit(1);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error('seed-demo-data failed:', error);
    process.exit(1);
  });
}
