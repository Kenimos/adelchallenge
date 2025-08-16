import { useEffect, useMemo, useRef, useState } from "react";

// ---------- Types ----------
type Habit = "diet" | "water" | "book" | "workout" | "pic";

type DayState = Record<Habit, boolean>;

type TrackerState = Record<number, DayState>; // 1..75

// ---------- Helpers ----------
const HABITS: Habit[] = ["diet", "water", "book", "workout", "pic"];

const habitLabel: Record<Habit, string> = {
    diet: "DIET",
    water: "WATER",
    book: "BOOK",
    workout: "WORKOUT",
    pic: "PIC",
};

const chunk = <T,>(arr: T[], size: number) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
    );

const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

const STORAGE_KEY = "75soft-tracker-v1";
const DATE_KEY = "75soft-startDate";

function makeEmptyState(): TrackerState {
    const state: TrackerState = {} as TrackerState;
    for (let d = 1; d <= 75; d++) {
        state[d] = { diet: false, water: false, book: false, workout: false, pic: false };
    }
    return state;
}

function useLocalStorageState<T>(key: string, initial: T) {
    const [val, setVal] = useState<T>(() => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? (JSON.parse(raw) as T) : initial;
        } catch {
            return initial;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(val));
        } catch {}
    }, [key, val]);

    return [val, setVal] as const;
}

function formatCZ(dateStr: string) {
    if (!dateStr) return "—";
    const [y, m, d] = dateStr.split("-").map(Number);
    const dd = String(d).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return `${dd}.${mm}.${y}`;
}

// ---------- UI ----------
export default function App() {
    const [state, setState] = useLocalStorageState<TrackerState>(
        STORAGE_KEY,
        makeEmptyState()
    );
    const [startDate, setStartDate] = useLocalStorageState<string>(DATE_KEY, "");
    const dateInputRef = useRef<HTMLInputElement | null>(null);

    const days = useMemo(() => range(1, 75), []);
    const sections = useMemo(() => chunk(days, 25), [days]);

    const toggle = (day: number, habit: Habit) => {
        setState((prev) => ({
            ...prev,
            [day]: { ...prev[day], [habit]: !prev[day][habit] },
        }));
    };

    const resetAll = () => {
        if (confirm("Resetovat všechna políčka?")) {
            setState(makeEmptyState());
        }
    };

    const percentDone = useMemo(() => {
        const total = 75 * HABITS.length;
        const done = Object.values(state).reduce(
            (acc, day) => acc + HABITS.reduce((a, h) => a + (day[h] ? 1 : 0), 0),
            0
        );
        return Math.round((done / total) * 100);
    }, [state]);

    return (
        <div className="min-h-screen w-full bg-[#1c6b6e] text-[#f7cbd0] antialiased">
            {/* top ribbon text */}
            <div className="pointer-events-none select-none text-center text-5xl md:text-7xl font-extrabold opacity-20 pt-2 tracking-tight">
                you can do hard things
            </div>

            <main className="mx-auto max-w-6xl px-4 pb-24">
                {/* Header */}
                <header className="flex flex-wrap items-end justify-between gap-6 py-8">
                    <div>
                        <h1 className="text-[60px] leading-none md:text-[92px] font-extrabold tracking-tight">
                            <span className="lowercase">75 soft</span>
                        </h1>
                        <p className="mt-2 text-xl md:text-2xl tracking-[0.25em] uppercase">
                            Challange Tracker
                        </p>
                    </div>

                    {/* Custom date display + hidden native picker */}
                    <div className="ml-auto flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-2xl md:text-3xl font-bold leading-none">start</div>
                            <div className="text-2xl md:text-3xl font-bold leading-none">date</div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex h-[64px] w-[140px] md:h-[90px] md:w-[170px] items-center justify-center rounded-md border border-[#f7cbd0]/40 bg-transparent px-3 text-lg md:text-2xl font-bold">
                                {formatCZ(startDate)}
                            </div>
                            <button
                                onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
                                className="rounded-md border border-[#f7cbd0]/60 px-3 py-2 text-sm hover:bg-[#f7cbd0]/10"
                                title="Change Date"
                            >
                                Change
                            </button>
                            <input
                                ref={dateInputRef}
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="sr-only"
                            />
                        </div>
                    </div>
                </header>

                {/* Progress bar */}
                <div className="mb-8">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="uppercase tracking-widest text-sm">Progress</span>
                        <span className="text-sm">{percentDone}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-[#f7cbd0]/20">
                        <div
                            className="h-full bg-[#f7cbd0] transition-all"
                            style={{ width: `${percentDone}%` }}
                        />
                    </div>
                </div>

                {/* Sections 1-25, 26-50, 51-75 */}
                <div className="space-y-12">
                    {sections.map((section, i) => (
                        <Section
                            key={i}
                            days={section}
                            state={state}
                            onToggle={toggle}
                            footerNumber={i === 0 ? 25 : i === 1 ? 50 : 75}
                        />
                    ))}
                </div>

                {/* Rules */}
                <section className="mt-16 rounded-2xl bg-[#f7cbd0]/5 p-6 ring-1 ring-[#f7cbd0]/20">
                    <h2 className="text-5xl font-extrabold mb-4">rules</h2>
                    <ul className="space-y-3 text-lg md:text-xl">
                        <li className="list-disc ml-6">Eat well and only drink alcohol on special occasions</li>
                        <li className="list-disc ml-6">Drink 3 liters of water</li>
                        <li className="list-disc ml-6">45 min workout per day + 1 recovery day a week</li>
                        <li className="list-disc ml-6">Read 10 pages of any book</li>
                        <li className="list-disc ml-6">Progress pic once a week</li>
                    </ul>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            onClick={resetAll}
                            className="rounded-xl bg-[#f7cbd0] px-4 py-2 font-semibold text-[#1c6b6e] hover:opacity-90"
                        >
                            Reset progress
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}

// ---------- Subcomponents ----------
function Section({
                     days,
                     state,
                     onToggle,
                     footerNumber,
                 }: {
    days: number[];
    state: TrackerState;
    onToggle: (day: number, habit: Habit) => void;
    footerNumber: number;
}) {
    return (
        <section>
            {/* Numbers aligned exactly over cells */}
            <div className="grid grid-cols-[auto_1fr] gap-2 mb-2">
                <div className="w-20 md:w-28" />
                <div className="grid gap-[6px] [grid-template-columns:repeat(25,minmax(0,1fr))]">
                    {days.map((d) => (
                        <span key={d} className="text-center text-xs tracking-widest opacity-90">
              {d}
            </span>
                    ))}
                </div>
            </div>

            {/* Habit rows */}
            <div className="grid grid-cols-[auto_1fr] gap-2">
                {HABITS.map((h) => (
                    <div key={h} className="contents">
                        <div className="pr-3 text-right text-sm md:text-base tracking-widest uppercase w-20 md:w-28">
                            {habitLabel[h]}
                        </div>
                        <div className="grid gap-[6px] [grid-template-columns:repeat(25,minmax(0,1fr))]">
                            {days.map((d) => (
                                <Cell
                                    key={`${h}-${d}`}
                                    active={state[d][h]}
                                    onClick={() => onToggle(d, h)}
                                    // PIC "tečka" jen každých 5 dní
                                    marker={h === "pic" && d % 5 === 0}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* right-end number like the mockup */}
            <div className="mt-1 text-right text-sm font-bold opacity-90">{footerNumber}</div>
        </section>
    );
}

function Cell({
                  active,
                  onClick,
                  marker,
              }: {
    active: boolean;
    onClick: () => void;
    marker?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={
                "relative aspect-square w-6 rounded-sm border transition " +
                (active
                    ? "bg-[#f7cbd0] text-[#1c6b6e] border-[#f7cbd0] shadow"
                    : "border-[#f7cbd0]/60 hover:border-[#f7cbd0]")
            }
            aria-pressed={active}
        >
            {marker && (
                <span className="pointer-events-none absolute -bottom-4 left-1/2 h-2 w-1 -translate-x-1/2 rounded-full bg-[#f7cbd0]/70" />
            )}
        </button>
    );
}

// ---------- Tailwind utilities ----------
// Create runtime utility for 25 columns (if not already in your Tailwind config)
if (typeof document !== "undefined") {
    const id = "grid-cols-25-style";
    if (!document.getElementById(id)) {
        const style = document.createElement("style");
        style.id = id;
        style.innerHTML = `.grid-cols-25{grid-template-columns:repeat(25,minmax(0,1fr));}`;
        document.head.appendChild(style);
    }
}