import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, TrendingUp, Percent, Coins, Eye, CircleDollarSign, AlertTriangle, PlayCircle, PauseCircle } from "lucide-react";

// Tip simplu pentru date produs
type ProductRow = {
  sku: string;
  name: string;
  rank: number | null; // buy_button_rank
  price: number;
  bestCompetitorPrice: number | null;
  stock: number;
  cpc: number; // cost per click curent
  clicks: number;
  conversions: number; // unități vândute
  adCost: number; // cost ads în fereastra curentă
  profitPerUnit: number; // profit net / unitate
  auto: boolean; // auto-optim pe acest SKU
};

const initialData: ProductRow[] = [
  {
    sku: "CAM.03",
    name: "Camera Auto DVR Nuvora 4K",
    rank: 2,
    price: 499.9,
    bestCompetitorPrice: 489.9,
    stock: 73,
    cpc: 1.9,
    clicks: 47,
    conversions: 2,
    adCost: 89.1,
    profitPerUnit: 26.2,
    auto: true,
  },
  {
    sku: "UV.01",
    name: "Sterilizator UV periute",
    rank: 4,
    price: 139.9,
    bestCompetitorPrice: 129.9,
    stock: 38,
    cpc: 0.85,
    clicks: 120,
    conversions: 8,
    adCost: 102,
    profitPerUnit: 26.2,
    auto: false,
  },
];

function format(n: number, d = 2) {
  return new Intl.NumberFormat("ro-RO", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
}

export default function Dashboard() {
  const [rows, setRows] = useState<ProductRow[]>(initialData);
  const [dailyBudget, setDailyBudget] = useState<number>(45);
  const [targetROAS, setTargetROAS] = useState<number>(8);
  const [autoGlobal, setAutoGlobal] = useState<boolean>(true);

  const kpis = useMemo(() => {
    const revenue = rows.reduce((s, r) => s + r.conversions * r.price, 0);
    const cost = rows.reduce((s, r) => s + r.adCost, 0);
    const profitGross = rows.reduce((s, r) => s + r.conversions * r.profitPerUnit, 0);
    const profitNet = profitGross - cost;
    const clicks = rows.reduce((s, r) => s + r.clicks, 0);
    const conv = rows.reduce((s, r) => s + r.conversions, 0);
    const cr = clicks > 0 ? (conv / clicks) * 100 : 0;
    const roas = cost > 0 ? revenue / cost : 0;
    return { revenue, cost, profitGross, profitNet, clicks, conv, cr, roas };
  }, [rows]);

  function suggestionFor(r: ProductRow) {
    const cr = r.clicks > 0 ? r.conversions / r.clicks : 0;
    const breakEvenCPC = r.profitPerUnit * cr; // CPC maxim sustenabil
    const roas = r.adCost > 0 ? (r.conversions * r.price) / r.adCost : 0;

    if (r.cpc > breakEvenCPC && cr < 0.03) {
      return { label: "Scade bid 10–15%", tone: "destructive" as const };
    }
    if ((r.rank ?? 99) > 3 && cr >= 0.03) {
      return { label: "Crește bid 5–10%", tone: "default" as const };
    }
    if (r.bestCompetitorPrice && r.bestCompetitorPrice < r.price && r.stock > 0) {
      return { label: "Scade preț 1–2%", tone: "secondary" as const };
    }
    if (roas < targetROAS && cr >= 0.03) {
      return { label: "Optimizează listarea (imagine/titlu)", tone: "secondary" as const };
    }
    return { label: "Menține", tone: "outline" as const };
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">eMAG Ads — Control Room</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Auto-optimizare</span>
            <Switch checked={autoGlobal} onCheckedChange={setAutoGlobal} />
            {autoGlobal ? <PlayCircle className="h-5 w-5" /> : <PauseCircle className="h-5 w-5" />}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-2xl">Acțiuni</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Generează fișier XLS pentru update bid</DropdownMenuItem>
              <DropdownMenuItem>Export KPI (CSV)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Venit (estim.)</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{format(kpis.revenue)} lei</CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Cost Ads</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{format(kpis.cost)} lei</CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Profit net</CardTitle></CardHeader>
          <CardContent className={`text-2xl font-semibold ${kpis.profitNet >= 0 ? "text-emerald-600" : "text-red-600"}`}>{format(kpis.profitNet)} lei</CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">ROAS</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{kpis.roas.toFixed(1)}x</CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="rounded-2xl shadow-sm mb-6">
        <CardHeader className="pb-2"><CardTitle className="text-base">Controale rapide</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600">Buget zilnic (lei)</label>
            <Input type="number" value={dailyBudget} onChange={(e)=>setDailyBudget(Number(e.target.value))} className="mt-2" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Țintă ROAS (x)</label>
            <Input type="number" value={targetROAS} onChange={(e)=>setTargetROAS(Number(e.target.value))} className="mt-2" />
          </div>
          <div className="flex items-end">
            <Button className="w-full"><TrendingUp className="mr-2 h-4 w-4"/>Aplică reguli acum</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="grid gap-4">
        {rows.map((r) => {
          const clicks = r.clicks;
          const cr = clicks > 0 ? r.conversions / clicks : 0;
          const cpa = r.conversions > 0 ? r.adCost / r.conversions : 0;
          const roas = r.adCost > 0 ? (r.conversions * r.price) / r.adCost : 0;
          const breakEvenCPC = r.profitPerUnit * cr;
          const suggest = suggestionFor(r);

          return (
            <Card key={r.sku} className="rounded-2xl shadow-sm">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{r.name} <span className="text-gray-400 font-normal">({r.sku})</span></CardTitle>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><Eye className="h-4 w-4"/>Rank: {r.rank ?? "-"}</span>
                      <span className="flex items-center gap-1"><CircleDollarSign className="h-4 w-4"/>CPC: {format(r.cpc)} lei</span>
                      <span className="flex items-center gap-1"><Percent className="h-4 w-4"/>CR: {(cr*100).toFixed(2)}%</span>
                      <span className="flex items-center gap-1"><Coins className="h-4 w-4"/>ROAS: {roas.toFixed(1)}x</span>
                      <span className="flex items-center gap-1"><AlertTriangle className="h-4 w-4"/>CPC BE: {format(breakEvenCPC)} lei</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={r.auto} onCheckedChange={(v)=> setRows(prev=>prev.map(x=>x.sku===r.sku?{...x, auto:v}:x))} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full"><MoreHorizontal className="h-5 w-5"/></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Editează preț</DropdownMenuItem>
                        <DropdownMenuItem>Generează update bid (XLS)</DropdownMenuItem>
                        <DropdownMenuItem>Suspendă ofertă</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
                  <div className="p-3 bg-white rounded-xl border">
                    <div className="text-gray-500">Preț</div>
                    <div className="font-semibold">{format(r.price)} lei</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border">
                    <div className="text-gray-500">Best competitor</div>
                    <div className="font-semibold">{r.bestCompetitorPrice ? `${format(r.bestCompetitorPrice)} lei` : "-"}</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border">
                    <div className="text-gray-500">Click-uri</div>
                    <div className="font-semibold">{clicks}</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border">
                    <div className="text-gray-500">Vânzări</div>
                    <div className="font-semibold">{r.conversions}</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border">
                    <div className="text-gray-500">Cost Ads</div>
                    <div className="font-semibold">{format(r.adCost)} lei</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border flex items-center justify-between">
                    <div>
                      <div className="text-gray-500">Sugestie</div>
                      <Badge variant={suggest.tone}>{suggest.label}</Badge>
                    </div>
                    <Button size="sm" className="rounded-xl">Aplică</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <footer className="text-xs text-gray-400 mt-8 text-center">
        MVP demo — conectarea la API eMAG + parser Ads XLS se face în backend. Aici vezi doar layout-ul și logica de UI/KPI.
      </footer>
    </div>
  );
}
