import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export function AuthScreen() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "up") {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin, data: { username: username.trim() || email.split("@")[0] } },
      });
      if (error) toast.error(error.message);
      else if (!data.session) toast.success("Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    }
    setBusy(false);
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  };

  return (
    <div className="grid-bg relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/70 to-background" />
      <div className="relative w-full max-w-sm animate-rise">
        <p className="label-caps mb-3">Virtual trading simulator</p>
        <h1 className="text-4xl font-semibold tracking-tight">MARKETLAB</h1>
        <p className="mt-2 text-sm text-muted-foreground">Learn the market. Practice your strategy. Risk nothing.</p>
        <div className="panel mt-8 p-5">
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-md bg-muted p-1 text-sm">
            {(["in", "up"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`rounded py-1.5 ${mode === m ? "bg-background" : "text-muted-foreground"}`}>{m === "in" ? "Sign in" : "Create account"}</button>)}
          </div>
          <Button variant="terminal" className="w-full" onClick={google}>Continue with Google</Button>
          <div className="label-caps my-4 text-center">or</div>
          <form onSubmit={submit} className="space-y-3">
            {mode === "up" && <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />}
            <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" variant="gain" className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Create account"}</Button>
          </form>
        </div>
        <div className="mt-6 rounded-md border border-warn/40 bg-warn/10 px-4 py-2.5 text-center text-[0.7rem] font-semibold tracking-[0.14em] text-warn">VIRTUAL MONEY — NO REAL MONEY INVOLVED</div>
      </div>
    </div>
  );
}
