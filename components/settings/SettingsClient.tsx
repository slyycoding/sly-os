"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Loader2, LogOut, Download, User, Shield, Terminal } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";

interface SettingsClientProps {
  profile: Profile | null;
  userId: string;
}

export function SettingsClient({ profile, userId }: SettingsClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(profile?.full_name ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function saveProfile() {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", userId);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Profile saved" });
    router.refresh();
  }

  async function changePassword() {
    if (!newPassword || newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" }); return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" }); return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Password updated" });
    setNewPassword(""); setConfirmPassword("");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function exportData() {
    toast({ title: "Export started", description: "Data export will be available shortly." });
  }

  return (
    <>
      <PageHeader icon={Settings} title="Settings" description="Manage your account and preferences" />

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4" />Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url ?? ""} />
                <AvatarFallback className="bg-red-500/20 text-red-400 text-xl">
                  {name ? getInitials(name) : "S"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{name || "Your Name"}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={profile?.email ?? ""} disabled className="opacity-60" />
            </div>
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4" />Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input type="password" placeholder="Min. 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm password</Label>
              <Input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button onClick={changePassword} disabled={saving || !newPassword || !confirmPassword} variant="outline">
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* App info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Terminal className="w-4 h-4" />About</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center glow-red">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">Sly OS</p>
                <p className="text-xs text-muted-foreground">v0.1.0 · Personal Life Operating System</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Built with Next.js 14, Supabase, and shadcn/ui. Dark mode, mobile-ready, and production-grade.</p>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Download className="w-4 h-4" />Data</CardTitle>
            <CardDescription>Export or manage your personal data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" onClick={exportData} className="gap-2 w-full sm:w-auto">
              <Download className="w-4 h-4" /> Export All Data
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Sign out */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Sign out</p>
            <p className="text-xs text-muted-foreground">Sign out of your Sly OS account</p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="gap-2 text-red-400 border-red-500/30 hover:bg-red-500/10">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </div>
    </>
  );
}
