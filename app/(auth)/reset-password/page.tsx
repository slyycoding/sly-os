"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Terminal, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Supabase puts the session in the URL hash on redirect — detect it
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Also check if there's already a session (PKCE flow sets it via cookie)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => router.push("/"), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center glow-red">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-white">Sly OS</div>
            <div className="text-xs text-muted-foreground">Personal Life OS</div>
          </div>
        </div>

        {done ? (
          <Card className="border-green-500/30">
            <CardContent className="pt-6 text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto" />
              <h2 className="text-base font-semibold">Password updated!</h2>
              <p className="text-sm text-muted-foreground">Taking you to your dashboard…</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Set new password</CardTitle>
              <CardDescription>Choose a new password for your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-md border border-red-400/20">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading || !password || !confirm}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : "Update password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
