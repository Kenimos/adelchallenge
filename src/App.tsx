import { useEffect, useMemo, useRef, useState } from "react";
import { Apple, Droplet, BookOpen, Dumbbell, Camera, Calendar } from "lucide-react";

// ---------- Types ----------
type Habit = "diet" | "water" | "book" | "workout" | "pic";
type DayState = Record<Habit, boolean>;
type TrackerState = Record<number, DayState>; // 1..75

// ---------- Config ----------
const TOTAL_DAYS = 75;
const PAGE_SIZE = 5; // show 5 days at a time
const HABITS: Habit[] = ["workout", "water", "diet", "book", "pic"];
const ICON: Record<Habit, React.ElementType> = {
    workout: Dumbbell,
    water: Droplet,
    diet: Apple,
    book: BookOpen,
    pic: Camera,
};
const habitLabel: Record<Habit, string> = {
    workout: "WORKOUT",
    water: "WATER",
    diet: "DIET",
    book: "BOOK",
    pic: "PIC",
};
const STORAGE_KEY = "soft75-tracker-v3";
const DATE_KEY = "soft75-start-date";

// PIC active only on: 10,20,30,40,50,60,70,75
const PIC_ACTIVE = new Set([10, 20, 30, 40, 50, 60, 70, 75]);
const isPicAllowed = (day: number) => PIC_ACTIVE.has(day);

// ---------- Helpers ----------
function makeEmptyState(): TrackerState {
    const s: TrackerState = {} as TrackerState;
    for (let d = 1; d <= TOTAL_DAYS; d++) {
        s[d] = { diet: false, water: false, book: false, workout: false, pic: false };
    }
    return s;
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
function formatDMY(iso: string) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-").map(Number);
    return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
}

// ---------- UI ----------
export default function App() {
    const [state, setState] = useLocalStorageState<TrackerState>(STORAGE_KEY, makeEmptyState());
    const [startDate, setStartDate] = useLocalStorageState<string>(DATE_KEY, "");
    const [page, setPage] = useState(0); // 0..14 (15 pages of 5)
    const dateRef = useRef<HTMLInputElement | null>(null);

    const pagesCount = Math.ceil(TOTAL_DAYS / PAGE_SIZE);
    const allDays = useMemo(() => Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1), []);
    const daysToShow = useMemo(
        () => allDays.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
        [allDays, page]
    );

    const toggle = (day: number, habit: Habit) => {
        if (habit === "pic" && !isPicAllowed(day)) return; // block PIC outside allowed days
        setState((prev) => ({ ...prev, [day]: { ...prev[day], [habit]: !prev[day][habit] } }));
    };

    const resetAll = () => {
        if (confirm("Reset all progress?")) {
            setState(makeEmptyState());
            setPage(0);
        }
    };

    // progress: PIC counts only on allowed days
    const percentDone = useMemo(() => {
        const baseTotal = TOTAL_DAYS * 4; // diet+water+book+workout
        const total = baseTotal + PIC_ACTIVE.size;
        let done = 0;
        for (let d = 1; d <= TOTAL_DAYS; d++) {
            const day = state[d];
            if (!day) continue;
            if (day.workout) done++;
            if (day.water) done++;
            if (day.diet) done++;
            if (day.book) done++;
            if (PIC_ACTIVE.has(d) && day.pic) done++;
        }
        return Math.round((done / total) * 100);
    }, [state]);

    return (
        <div className="min-h-screen w-full bg-[#1c6b6e] text-[#f7cbd0] antialiased">
            <main className="mx-auto max-w-sm px-4 pb-24">
                {/* Title */}
                <header className="pt-6 pb-4 text-center">
                    <h1 className="text-5xl font-extrabold tracking-tight lowercase">75 soft</h1>
                    <p className="mt-1 text-sm tracking-[0.25em] uppercase">Challenge Tracker</p>

                    {/* Date field (info only) */}
                    <div className="mt-4 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 rounded-2xl border-2 border-[#f7cbd0]/70 px-4 py-2">
                            <input
                                ref={dateRef}
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-40 bg-transparent text-center text-base font-semibold text-[#f7cbd0] outline-none [color-scheme:dark]"
                            />
                            <button
                                onClick={() => dateRef.current?.showPicker?.() || dateRef.current?.focus()}
                                className="rounded-lg p-1 hover:bg-[#f7cbd0]/10"
                                aria-label="Pick start date"
                            >
                                <Calendar className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="text-xs opacity-80">Start date: {formatDMY(startDate)}</div>
                    </div>
                </header>

                {/* Progress */}
                <section className="mb-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{percentDone}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-[#f7cbd0]/20">
                        <div className="h-full bg-[#f7cbd0] transition-all" style={{ width: `${percentDone}%` }} />
                    </div>
                </section>

                {/* TABLE — no background wrapper */}
                {/* Header labels (no bg) */}
                <div className="mb-2">
                    <div className="grid grid-cols-[auto_repeat(5,1fr)] items-center gap-1">
                        <div className="w-10 text-center text-[10px] uppercase tracking-[0.18em] opacity-80">
                            Day
                        </div>
                        {HABITS.map((h) => (
                            <div
                                key={`head-${h}`}
                                className="flex h-6 items-center justify-center text-[10px] uppercase tracking-[0.18em] opacity-90"
                            >
                                {habitLabel[h]}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rows (square cells, centered day number, tight gaps) */}
                <div className="space-y-2">
                    {daysToShow.map((day) => (
                        <div key={day}>
                            <div className="grid grid-cols-[auto_repeat(5,1fr)] items-center gap-1">
                                {/* Day number */}
                                <div className="flex w-10 items-center justify-center">
                                    <span className="text-base font-semibold leading-none">{day}</span>
                                </div>

                                {/* Habit cells */}
                                {HABITS.map((h) => (
                                    <Cell
                                        key={`${h}-${day}`}
                                        day={day}
                                        habit={h}
                                        active={state[day][h]}
                                        onClick={() => toggle(day, h)}
                                        disabled={h === "pic" && !isPicAllowed(day)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pager */}
                <div className="mt-6 flex items-center justify-between gap-3">
                    <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        className="flex-1 rounded-full bg-[#f7cbd0] px-5 py-3 text-base font-semibold text-[#1c6b6e] shadow-sm hover:opacity-95 disabled:opacity-50"
                        disabled={page === 0}
                    >
                        Previous week
                    </button>
                    <button
                        onClick={() => setPage((p) => Math.min(pagesCount - 1, p + 1))}
                        className="flex-1 rounded-full bg-[#f7cbd0] px-5 py-3 text-base font-semibold text-[#1c6b6e] shadow-sm hover:opacity-95 disabled:opacity-50"
                        disabled={page === pagesCount - 1}
                    >
                        Next week
                    </button>
                </div>

                {/* Reset */}
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={resetAll}
                        className="rounded-2xl bg-[#f7cbd0] px-6 py-3 text-base font-semibold text-[#1c6b6e] hover:opacity-90"
                    >
                        Reset all
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
                  disabled,
              }: {
    day: number;
    habit: Habit;
    active: boolean;
    onClick: () => void;
    disabled?: boolean;
}) {
    const Icon = ICON[habit];
    const iconColor = disabled ? "text-[#f7cbd0]/40" : active ? "text-black" : "text-[#f7cbd0]";
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={
                // perfect square, no rounded corners; bigger tap target
                "relative aspect-square min-h-[52px] w-full rounded-xl border-2 transition grid place-items-center " +
                (disabled
                    ? "border-[#f7cbd0]/30"
                    : active
                        ? "bg-[#f7cbd0] border-[#f7cbd0] shadow"
                        : "border-[#f7cbd0]/60 hover:border-[#f7cbd0] focus:ring-2 focus:ring-[#f7cbd0]/40")
            }
            aria-pressed={active}
            aria-label={`${habitLabel[habit]} — day ${day}`}
            title={`${habitLabel[habit]} — day ${day}`}
        >
            <Icon className={`block h-6 w-6 ${iconColor} transition-colors`} strokeWidth={2} />
        </button>
    );
}
