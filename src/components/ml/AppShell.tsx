import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, BookOpen, Bot, Briefcase, CandlestickChart, Flame, LayoutGrid, LineChart, Menu, Newspaper, Settings, Star, Trophy, Medal, User } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { fmtUSD } from "@/lib/market";
import { levelFor, startTicker, usePortfolio, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { TradeDialog } from "./TradeDialog";
import { Onboarding } from "./Onboarding";
import { TourCoach } from "./TourCoach";

export const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/markets", label: "Markets", icon: LineChart },
  { to: "/trade", label: "Trade", icon: CandlestickChart },
  { to: "/portfolio", label: "Portfolio", icon: Briefcase },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/challenges", label: "Challenges", icon: Trophy },
  { to: "/leaderboard", label: "Leaderboard", icon: Medal },
  { to: "/watchlist", label: "Watchlist", icon: Star },
] as const;
const EXTRA = [
  { to: "/meme", label: "Meme Market", icon: Flame },
  { to: "/coach", label: "AI Coach", icon: Bot },
  { to: "/news", label: "News", icon: Newspaper },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Logo() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2 font-semibold tracking-[0.18em]">
      <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-foreground text-[0.6rem] text-background">ML</span>
      <span className="text-sm">MARKETLAB</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const onboarded = useStore((s) => s.onboarded);
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    setHydrated(true);
    startTicker();
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  if (!hydrated) return <div className="min-h-screen bg-background" />;
  if (!onboarded) return <Onboarding />;

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <TopBar />
      <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">{children}</main>
      <BottomNav />
      <TradeDialog />
      <TourCoach />
    </div>
  );
}

function TopBar() {
  const { total } = usePortfolio();
  const cash = useStore((s) => s.cash);
  const xp = useStore((s) => s.xp);
  return (
    <header className="glass sticky top-0 z-30 border-b">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-6 px-4 md:px-6">
        <Logo />
        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} data-tour={`nav-${n.label.toLowerCase()}`} className="rounded px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "!text-foreground bg-muted" }}>
              {n.label}
            </Link>
          ))}
          <Link to="/meme" className="rounded px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground" activeProps={{ className: "!text-foreground bg-muted" }}>Meme</Link>
          <Link to="/coach" className="rounded px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground" activeProps={{ className: "!text-foreground bg-muted" }}>Coach</Link>
        </nav>
        <div className="ml-auto flex items-center gap-1 md:gap-3">
          <div className="hidden text-right sm:block">
            <div className="label-caps !text-[0.58rem]">Virtual cash</div>
            <div className="num text-sm">{fmtUSD(cash)}</div>
          </div>
          <div className="hidden text-right md:block">
            <div className="label-caps !text-[0.58rem]">Portfolio</div>
            <div className="num text-sm">{fmtUSD(total)}</div>
          </div>
          <Notifications />
          <Link to="/profile" aria-label="Profile" className="flex h-8 items-center gap-1.5 rounded-full bg-muted pl-1 pr-2.5 text-xs">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[0.6rem] font-bold text-background">{levelFor(xp)}</span>
            <span className="num hidden sm:inline">{xp} XP</span>
          </Link>
          <Link to="/settings" aria-label="Settings" className="hidden rounded p-2 text-muted-foreground hover:text-foreground sm:block"><Settings className="h-4 w-4" /></Link>
        </div>
      </div>
    </header>
  );
}

function Notifications() {
  const activity = useStore((s) => s.activity);
  const enabled = useStore((s) => s.notifications);
  const [seen, setSeen] = useState(activity.length);
  const unread = enabled ? Math.max(0, activity.length - seen) : 0;
  return (
    <Popover onOpenChange={(o) => o && setSeen(activity.length)}>
      <PopoverTrigger aria-label="Notifications" className="relative rounded p-2 text-muted-foreground hover:text-foreground">
        <Bell className="h-4 w-4" />
        {unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-gain" />}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="label-caps border-b px-4 py-3">Notifications</div>
        <div className="max-h-80 overflow-auto">
          {activity.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nothing yet. Make a trade or finish a lesson.</p>}
          {activity.slice(0, 15).map((a) => (
            <div key={a.id} className="border-b px-4 py-2.5 text-sm last:border-0">
              <div>{a.text}</div>
              <div className="num text-[0.65rem] text-muted-foreground">{new Date(a.ts).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const items = NAV.slice(0, 4);
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-30 border-t lg:hidden">
      <div className="grid grid-cols-5">
        {items.map((n) => (
          <Link key={n.to} to={n.to} data-tour={`nav-${n.label.toLowerCase()}`} className={cn("flex flex-col items-center gap-1 py-2.5 text-[0.65rem]", path.startsWith(n.to) ? "text-foreground" : "text-muted-foreground")}>
            <n.icon className="h-5 w-5" />
            {n.label}
          </Link>
        ))}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="flex flex-col items-center gap-1 py-2.5 text-[0.65rem] text-muted-foreground">
            <Menu className="h-5 w-5" />
            More
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetTitle className="label-caps mb-2">More</SheetTitle>
            <div className="grid grid-cols-3 gap-2 pb-4">
              {[...NAV.slice(4), ...EXTRA].map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 rounded-md bg-muted p-3 text-xs">
                  <n.icon className="h-5 w-5" />
                  {n.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
