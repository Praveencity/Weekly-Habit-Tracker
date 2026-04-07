import { useEffect, useMemo, useRef, useState } from "react";
import { login, me, register } from "./api/auth";
import { copyPlan, fetchLogs, fetchPlans, fetchSummary, saveLog, savePlan } from "./api/habits";
import DailyChecklist from "./components/DailyChecklist";
import HabitCalendar from "./components/HabitCalendar";
import HabitSummary from "./components/HabitSummary";
import AnalyticalGraph from "./components/AnalyticalGraph";
import WeekdayPlanner from "./components/WeekdayPlanner";
import TimeTable from "./components/TimeTable";
import CurrentTaskTimer from "./components/CurrentTaskTimer";
import { Toaster, toast } from "react-hot-toast";
import { MapPin, Mail, Bug } from "lucide-react";
import RedditIcon from "./components/RedditIcon";
import LinkedInIcon from "./components/LinkedInIcon";
import DiscordIcon from "./components/DiscordIcon";
import InstagramIcon from "./components/InstagramIcon";
import { addMonths, getDateKey, getMonthKey, getWeekdayFromDateKey, weekdayOrder } from "./utils/date";

const createEmptyPlan = (weekday) => ({
  weekday,
  title: `${weekday} Plan`,
  tasks: [],
});

const todayKey = getDateKey();
const todayMonth = getMonthKey();
const todayWeekday = getWeekdayFromDateKey(todayKey);
const authStorageKey = "daytask_token";
const themeStorageKey = "daytask_theme";

const defaultSummary = { streak: 0, completionRate: 0, completedDays: 0, partialDays: 0, emptyDays: 0 };

const defaultAuthForm = {
  name: "",
  email: "",
  password: "",
};

const getPlanMap = () =>
  weekdayOrder.reduce((accumulator, weekday) => {
    accumulator[weekday] = createEmptyPlan(weekday);
    return accumulator;
  }, {});

function AuthScreen({ mode, form, loading, error, onToggleMode, onChange, onSubmit, onGuestStart }) {
  return (
    <main className="auth-shell">
      <section className="auth-card panel">
          <p className="eyebrow">Weekly habit tracker</p>
        <h1>Login to your habit dashboard</h1>
        <p className="hero-copy">
          Your weekday plans, daily checkoffs, and streaks are stored per account. Sign in or create a new account to continue.
        </p>

        <div className="auth-toggle" style={{ flexWrap: "wrap", justifyContent: "center" }}>
          <button type="button" className={mode === "login" ? "primary-button" : "ghost-button"} onClick={() => onToggleMode("login")}>
            Login
          </button>
          <button type="button" className={mode === "register" ? "primary-button" : "ghost-button"} onClick={() => onToggleMode("register")}>
            Register
          </button>
          <button type="button" className="ghost-button" onClick={onGuestStart}>
            Explore as Guest
          </button>
        </div>

        {error ? <section className="panel error-banner auth-error">{error}</section> : null}

        <form className="auth-form" onSubmit={onSubmit}>
          {mode === "register" ? (
            <label>
              Name
              <input name="name" value={form.name} onChange={onChange} placeholder="Your name" required />
            </label>
          ) : null}

          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={onChange} placeholder="you@example.com" required />
          </label>

          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={onChange} placeholder="At least 6 characters" required />
          </label>

          <button type="submit" className="primary-button auth-submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function App() {
  const plannerSectionRef = useRef(null);
  const [theme, setTheme] = useState(() => localStorage.getItem(themeStorageKey) || "light");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(defaultAuthForm);
  const [appReady, setAppReady] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");

  const [plans, setPlans] = useState(getPlanMap);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(defaultSummary);
  const [selectedWeekday, setSelectedWeekday] = useState(todayWeekday);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [visibleMonth, setVisibleMonth] = useState(todayMonth);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [error, setError] = useState("");
  const [activeTimerTask, setActiveTimerTask] = useState(null);
  const [activeTimerStart, setActiveTimerStart] = useState(null);
  const [pausedTimerDuration, setPausedTimerDuration] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  const resetAppState = () => {
    setPlans(getPlanMap());
    setLogs([]);
    setSummary(defaultSummary);
    setSelectedWeekday(todayWeekday);
    setSelectedDate(todayKey);
    setVisibleMonth(todayMonth);
    setError("");
  };

  // Auto-complete checked at 85% elapsed
  useEffect(() => {
    if (!activeTimerTask || isTimerPaused || !activeTimerStart) return;

    const interval = setInterval(() => {
      const msElapsed = pausedTimerDuration + (Date.now() - activeTimerStart);
      const { startTime, endTime } = activeTimerTask;
      if (!startTime || !endTime) return;

      const parseTimeToMs = (timeStr) => {
        const [hours, minutes] = String(timeStr).split(':').map(Number);
        return (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
      };

      let startMs = parseTimeToMs(startTime);
      let endMs = parseTimeToMs(endTime);
      if (endMs < startMs) {
        endMs += 24 * 60 * 60 * 1000;
      }
      
      const totalDurationMs = endMs - startMs;
      
      if (msElapsed >= 0.80 * totalDurationMs) {
        const selectedLog = logs.find((l) => l.date === selectedDate) || {};
        const completedTaskIds = new Set(selectedLog.completedTaskIds || []);
        if (!completedTaskIds.has(activeTimerTask._id)) {
          // Fire completion
          handleToggleTask(activeTimerTask);
          toast.success(`${activeTimerTask.title} auto-completed (80% focused time)!`, { icon: '🎯', duration: 4000 });
        }
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [activeTimerTask, isTimerPaused, activeTimerStart, pausedTimerDuration, logs, selectedDate]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  useEffect(() => {
    const storedToken = localStorage.getItem(authStorageKey);
    if (!storedToken) {
      setAuthLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        const data = await me(storedToken);
        setUser(data.user);
      } catch (authError) {
        localStorage.removeItem(authStorageKey);
      } finally {
        setAuthLoading(false);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (!user && !isGuest) {
      return;
    }

    if (!user && isGuest) {
      setLoading(false);
      setAppReady(true);
      return;
    }

    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError("");
        const [plansData, monthLogs, monthSummary] = await Promise.all([
          fetchPlans(),
          fetchLogs(visibleMonth),
          fetchSummary(visibleMonth),
        ]);

        const normalized = weekdayOrder.reduce((accumulator, weekday) => {
          const plan = plansData.find((item) => item.weekday === weekday) || createEmptyPlan(weekday);
          accumulator[weekday] = {
            ...plan,
            tasks: Array.isArray(plan.tasks)
              ? plan.tasks.map((task, index) => ({
                  ...task,
                  order: Number.isFinite(task.order) ? task.order : index,
                }))
              : [],
          };
          return accumulator;
        }, {});

        setPlans(normalized);
        setLogs(monthLogs);
        setSummary(monthSummary);
      } catch (appError) {
        setError(appError.message);
      } finally {
        setLoading(false);
        setAppReady(true);
      }
    };

    loadInitialData();
  }, [user]);

  useEffect(() => {
    if ((!user && !isGuest) || !appReady) {
      return;
    }

    if (isGuest && !user) {
      return;
    }

    const loadVisibleMonth = async () => {
      try {
        setError("");
        const [monthLogs, monthSummary] = await Promise.all([
          fetchLogs(visibleMonth),
          fetchSummary(visibleMonth),
        ]);
        setLogs(monthLogs);
        setSummary(monthSummary);
      } catch (appError) {
        setError(appError.message);
      }
    };

    loadVisibleMonth();
  }, [visibleMonth, selectedDate, user, appReady]);

  const logsByDate = useMemo(
    () => logs.reduce((accumulator, log) => {
      accumulator[log.date] = log;
      return accumulator;
    }, {}),
    [logs]
  );

  const selectedPlan = plans[selectedWeekday] || createEmptyPlan(selectedWeekday);
  const selectedDateWeekday = getWeekdayFromDateKey(selectedDate);
  const selectedDatePlan = plans[selectedDateWeekday] || createEmptyPlan(selectedDateWeekday);
  const selectedLog = logsByDate[selectedDate] || { date: selectedDate, weekday: selectedDateWeekday, completedTaskIds: [], status: "none" };

  const updateSelectedPlan = (nextPlan) => {
    setPlans((currentPlans) => ({
      ...currentPlans,
      [selectedWeekday]: {
        ...nextPlan,
        weekday: selectedWeekday,
      },
    }));
  };

  const handleSavePlan = async () => {
    if (isGuest) return toast.error("Please login to save plans.");
    try {
      setSavingPlan(true);
      setError("");
      const savedPlan = await savePlan(selectedWeekday, selectedPlan);
      setPlans((currentPlans) => ({
        ...currentPlans,
        [selectedWeekday]: savedPlan,
      }));
      toast.success(`${selectedWeekday} plan saved!`);
    } catch (appError) {
      setError(appError.message);
      toast.error(appError.message);
    } finally {
      setSavingPlan(false);
    }
  };

  const handleCopyPlan = async (sourceWeekday) => {
    if (isGuest) return toast.error("Please login to copy plans.");
    try {
      setSavingPlan(true);
      setError("");
      const copiedPlan = await copyPlan({ sourceWeekday, targetWeekday: selectedWeekday });
      setPlans((currentPlans) => ({
        ...currentPlans,
        [selectedWeekday]: copiedPlan,
      }));
      toast.success(`Copied from ${sourceWeekday}!`);
    } catch (appError) {
      setError(appError.message);
      toast.error(appError.message);
    } finally {
      setSavingPlan(false);
    }
  };

  const persistSelectedDateLog = async (completedTaskIds) => {
    try {
      setSavingLog(true);
      setError("");
      const savedLog = await saveLog(selectedDate, {
        weekday: selectedDateWeekday,
        completedTaskIds,
        totalTasks: selectedDatePlan.tasks.length,
      });
      setLogs((currentLogs) => {
        const filteredLogs = currentLogs.filter((log) => log.date !== savedLog.date);
        return [...filteredLogs, savedLog].sort((firstLog, secondLog) => firstLog.date.localeCompare(secondLog.date));
      });
      const refreshedSummary = await fetchSummary(visibleMonth);
      setSummary(refreshedSummary);
    } catch (appError) {
      setError(appError.message);
    } finally {
      setSavingLog(false);
    }
  };

  const handleToggleTask = async (task) => {
    if (isGuest) return toast.error("Please login to complete tasks.");
    const completedTaskIds = new Set(selectedLog.completedTaskIds || []);
    if (completedTaskIds.has(task._id)) {
      completedTaskIds.delete(task._id);
    } else {
      completedTaskIds.add(task._id);
      toast.success(`${task.title} completed!`, { icon: '🎉', duration: 2000 });
      if (activeTimerTask && activeTimerTask._id === task._id) {
        setActiveTimerTask(null);
        setActiveTimerStart(null);
        setPausedTimerDuration(0);
        setIsTimerPaused(false);
      }
    }

    await persistSelectedDateLog([...completedTaskIds]);
  };

  const handleSelectDate = (dateKey) => {
    setSelectedDate(dateKey);
    setVisibleMonth(dateKey.slice(0, 7));
  };

  const handleEditSelectedDayPlan = () => {
    setSelectedWeekday(selectedDateWeekday);
    plannerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goToPreviousMonth = () => {
    const nextMonth = addMonths(visibleMonth, -1);
    setVisibleMonth(nextMonth);
    setSelectedDate(`${nextMonth}-01`);
  };

  const goToNextMonth = () => {
    const nextMonth = addMonths(visibleMonth, 1);
    setVisibleMonth(nextMonth);
    setSelectedDate(`${nextMonth}-01`);
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    try {
      setAuthLoading(true);
      setAuthError("");
      const payload = {
        name: authForm.name,
        email: authForm.email,
        password: authForm.password,
      };
      const result = authMode === "login" ? await login(payload) : await register(payload);
      localStorage.setItem(authStorageKey, result.token);
      setUser(result.user);
      setAuthForm(defaultAuthForm);
      resetAppState();
      setAppReady(false);
      toast.success(authMode === "login" ? "Logged in successfully!" : "Account created!");
    } catch (authError) {
      setAuthError(authError.message);
      toast.error(authError.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(authStorageKey);
    setUser(null);
    setAuthForm(defaultAuthForm);
    setAuthError("");
    resetAppState();
    toast.success("Logged out");
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  const selectedDayTasks = selectedDatePlan.tasks;

  if (authLoading && !user) {
    return (
      <main className="auth-shell">
        <section className="auth-card panel">
            <p className="eyebrow">Weekly habit tracker</p>
          <h1>Loading your account...</h1>
        </section>
      </main>
    );
  }

  if (!user && !isGuest) {
    return (
      <AuthScreen
        mode={authMode}
        form={authForm}
        loading={authLoading}
        error={authError}
        onToggleMode={setAuthMode}
        onChange={(event) => setAuthForm((current) => ({ ...current, [event.target.name]: event.target.value }))}
        onSubmit={handleAuthSubmit}
        onGuestStart={() => setIsGuest(true)}
      />
    );
  }

    return (
      <div className="app-shell">
      <Toaster position="top-center" toastOptions={{ style: { background: 'var(--surface-1)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '12px' } }} />
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <main className="app-layout">
          <nav className="navbar app-header-wave">
          <div className="navbar-brand">
              <p className="eyebrow">Weekly habit tracker</p>
          </div>
          <div className="navbar-actions">              {currentView === "dashboard" && (
                <button className="ghost-button" onClick={() => setCurrentView("timetable")}>
                  View Time Table
                </button>
              )}
              {user ? (
                <>
                  <span className="navbar-user">👋 {user.name}</span>
                  <button type="button" className="ghost-button" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <span className="navbar-user">👋 Guest</span>
                  <button type="button" className="ghost-button" onClick={() => setIsGuest(false)}>
                    Login / Register
                  </button>
                </>
              )}
            <div className="theme-toggle-wrapper" onClick={toggleTheme} role="button" tabIndex={0} aria-label="Toggle theme">
              <span className={`theme-text ${theme === "light" ? "active" : ""}`}>Light</span>
              <div className={`theme-toggle-pill ${theme}`}>
                <div className="moon-stars">
                  <span className="moon-star star-sz-lg" style={{ top: '6px', left: '10px' }}></span>
                  <span className="moon-star star-sz-sm" style={{ top: '6px', left: '30px' }}></span>
                  <span className="moon-star star-sz-sm" style={{ top: '16px', left: '6px' }}></span>
                  <span className="moon-star star-sz-md" style={{ top: '18px', left: '18px' }}></span>
                </div>
                <div className="theme-thumb"></div>
              </div>
              <span className={`theme-text ${theme === "dark" ? "active" : ""}`}>Dark</span>
            </div>
            </div>
          </nav>


        {currentView === "timetable" ? (
          <TimeTable plans={plans} onBack={() => setCurrentView("dashboard")} />
        ) : (
          <>
            <HabitSummary
              summary={summary}
              dayStatus={selectedLog.status || "none"}
              completedCount={(selectedLog.completedTaskIds || []).length}
              totalTasks={selectedDayTasks.length}
            />

            <section className="dashboard-grid">
          <div className="dashboard-main">
                            <CurrentTaskTimer 
                activeTimerTask={activeTimerTask} 
                activeTimerStart={activeTimerStart} 
                isTimerPaused={isTimerPaused}
                pausedTimerDuration={pausedTimerDuration}
                onPauseTimer={() => {
                  if (!isTimerPaused) {
                    const elapsed = Date.now() - activeTimerStart;
                    setPausedTimerDuration(pausedTimerDuration + elapsed);
                    setIsTimerPaused(true);
                  } else {
                    setActiveTimerStart(Date.now());
                    setIsTimerPaused(false);
                  }
                }}
                onStopTimer={() => {
                  setActiveTimerTask(null);
                  setActiveTimerStart(null);
                  setPausedTimerDuration(0);
                  setIsTimerPaused(false);
                }} 
              />
              <DailyChecklist
                dateKey={selectedDate}
                weekday={selectedDateWeekday}
                tasks={selectedDayTasks}
                log={selectedLog}
                onToggleTask={handleToggleTask}
                onEditPlan={handleEditSelectedDayPlan}
                activeTimerTask={activeTimerTask}
                onStartTimer={(task) => {
                  if (isGuest) return toast.error("Please login to use timer.");
                  setActiveTimerTask(task);
                  setActiveTimerStart(Date.now());
                  setPausedTimerDuration(0);
                  setIsTimerPaused(false);
                }}
              />
            </div>

            <aside className="dashboard-side">
              <HabitCalendar
                monthKey={visibleMonth}
                logsByDate={logsByDate}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                onPreviousMonth={goToPreviousMonth}
                onNextMonth={goToNextMonth}
              />
              <AnalyticalGraph logs={logs} plans={plans} />
            </aside>
        </section>

        <section className="dashboard-bottom">
          <div className="dashboard-bottom-grid">
            <div ref={plannerSectionRef}>
              <WeekdayPlanner
                selectedWeekday={selectedWeekday}
                plan={selectedPlan}
                saving={savingPlan}
                onSelectWeekday={setSelectedWeekday}
                onChangePlan={updateSelectedPlan}
                onSavePlan={handleSavePlan}
                onCopyPlan={handleCopyPlan}
              />
            </div>
          </div>
        </section>

        {loading ? <section className="panel loading-banner">Loading your habit dashboard...</section> : null}
        {savingLog ? <section className="panel loading-banner">Saving today&apos;s progress...</section> : null}
        </>
        )}

        <footer className="app-footer-wave" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} /> Location: New Delhi, India
            </span>
            <a href="mailto:contact@studyhabittracker.com" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none' }}>
              <Mail size={16} /> Contact Us
            </a>
            <a href="mailto:bugs@studyhabittracker.com?subject=Bug Report" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none' }}>
              <Bug size={16} /> Report Bug
            </a>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', opacity: 0.8, transition: 'opacity 0.2s' }} onMouseOver={(e) => e.currentTarget.style.opacity = 1} onMouseOut={(e) => e.currentTarget.style.opacity = 0.8}>
                <LinkedInIcon style={{ width: 22, height: 22, color: 'var(--text)' }} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', opacity: 0.8, transition: 'opacity 0.2s' }} onMouseOver={(e) => e.currentTarget.style.opacity = 1} onMouseOut={(e) => e.currentTarget.style.opacity = 0.8}>
                <InstagramIcon style={{ width: 22, height: 22, color: 'var(--text)' }} />
            </a>
            <a href="https://discord.com" target="_blank" rel="noreferrer" aria-label="Discord" style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', opacity: 0.8, transition: 'opacity 0.2s' }} onMouseOver={(e) => e.currentTarget.style.opacity = 1} onMouseOut={(e) => e.currentTarget.style.opacity = 0.8}>
                <DiscordIcon style={{ width: 22, height: 22, color: 'var(--text)' }} />
            </a>
            <a href="https://reddit.com" target="_blank" rel="noreferrer" aria-label="Reddit" style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', opacity: 0.8, transition: 'opacity 0.2s' }} onMouseOver={(e) => e.currentTarget.style.opacity = 1} onMouseOut={(e) => e.currentTarget.style.opacity = 0.8}>
                <RedditIcon style={{ width: 22, height: 22, color: 'var(--text)' }} />
            </a>
          </div>

            <p style={{ margin: 0, marginTop: '8px' }}>&copy; {new Date().getFullYear()} Weekly Habit Tracker. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}


