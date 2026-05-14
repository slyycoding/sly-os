"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Terminal, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) { setError(error.message); } else { setSent(true); }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
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

        {sent ? (
          <Card className="border-green-500/30">
            <CardContent className="pt-6 text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto" />
              <h2 className="text-base font-semibold">Check your email</h2>
              <p className="text-sm text-muted-foreground">
                We sent a password reset link to <strong>{email}</strong>
              </p>
              <Link href="/login" className="block text-sm text-red-400 hover:text-red-300 mt-4">
                Back to sign in
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Reset your password</CardTitle>
              <CardDescription>Enter your email and we&apos;ll send a reset link</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-md border border-red-400/20">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : "Send reset link"}
                </Button>
              </form>
              <Link href="/login" className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
