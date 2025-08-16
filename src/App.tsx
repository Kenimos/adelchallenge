import { useEffect, useRef, useState } from "react";

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

    const percentDone = (() => {
        const total = 75 * HABITS.length;
        const done = Object.values(state).reduce(
            (acc, day) => acc + HABITS.reduce((a, h) => a + (day[h] ? 1 : 0), 0),
            0
        );
        return Math.round((done / total) * 100);
    })();

    return (
        <div className="min-h-screen w-full bg-[#1c6b6e] text-[#f7cbd0] antialiased">
            <main className="mx-auto max-w-md px-4 pb-20">
                {/* Header */}
                <header className="py-6 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight lowercase">75 soft</h1>
                    <p className="mt-1 text-sm tracking-[0.25em] uppercase">Challange Tracker</p>

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

                {/* Progress bar */}
                <div className="mb-8">
                    <div className="mb-1 flex items-center justify-between text-xs">
                        <span>Progress</span>
                        <span>{percentDone}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#f7cbd0]/20">
                        <div
                            className="h-full bg-[#f7cbd0] transition-all"
                            style={{ width: `${percentDone}%` }}
                        />
                    </div>
                </div>

                {/* Days list - one column with 75 rows */}
                <div className="space-y-4">
                    {Array.from({ length: 75 }, (_, i) => i + 1).map((day) => (
                        <div
                            key={day}
                            className="rounded-lg bg-[#f7cbd0]/5 p-3 ring-1 ring-[#f7cbd0]/20"
                        >
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-bold">Day {day}</span>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                                {HABITS.map((h) => (
                                    <Cell
                                        key={`${h}-${day}`}
                                        day={day}
                                        habit={h}
                                        active={state[day][h]}
                                        onClick={() => toggle(day, h)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Rules */}
                <section className="mt-12 rounded-2xl bg-[#f7cbd0]/5 p-4 ring-1 ring-[#f7cbd0]/20">
                    <h2 className="text-2xl font-extrabold mb-3">rules</h2>
                    <ul className="space-y-2 text-sm">
                        <li className="list-disc ml-6">Eat well and only drink alcohol on special occasions</li>
                        <li className="list-disc ml-6">Drink 3 liters of water</li>
                        <li className="list-disc ml-6">45 min workout per day + 1 recovery day a week</li>
                        <li className="list-disc ml-6">Read 10 pages of any book</li>
                        <li className="list-disc ml-6">Progress pic once a week</li>
                    </ul>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <button
                            onClick={resetAll}
                            className="rounded-xl bg-[#f7cbd0] px-4 py-2 font-semibold text-[#1c6b6e] hover:opacity-90"
                        >
                            Resetovat vše
                        </button>
                    </div>
                </section>
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
              }: {
    day: number;
    habit: Habit;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={
                "relative aspect-square w-full rounded-md border text-[10px] font-bold transition " +
                (active
                    ? "bg-[#f7cbd0] text-[#1c6b6e] border-[#f7cbd0] shadow"
                    : "border-[#f7cbd0]/60 hover:border-[#f7cbd0]")
            }
            aria-pressed={active}
        >
            {habitLabel[habit].slice(0, 2)}
        </button>
    );
}
