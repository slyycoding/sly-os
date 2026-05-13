"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product, ProductCategory } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Package, Plus, Search, MoreVertical, Trash2, Edit2, Loader2, Star, AlertTriangle, RefreshCw } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "@/lib/hooks/use-toast";

const CATEGORIES: ProductCategory[] = ["skincare", "gym", "tech", "supplements", "grooming", "food", "software", "other"];
const CATEGORY_ICONS: Record<string, string> = {
  skincare: "🧴", gym: "🏋️", tech: "💻", supplements: "💊", grooming: "✂️", food: "🍎", software: "⚡", other: "📦",
};

interface ProductsClientProps {
  initialProducts: Product[];
  userId: string;
}

const EMPTY: Partial<Product> = {
  name: "", brand: null, category: "other", price: null, status: "active",
  rebuy: false, rating: null, notes: null, purchase_date: null, expiry_date: null,
};

export function ProductsClient({ initialProducts, userId }: ProductsClientProps) {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Product>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === "all" || p.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    filtered.forEach((p) => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [filtered]);

  async function saveProduct() {
    if (!editing.name?.trim()) return;
    setSaving(true);
    if (editing.id) {
      const { data, error } = await supabase.from("products").update({
        name: editing.name, brand: editing.brand ?? null, category: editing.category as ProductCategory,
        price: editing.price ?? null, status: editing.status as Product["status"],
        rebuy: editing.rebuy ?? false, rating: editing.rating ?? null, notes: editing.notes ?? null,
        purchase_date: editing.purchase_date ?? null, expiry_date: editing.expiry_date ?? null,
      }).eq("id", editing.id).select().single();
      if (!error && data) setProducts((prev) => prev.map((p) => p.id === data.id ? data : p));
    } else {
      const { data, error } = await supabase.from("products").insert({
        user_id: userId, name: editing.name, brand: editing.brand ?? null,
        category: (editing.category as ProductCategory) ?? "other",
        price: editing.price ?? null, status: (editing.status as Product["status"]) ?? "active",
        rebuy: editing.rebuy ?? false, rating: editing.rating ?? null, notes: editing.notes ?? null,
        purchase_date: editing.purchase_date ?? null, expiry_date: editing.expiry_date ?? null,
      }).select().single();
      if (!error && data) setProducts((prev) => [...prev, data]);
    }
    toast({ title: editing.id ? "Product updated" : "Product added" });
    setSaving(false);
    setDialogOpen(false);
    setEditing(EMPTY);
  }

  async function deleteProduct(id: string) {
    await supabase.from("products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Product removed" });
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: any; label: string }> = {
      active: { variant: "success", label: "Active" },
      running_low: { variant: "warning", label: "Running Low" },
      finished: { variant: "outline", label: "Finished" },
      discontinued: { variant: "danger", label: "Discontinued" },
    };
    return map[status] ?? { variant: "outline", label: status };
  };

  const runningLow = products.filter((p) => p.status === "running_low");

  return (
    <>
      <PageHeader
        icon={Package}
        title="Product List"
        description={`${products.length} products tracked`}
        actions={<Button size="sm" onClick={() => { setEditing(EMPTY); setDialogOpen(true); }} className="gap-1.5"><Plus className="w-4 h-4" />Add Product</Button>}
      />

      {/* Running low alert */}
      {runningLow.length > 0 && (
        <div className="mb-4 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-400">Running low</p>
            <p className="text-xs text-muted-foreground">{runningLow.map((p) => p.name).join(", ")}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_ICONS[c]} {c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="running_low">Running Low</SelectItem>
            <SelectItem value="finished">Finished</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products grouped by category */}
      {!filtered.length ? (
        <EmptyState icon={Package} title="No products" description={products.length ? "No products match your filters." : "Start tracking your products."} actionLabel="Add Product" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, prods]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {CATEGORY_ICONS[category]} {category} ({prods.length})
              </p>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {prods.map((product) => {
                  const { variant, label } = statusBadge(product.status);
                  return (
                    <Card key={product.id} className="group hover:border-border/80 transition-colors">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-medium truncate">{product.name}</h3>
                              <Badge variant={variant} className="text-xs shrink-0">{label}</Badge>
                            </div>
                            {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {product.price !== null && <span>{formatCurrency(product.price)}</span>}
                              {product.rating && (
                                <span className="flex items-center gap-0.5">
                                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {product.rating}/5
                                </span>
                              )}
                              {product.rebuy && <span className="flex items-center gap-0.5 text-green-400"><RefreshCw className="w-3 h-3" />Rebuy</span>}
                            </div>
                            {product.expiry_date && (
                              <p className="text-xs text-muted-foreground mt-1">Expires: {formatDate(product.expiry_date)}</p>
                            )}
                            {product.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.notes}</p>}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0">
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditing(product); setDialogOpen(true); }}><Edit2 className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteProduct(product.id)} className="text-red-400"><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditing(EMPTY); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing.id ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label>Name *</Label><Input placeholder="Product name" value={editing.name ?? ""} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} autoFocus /></div>
              <div className="space-y-1.5"><Label>Brand</Label><Input placeholder="Brand" value={editing.brand ?? ""} onChange={(e) => setEditing((p) => ({ ...p, brand: e.target.value || null }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={editing.category ?? "other"} onValueChange={(v) => setEditing((p) => ({ ...p, category: v as ProductCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_ICONS[c]} {c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editing.status ?? "active"} onValueChange={(v) => setEditing((p) => ({ ...p, status: v as Product["status"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="running_low">Running Low</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label>Price ($)</Label><Input type="number" step="0.01" value={editing.price ?? ""} onChange={(e) => setEditing((p) => ({ ...p, price: parseFloat(e.target.value) || null }))} /></div>
              <div className="space-y-1.5"><Label>Rating (1–5)</Label><Input type="number" min={1} max={5} value={editing.rating ?? ""} onChange={(e) => setEditing((p) => ({ ...p, rating: parseInt(e.target.value) || null }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label>Purchase date</Label><Input type="date" value={editing.purchase_date ?? ""} onChange={(e) => setEditing((p) => ({ ...p, purchase_date: e.target.value || null }))} /></div>
              <div className="space-y-1.5"><Label>Expiry date</Label><Input type="date" value={editing.expiry_date ?? ""} onChange={(e) => setEditing((p) => ({ ...p, expiry_date: e.target.value || null }))} /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="rebuy" checked={editing.rebuy ?? false} onChange={(e) => setEditing((p) => ({ ...p, rebuy: e.target.checked }))} className="w-4 h-4 rounded" />
              <Label htmlFor="rebuy" className="cursor-pointer">Will rebuy</Label>
            </div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea placeholder="Notes about this product…" value={editing.notes ?? ""} onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value || null }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveProduct} disabled={saving || !editing.name?.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing.id ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
