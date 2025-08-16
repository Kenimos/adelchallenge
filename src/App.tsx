import { useEffect, useMemo, useRef, useState } from "react";
import { Apple, Droplet, BookOpen, Dumbbell, Camera, Check } from "lucide-react";

// ---------- Types ----------
type Habit = "diet" | "water" | "book" | "workout" | "pic";
type DayState = Record<Habit, boolean>;
type TrackerState = Record<number, DayState>; // 1..75

// ---------- Config / Helpers ----------
const HABITS: Habit[] = ["diet", "water", "book", "workout", "pic"]; // pořadí sloupců

const habitLabel: Record<Habit, string> = {
    diet: "Diet",
    water: "Water",
    book: "Book",
    workout: "Workout",
    pic: "Pic",
};

const STORAGE_KEY = "75soft-tracker-v1";
const DATE_KEY = "75soft-startDate";
const HIDE_KEY = "75soft-hidden-days-v1";
const SHOW_HIDDEN_KEY = "75soft-showHidden";

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

// Ikona pro daný návyk (černá, minimalistická)
function HabitIcon({ type, className = "w-5 h-5" }: { type: Habit; className?: string }) {
    const common = `${className} text-black`;
    switch (type) {
        case "diet":
            return <Apple className={common} aria-hidden />;
        case "water":
            return <Droplet className={common} aria-hidden />;
        case "book":
            return <BookOpen className={common} aria-hidden />;
        case "workout":
            return <Dumbbell className={common} aria-hidden />;
        case "pic":
            return <Camera className={common} aria-hidden />;
    }
}

// ---------- UI ----------
export default function App() {
    const [state, setState] = useLocalStorageState<TrackerState>(STORAGE_KEY, makeEmptyState());
    const [startDate, setStartDate] = useLocalStorageState<string>(DATE_KEY, "");
    const [hiddenDays, setHiddenDays] = useLocalStorageState<number[]>(HIDE_KEY, []);
    const [showHidden, setShowHidden] = useLocalStorageState<boolean>(SHOW_HIDDEN_KEY, false);
    const hiddenSet = useMemo(() => new Set(hiddenDays), [hiddenDays]);
    const dateInputRef = useRef<HTMLInputElement | null>(null);

    const toggle = (day: number, habit: Habit) => {
        setState((prev) => ({
            ...prev,
            [day]: { ...prev[day], [habit]: !prev[day][habit] },
        }));
    };

    const toggleHideDay = (day: number) => {
        setHiddenDays((prev) => (hiddenSet.has(day) ? prev.filter((d) => d !== day) : [...prev, day]));
    };

    const resetAll = () => {
        if (confirm("Resetovat všechna políčka?")) {
            setState(makeEmptyState());
            setHiddenDays([]);
        }
    };

    const percentDone = (() => {
        const total = 75 * HABITS.length;
        const done = Object.values(state).reduce(
            (acc, day) => acc + HABITS.reduce((a, h) => a + (day[h] ? 1 : 0), 0),
            0
        );
        return Math.round((done / total) * 100);
    })();

    const allDays = Array.from({ length: 75 }, (_, i) => i + 1);
    const visibleDays = showHidden ? allDays : allDays.filter((d) => !hiddenSet.has(d));

    return (
        <div className="min-h-screen w-full bg-[#1c6b6e] text-[#f7cbd0] antialiased">
            <main className="mx-auto max-w-md px-3 pb-20">
                {/* Header */}
                <header className="py-6 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight lowercase">75 soft</h1>
                    <p className="mt-1 text-sm tracking-[0.25em] uppercase">Challenge Tracker</p>

                    {/* Date picker */}
                    <div className="mt-4 flex flex-col items-center gap-2">
                        <div className="flex h-10 w-32 items-center justify-center rounded-md border border-[#f7cbd0]/40 px-3 text-sm font-bold">
                            {formatCZ(startDate)}
                        </div>
                        <button
                            onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
                            className="rounded-md border border-[#f7cbd0]/60 px-3 py-1 text-xs hover:bg-[#f7cbd0]/10"
                        >
                            Změnit datum
                        </button>
                        <input
                            ref={dateInputRef}
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="sr-only"
                        />
                    </div>
                </header>

                {/* Progress + controls */}
                <div className="mb-4">
                    <div className="mb-1 flex items-center justify-between text-xs">
                        <span>Progress</span>
                        <span>{percentDone}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#f7cbd0]/20">
                        <div className="h-full bg-[#f7cbd0] transition-all" style={{ width: `${percentDone}%` }} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                        <button
                            onClick={() => setShowHidden(!showHidden)}
                            className="rounded border border-[#f7cbd0]/60 px-2 py-1 hover:bg-[#f7cbd0]/10"
                        >
                            {showHidden ? "Skrýt skryté dny" : `Zobrazit skryté dny (${hiddenDays.length})`}
                        </button>
                        {hiddenDays.length > 0 && (
                            <button
                                onClick={() => setHiddenDays([])}
                                className="rounded border border-[#f7cbd0]/60 px-2 py-1 hover:bg-[#f7cbd0]/10"
                            >
                                Odkrýt vše
                            </button>
                        )}
                    </div>
                </div>

                {/* MOBILE TABLE: left day + 5 columns with labels in header */}
                <section className="rounded-xl bg-[#f7cbd0]/5 p-3 ring-1 ring-[#f7cbd0]/20">
                    {/* Header row WITH TEXT LABELS (sticky) */}
                    <div className="sticky top-0 z-10 -m-3 mb-3 bg-[#1c6b6e]/80 backdrop-blur supports-[backdrop-filter]:bg-[#1c6b6e]/60 p-3">
                        <div className="grid grid-cols-[auto_repeat(5,1fr)] items-center gap-2">
                            <div className="w-22 pl-1 text-left text-[10px] uppercase tracking-widest opacity-80">Day</div>
                            {HABITS.map((h) => (
                                <div
                                    key={`head-${h}`}
                                    className="flex h-6 items-center justify-center text-[10px] uppercase tracking-widest opacity-90"
                                >
                                    {habitLabel[h]}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Body rows */}
                    <div className="space-y-2">
                        {visibleDays.map((day) => (
                            <div key={day} className={hiddenSet.has(day) ? "opacity-60" : ""}>
                                <div className="grid grid-cols-[auto_repeat(5,1fr)] items-center gap-2">
                                    {/* Left day cell with checkbox to hide */}
                                    <div className="flex items-center gap-2 pl-1 w-22">
                                        <button
                                            onClick={() => toggleHideDay(day)}
                                            className={
                                                "flex h-6 w-6 items-center justify-center rounded-md border " +
                                                (hiddenSet.has(day)
                                                    ? "bg-[#f7cbd0] text-[#1c6b6e] border-[#f7cbd0]"
                                                    : "border-[#f7cbd0]/60 hover:bg-[#f7cbd0]/10")
                                            }
                                            aria-pressed={hiddenSet.has(day)}
                                            title={hiddenSet.has(day) ? "Odkrýt den" : "Odškrtnout den (skrýt)"}
                                        >
                                            {hiddenSet.has(day) ? <Check className="w-4 h-4 text-[#1c6b6e]" /> : null}
                                        </button>
                                        <span className="min-w-8 text-sm font-bold">{day}</span>
                                    </div>

                                    {/* Habit cells with icons */}
                                    {HABITS.map((h) => (
                                        <Cell
                                            key={`${h}-${day}`}
                                            day={day}
                                            habit={h}
                                            active={state[day][h]}
                                            onClick={() => toggle(day, h)}
                                            emphasize={h === "pic" && day % 5 === 0}
                                        />
                                    ))}
                                </div>
                                {/* Separator every 5 days */}
                                {day % 5 === 0 && <div className="mt-2 h-px w-full bg-[#f7cbd0]/20" />}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer actions */}
                <div className="mt-6 flex justify-center gap-3">
                    <button
                        onClick={resetAll}
                        className="rounded-xl bg-[#f7cbd0] px-4 py-2 text-sm font-semibold text-[#1c6b6e] hover:opacity-90"
                    >
                        Resetovat vše
                    </button>
                </div>
            </main>
        </div>
    );
}

// ---------- Subcomponents ----------
function Cell({
                  day,
                  habit,
                  active,
                  onClick,
                  emphasize,
              }: {
    day: number;
    habit: Habit;
    active: boolean;
    onClick: () => void;
    emphasize?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={
                "relative aspect-square w-full rounded-md border transition " +
                (active ? "bg-[#f7cbd0] text-[#1c6b6e] border-[#f7cbd0] shadow" : "border-[#f7cbd0]/60 hover:border-[#f7cbd0]") +
                (emphasize ? " ring-1 ring-[#f7cbd0]/50" : "")
            }
            aria-pressed={active}
            aria-label={`${habitLabel[habit]} — den ${day}`}
            title={`${habitLabel[habit]} — den ${day}`}
        >
            {/* Ikona je vždy černá, aby zůstala minimalistická i na aktivní buňce */}
            <span className="grid place-items-center">
        <HabitIcon type={habit} className="w-5 h-5 text-black" />
      </span>
        </button>
    );
}
