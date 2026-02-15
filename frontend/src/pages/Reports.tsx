import { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, Activity, TrendingUp, Calendar, Heart
} from 'lucide-react';

interface ReportMetrics {
  totalPatients: number;
  activePatients: number;
  completedTreatments: number;
  appointmentsThisMonth: number;
  averageTreatmentDuration: number;
}

interface ChartData {
  name: string;
  value: number;
  patients?: number;
  completed?: number;
}

const Reports = () => {
  const [metrics, setMetrics] = useState<ReportMetrics>({
    totalPatients: 0,
    activePatients: 0,
    completedTreatments: 0,
    appointmentsThisMonth: 0,
    averageTreatmentDuration: 0,
  });
  const [statusDistribution, setStatusDistribution] = useState<ChartData[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<ChartData[]>([]);
  const [diagnosisBreakdown, setDiagnosisBreakdown] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const [patientsRes, appointmentsRes] = await Promise.all([
          api.get('/patients'),
          api.get('/appointments'),
        ]);

        const patients = patientsRes.data;
        const appointments = appointmentsRes.data;

        // Calculate metrics
        const activePatients = patients.filter((p: any) => p.status === 'active').length;
        const completedTreatments = patients.filter((p: any) => p.status === 'completed').length;

        const currentMonthAppointments = appointments.filter((a: any) => {
          const appointmentDate = new Date(a.date);
          const today = new Date();
          return appointmentDate.getMonth() === today.getMonth() &&
                 appointmentDate.getFullYear() === today.getFullYear();
        }).length;

        setMetrics({
          totalPatients: patients.length,
          activePatients,
          completedTreatments,
          appointmentsThisMonth: currentMonthAppointments,
          averageTreatmentDuration: 6, // months - placeholder
        });

        // Status Distribution for Pie Chart
        const statusCount: { [key: string]: number } = {};
        patients.forEach((p: any) => {
          statusCount[p.status || 'unknown'] = (statusCount[p.status || 'unknown'] || 0) + 1;
        });

        setStatusDistribution(
          Object.entries(statusCount).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
          }))
        );

        // Diagnosis Breakdown
        const diagnosisCount: { [key: string]: number } = {};
        patients.forEach((p: any) => {
          diagnosisCount[p.diagnosis || 'unknown'] = (diagnosisCount[p.diagnosis || 'unknown'] || 0) + 1;
        });

        setDiagnosisBreakdown(
          Object.entries(diagnosisCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
        );

        // Monthly Trends (last 6 months)
        const monthlyData: { [key: string]: { patients: number; completed: number } } = {};
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          monthlyData[monthKey] = { patients: 0, completed: 0 };
        }

        patients.forEach((p: any) => {
          const createdDate = new Date(p.createdAt);
          const monthKey = createdDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          if (monthlyData[monthKey]) {
            monthlyData[monthKey].patients++;
          }
        });

        patients.forEach((p: any) => {
          if (p.status === 'completed') {
            const monthKey = new Date().toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            if (monthlyData[monthKey]) {
              monthlyData[monthKey].completed++;
            }
          }
        });

        setMonthlyTrends(
          Object.entries(monthlyData).map(([name, data]) => ({
            name,
            patients: data.patients,
            completed: data.completed,
            value: data.patients,
          }))
        );

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch report data:', error);
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">View key metrics and insights about patient care</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Patients */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.totalPatients}</p>
            </div>
            <Users className="text-blue-500" size={40} />
          </div>
        </div>

        {/* Active Patients */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Patients</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.activePatients}</p>
            </div>
            <Activity className="text-green-500" size={40} />
          </div>
        </div>

        {/* Completed Treatments */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.completedTreatments}</p>
            </div>
            <Heart className="text-emerald-500" size={40} />
          </div>
        </div>

        {/* Monthly Appointments */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Appointments</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.appointmentsThisMonth}</p>
              <p className="text-xs text-gray-500 mt-1">This Month</p>
            </div>
            <Calendar className="text-orange-500" size={40} />
          </div>
        </div>

        {/* Avg Treatment Duration */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avg Duration</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.averageTreatmentDuration}</p>
              <p className="text-xs text-gray-500 mt-1">Months</p>
            </div>
            <TrendingUp className="text-purple-500" size={40} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="patients" stroke="#3b82f6" name="New Patients" />
              <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Diagnosis Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Diagnoses</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={diagnosisBreakdown}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" name="Patient Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Reports;
