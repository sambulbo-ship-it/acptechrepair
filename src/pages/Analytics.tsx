import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplePlatform } from '@/hooks/useApplePlatform';
import { useRentalSale } from '@/hooks/useRentalSale';
import { useCloudData } from '@/hooks/useCloudData';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { 
  TrendingUp, 
  Euro, 
  Calendar, 
  ShoppingCart, 
  Users, 
  Package,
  Loader2,
  BarChart3,
  PieChartIcon,
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(142, 76%, 46%)', 'hsl(var(--warning))', '#8884d8', '#82ca9d'];

const Analytics = () => {
  const { language } = useLanguage();
  const { supportsLiquidGlass } = useApplePlatform();
  const { transactions, loading: transactionsLoading } = useRentalSale();
  const { machines, loading: machinesLoading } = useCloudData();
  const [activeTab, setActiveTab] = useState('overview');

  const dateLocale = language === 'fr' ? fr : enUS;

  const t = language === 'fr' ? {
    title: 'Tableau de bord',
    overview: 'Vue d\'ensemble',
    revenue: 'Revenus',
    utilization: 'Utilisation',
    clients: 'Clients',
    totalRevenue: 'Revenu total',
    rentalRevenue: 'Revenus location',
    saleRevenue: 'Revenus vente',
    activeRentals: 'Locations actives',
    totalSales: 'Ventes totales',
    utilizationRate: 'Taux d\'utilisation',
    monthlyRevenue: 'Revenus mensuels',
    revenueByType: 'Répartition revenus',
    topClients: 'Clients fréquents',
    machineUtilization: 'Utilisation machines',
    noData: 'Aucune donnée disponible',
    lastMonths: 'Derniers mois',
    rental: 'Location',
    sale: 'Vente',
    transactions: 'transactions',
    total: 'Total',
  } : {
    title: 'Dashboard',
    overview: 'Overview',
    revenue: 'Revenue',
    utilization: 'Utilization',
    clients: 'Clients',
    totalRevenue: 'Total Revenue',
    rentalRevenue: 'Rental Revenue',
    saleRevenue: 'Sales Revenue',
    activeRentals: 'Active Rentals',
    totalSales: 'Total Sales',
    utilizationRate: 'Utilization Rate',
    monthlyRevenue: 'Monthly Revenue',
    revenueByType: 'Revenue Distribution',
    topClients: 'Frequent Clients',
    machineUtilization: 'Machine Utilization',
    noData: 'No data available',
    lastMonths: 'Last months',
    rental: 'Rental',
    sale: 'Sale',
    transactions: 'transactions',
    total: 'Total',
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(now, 5 - i);
      return {
        month: format(date, 'MMM', { locale: dateLocale }),
        start: startOfMonth(date),
        end: endOfMonth(date),
        rentalRevenue: 0,
        saleRevenue: 0,
      };
    });

    let totalRentalRevenue = 0;
    let totalSaleRevenue = 0;
    let activeRentals = 0;
    let completedSales = 0;
    const clientTransactions: Record<string, { name: string; count: number; total: number }> = {};
    const machineRentals: Record<string, { name: string; count: number }> = {};

    transactions.forEach(tx => {
      const price = tx.agreed_price || 0;
      const txDate = parseISO(tx.start_date);

      // Monthly breakdown
      last6Months.forEach(month => {
        if (isWithinInterval(txDate, { start: month.start, end: month.end })) {
          if (tx.transaction_type === 'rental') {
            month.rentalRevenue += price;
          } else {
            month.saleRevenue += price;
          }
        }
      });

      // Totals
      if (tx.transaction_type === 'rental') {
        totalRentalRevenue += price;
        if (tx.status === 'active') activeRentals++;
      } else {
        totalSaleRevenue += price;
        if (tx.status === 'active' || tx.status === 'completed') completedSales++;
      }

      // Client stats
      const clientKey = tx.client_name || tx.client_email || 'Unknown';
      if (clientKey !== 'Unknown') {
        if (!clientTransactions[clientKey]) {
          clientTransactions[clientKey] = { name: clientKey, count: 0, total: 0 };
        }
        clientTransactions[clientKey].count++;
        clientTransactions[clientKey].total += price;
      }

      // Machine utilization
      if (tx.transaction_type === 'rental') {
        const machine = machines.find(m => m.id === tx.machine_id);
        const machineName = machine?.name || 'Unknown';
        if (!machineRentals[tx.machine_id]) {
          machineRentals[tx.machine_id] = { name: machineName, count: 0 };
        }
        machineRentals[tx.machine_id].count++;
      }
    });

    const topClients = Object.values(clientTransactions)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const machineUtilization = Object.values(machineRentals)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const utilizationRate = machines.length > 0 
      ? Math.round((activeRentals / machines.length) * 100) 
      : 0;

    return {
      totalRevenue: totalRentalRevenue + totalSaleRevenue,
      totalRentalRevenue,
      totalSaleRevenue,
      activeRentals,
      completedSales,
      utilizationRate,
      monthlyData: last6Months,
      topClients,
      machineUtilization,
      revenueByType: [
        { name: t.rental, value: totalRentalRevenue },
        { name: t.sale, value: totalSaleRevenue },
      ],
    };
  }, [transactions, machines, dateLocale, t.rental, t.sale]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const cardClass = cn(
    'p-4 rounded-xl border',
    supportsLiquidGlass ? 'glass-card' : 'bg-card border-border/30'
  );

  const loading = transactionsLoading || machinesLoading;

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col pb-20">
      <Header title={t.title} showBack />

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className={cn(cardClass, 'col-span-2')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.totalRevenue}</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Euro className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.activeRentals}</p>
                <p className="text-xl font-bold text-foreground">{stats.activeRentals}</p>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.totalSales}</p>
                <p className="text-xl font-bold text-foreground">{stats.completedSales}</p>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.utilizationRate}</p>
                <p className="text-xl font-bold text-foreground">{stats.utilizationRate}%</p>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.total}</p>
                <p className="text-xl font-bold text-foreground">{machines.length}</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={cn('grid w-full grid-cols-3', supportsLiquidGlass && 'glass')}>
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{t.revenue}</span>
            </TabsTrigger>
            <TabsTrigger value="utilization">
              <PieChartIcon className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{t.utilization}</span>
            </TabsTrigger>
            <TabsTrigger value="clients">
              <Users className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{t.clients}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Monthly Revenue Chart */}
            <div className={cardClass}>
              <h3 className="text-sm font-semibold mb-4">{t.monthlyRevenue}</h3>
              {stats.monthlyData.some(d => d.rentalRevenue > 0 || d.saleRevenue > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="rentalRevenue" name={t.rental} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="saleRevenue" name={t.sale} fill="hsl(142, 76%, 46%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  {t.noData}
                </div>
              )}
            </div>

            {/* Revenue by Type */}
            <div className={cardClass}>
              <h3 className="text-sm font-semibold mb-4">{t.revenueByType}</h3>
              {stats.totalRevenue > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie
                        data={stats.revenueByType}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                      >
                        {stats.revenueByType.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }} />
                        <span className="text-sm text-muted-foreground">{t.rental}</span>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(stats.totalRentalRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[1] }} />
                        <span className="text-sm text-muted-foreground">{t.sale}</span>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(stats.totalSaleRevenue)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[120px] flex items-center justify-center text-muted-foreground">
                  {t.noData}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="utilization" className="mt-4 space-y-4">
            <div className={cardClass}>
              <h3 className="text-sm font-semibold mb-4">{t.machineUtilization}</h3>
              {stats.machineUtilization.length > 0 ? (
                <div className="space-y-3">
                  {stats.machineUtilization.map((machine, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-foreground truncate flex-1">{machine.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {machine.count} {t.transactions}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  {t.noData}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="clients" className="mt-4 space-y-4">
            <div className={cardClass}>
              <h3 className="text-sm font-semibold mb-4">{t.topClients}</h3>
              {stats.topClients.length > 0 ? (
                <div className="space-y-3">
                  {stats.topClients.map((client, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {idx + 1}
                        </div>
                        <span className="text-sm text-foreground font-medium">{client.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(client.total)}</p>
                        <p className="text-xs text-muted-foreground">{client.count} {t.transactions}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  {t.noData}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Analytics;
