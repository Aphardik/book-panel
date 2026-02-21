"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/agt-panel/components/ui/card"
import { Button } from "@/agt-panel/components/ui/button"
import { useToast } from "@/agt-panel/hooks/use-toast"
import { booksApi, interestsApi, readersApi, ordersApi } from "@/agt-panel/lib/api-client"
import {
  BookOpen,
  Users,
  ShoppingCart,
  Heart,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalReaders: 0,
    totalOrders: 0,
    totalInterests: 0,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [recentInterests, setRecentInterests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)

        // Helper to extract array from potential object response
        const getList = (res: any, key: string) => {
          if (Array.isArray(res)) return res;
          if (res && res[key] && Array.isArray(res[key])) return res[key];
          return [];
        };

        const [booksRes, readersRes, ordersRes, interestsRes] = await Promise.allSettled([
          booksApi.getAll(),
          readersApi.getAll(),
          ordersApi.getAll(),
          interestsApi.getAll()
        ])

        const books = booksRes.status === 'fulfilled' ? booksRes.value : {};
        const readers = readersRes.status === 'fulfilled' ? readersRes.value : {};
        const orders = ordersRes.status === 'fulfilled' ? ordersRes.value : {};
        const interests = interestsRes.status === 'fulfilled' ? interestsRes.value : {};

        // Helper to extract total count from potential paginated response
        const getTotal = (res: any, fallbackList: any[]) => {
          if (res && res.pagination && typeof res.pagination.total === 'number') {
            return res.pagination.total;
          }
          return fallbackList.length;
        };

        const booksList = getList(books, 'books');
        const readersList = getList(readers, 'readers');
        const ordersList = getList(orders, 'orders');
        const interestsList = getList(interests, 'interests');

        setStats({
          totalBooks: getTotal(books, booksList),
          totalReaders: getTotal(readers, readersList),
          totalOrders: getTotal(orders, ordersList),
          totalInterests: getTotal(interests, interestsList),
        })

        setRecentOrders(ordersList.slice(0, 5))
        setRecentInterests(interestsList.slice(0, 5))

        // Optional: Notify if some requests failed
        const failedRequests = [booksRes, readersRes, ordersRes, interestsRes].filter(r => r.status === 'rejected');
        if (failedRequests.length > 0) {
          console.warn(`Partial Data Load: ${failedRequests.length} sources failed.`);
          // Suppressed toast to avoid confusion if data is mostly correct
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please check your connection.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const chartData = [
    { name: 'Books', count: stats.totalBooks },
    { name: 'Readers', count: stats.totalReaders },
    { name: 'Orders', count: stats.totalOrders },
    { name: 'Interests', count: stats.totalInterests },
  ]

  const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  const StatCard = ({ title, value, icon: Icon, color, description }: any) => (
    <Card className="overflow-hidden border-none shadow-xl transition-all duration-300 hover:scale-[1.02] bg-secondary dark:bg-slate-900/50 backdrop-blur-md group">
      <div className={`h-1.5 w-full ${color}`}></div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
            <h3 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 italic">
              {isLoading ? (
                <div className="h-9 w-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
              ) : (
                value
              )}
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5 font-medium">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <ArrowUpRight className="h-3 w-3" />
                </span>
                {description}
              </p>
            )}
          </div>
          <div className={`p-4 rounded-2xl ${color.replace('bg-', 'bg-opacity-15 text-')} transition-transform duration-300 group-hover:rotate-12`}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8  min-h-screen relative overflow-hidden">
      {/* Background blobs for a modern look */}
      <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-cyan-200/20 dark:bg-cyan-900/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 animate-pulse" />
      <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-purple-200/20 dark:bg-purple-900/10 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Analytics Overview
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Books"
          value={stats.totalBooks}
          icon={BookOpen}
          color="bg-cyan-500"
          description="In your library"
        />
        <StatCard
          title="Registered Readers"
          value={stats.totalReaders}
          icon={Users}
          color="bg-emerald-500"
          description="Active users"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          color="bg-amber-500"
          description="Pending & Fulfilled"
        />
        <StatCard
          title="Book Interests"
          value={stats.totalInterests}
          icon={Heart}
          color="bg-rose-500"
          description="Potential sales"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-xl border-none">
          <CardHeader>
            <CardTitle className="text-xl">Growth Statistics</CardTitle>
            <CardDescription>Comparison of library metrics</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={50}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-none">
          <CardHeader>
            <CardTitle className="text-xl">Data Distribution</CardTitle>
            <CardDescription>Metric proportions</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
        {/* Recent Orders Section */}
        <Card className="shadow-xl border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Recent Orders</CardTitle>
              <CardDescription>Latest orders from readers</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/orders')}>View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <ShoppingCart className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Order #{order.id}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.orderDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
                </div>
              )) : (
                <p className="text-sm text-center py-6 text-muted-foreground">No recent orders found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Interests Section */}
        {/* <Card className="shadow-xl border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Recent Interests</CardTitle>
              <CardDescription>Books users are following</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/interests')}>View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInterests.length > 0 ? recentInterests.map((interest) => (
                <div key={interest.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-rose-100 p-2 rounded-full">
                      <Heart className="h-4 w-4 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Interest Request</p>
                      <p className="text-xs text-muted-foreground">{interest.bookTitle || 'Unknown Book'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{interest.status}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-center py-6 text-muted-foreground">No recent interests found.</p>
              )}
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  )
}

function Badge({ children, variant = "default" }: any) {
  const styles = {
    default: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    secondary: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
  }
  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[variant as keyof typeof styles]}`}>
      {children}
    </span>
  )
}

