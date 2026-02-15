import { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, Activity, TrendingUp, Calendar, Heart, AlertCircle, CheckCircle,
  PhoneOff, Zap, TrendingDown, Clock, MapPin
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

interface EnrollmentMetrics {
  totalEnrollment: number;
  monthlyGrowth: number;
  ageDistribution: { [key: string]: number };
  genderRatio: { [key: string]: number };
  facilityLoad: { [key: string]: number };
  geographicClusters: { [key: string]: number };
}

interface ClinicalMetrics {
  diagnosisDistribution: { [key: string]: number };
  drugResistanceProfile: { [key: string]: number };
  hivCoinfectionRate: number;
  statusDistribution: { [key: string]: number };
}

interface AdherenceMetrics {
  refillPunctualityRate: number;
  daysLateAverage: number;
  ltfuRiskCount: number;
  appointmentAttendanceRate: number;
}

interface OperationalMetrics {
  treatmentSuccessRate: number;
  mortalityRate: number;
  averageRegimentDuration: number;
  systemUtilization: number;
}

const Reports = () => {
  // Period Selection
  const [reportPeriod, setReportPeriod] = useState<'month' | 'quarter' | 'half-year' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Metrics State
  const [enrollment, setEnrollment] = useState<EnrollmentMetrics>({
    totalEnrollment: 0,
    monthlyGrowth: 0,
    ageDistribution: {},
    genderRatio: {},
    facilityLoad: {},
    geographicClusters: {},
  });

  const [clinical, setClinical] = useState<ClinicalMetrics>({
    diagnosisDistribution: {},
    drugResistanceProfile: {},
    hivCoinfectionRate: 0,
    statusDistribution: {},
  });

  const [adherence, setAdherence] = useState<AdherenceMetrics>({
    refillPunctualityRate: 0,
    daysLateAverage: 0,
    ltfuRiskCount: 0,
    appointmentAttendanceRate: 0,
  });

  const [operational, setOperational] = useState<OperationalMetrics>({
    treatmentSuccessRate: 0,
    mortalityRate: 0,
    averageRegimentDuration: 0,
    systemUtilization: 0,
  });

  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  // Determine date range based on period selection
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(selectedYear, selectedMonth + 1, 0);

    if (reportPeriod === 'month') {
      startDate = new Date(selectedYear, selectedMonth, 1);
    } else if (reportPeriod === 'quarter') {
      const quarter = Math.floor(selectedMonth / 3);
      startDate = new Date(selectedYear, quarter * 3, 1);
      endDate = new Date(selectedYear, (quarter + 1) * 3, 0);
    } else if (reportPeriod === 'half-year') {
      const half = selectedMonth < 6 ? 0 : 6;
      startDate = new Date(selectedYear, half, 1);
      endDate = new Date(selectedYear, half + 6, 0);
    } else {
      startDate = new Date(selectedYear, 0, 1);
      endDate = new Date(selectedYear, 11, 31);
    }

    return { startDate, endDate };
  };

  const filterPatientsByDate = (patients: any[]) => {
    const { startDate, endDate } = getDateRange();
    return patients.filter((p) => {
      const createdDate = new Date(p.createdAt);
      return createdDate >= startDate && createdDate <= endDate;
    });
  };

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const [patientsRes, appointmentsRes] = await Promise.all([
          api.get('/patients'),
          api.get('/appointments'),
        ]);

        const allPatients = patientsRes.data;
        const appointments = appointmentsRes.data;
        const patients = filterPatientsByDate(allPatients);

        // ===== ENROLLMENT & DEMOGRAPHIC ANALYTICS =====
        const totalEnrollment = patients.length;
        
        // Age Distribution
        const ageGroups = {
          '0-14': patients.filter((p: any) => (p.age || 0) < 15).length,
          '15-24': patients.filter((p: any) => (p.age || 0) >= 15 && (p.age || 0) < 25).length,
          '25-44': patients.filter((p: any) => (p.age || 0) >= 25 && (p.age || 0) < 45).length,
          '45-64': patients.filter((p: any) => (p.age || 0) >= 45 && (p.age || 0) < 65).length,
          '65+': patients.filter((p: any) => (p.age || 0) >= 65).length,
        };

        // Gender Ratio
        const genderRatio = {
          Male: patients.filter((p: any) => p.sex?.toLowerCase() === 'male').length,
          Female: patients.filter((p: any) => p.sex?.toLowerCase() === 'female').length,
          Other: patients.filter((p: any) => !['male', 'female'].includes((p.sex || '').toLowerCase())).length,
        };

        // Facility Load (top 5)
        const facilityMap: { [key: string]: number } = {};
        patients.forEach((p: any) => {
          const facilityName = p.facility?.name || 'Unknown';
          facilityMap[facilityName] = (facilityMap[facilityName] || 0) + 1;
        });
        const facilityLoad = Object.fromEntries(
          Object.entries(facilityMap).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5)
        );

        // Geographic Clustering (by address/location)
        const geoMap: { [key: string]: number } = {};
        patients.forEach((p: any) => {
          // Extract location from address (last part after comma, or use full address)
          const address = p.address || 'Unknown Location';
          const locationParts = address.split(',');
          const location = locationParts[locationParts.length - 1].trim() || address;
          geoMap[location] = (geoMap[location] || 0) + 1;
        });
        const geographicClusters = Object.fromEntries(
          Object.entries(geoMap).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 10)
        );

        // Monthly Growth
        const previousMonth = new Date(selectedYear, selectedMonth, 0);
        const previousMonthPatients = allPatients.filter((p: any) => {
          const created = new Date(p.createdAt);
          return created.getMonth() === previousMonth.getMonth() && 
                 created.getFullYear() === previousMonth.getFullYear();
        }).length;
        const monthlyGrowth = previousMonthPatients > 0 
          ? ((totalEnrollment - previousMonthPatients) / previousMonthPatients) * 100 
          : 0;

        setEnrollment({
          totalEnrollment,
          monthlyGrowth,
          ageDistribution: ageGroups,
          genderRatio,
          facilityLoad,
          geographicClusters,
        });

        // ===== CLINICAL PROFILE ANALYTICS =====
        const diagnosisCount: { [key: string]: number } = {};
        patients.forEach((p: any) => {
          diagnosisCount[p.diagnosis || 'Unknown'] = (diagnosisCount[p.diagnosis || 'Unknown'] || 0) + 1;
        });

        // Drug Resistance (simulated based on diagnosis)
        const dsTb = patients.filter((p: any) => !p.diagnosis?.includes('MDR')).length;
        const mdrTb = patients.filter((p: any) => p.diagnosis?.includes('MDR')).length;

        // HIV Co-infection Rate (simulated - look for a flag in the data)
        const hivPositive = patients.filter((p: any) => (p as any).hivStatus === 'positive').length;
        const hivCoinfectionRate = patients.length > 0 ? (hivPositive / patients.length) * 100 : 0;

        // Status Distribution
        const statusCount: { [key: string]: number } = {};
        patients.forEach((p: any) => {
          const status = (p.status || 'ACTIVE').toUpperCase();
          statusCount[status] = (statusCount[status] || 0) + 1;
        });

        setClinical({
          diagnosisDistribution: diagnosisCount,
          drugResistanceProfile: { 'DS-TB': dsTb, 'MDR-TB': mdrTb },
          hivCoinfectionRate,
          statusDistribution: statusCount,
        });

        // ===== ADHERENCE & RETENTION ANALYTICS =====
        const today = new Date();
        let refillOnTime = 0;
        let totalRefills = 0;
        let totalDaysLate = 0;
        let ltfuRiskCount = 0;

        patients.forEach((p: any) => {
          if (p.nextRefillDate) {
            totalRefills++;
            const refillDate = new Date(p.nextRefillDate);
            const daysLate = Math.floor((today.getTime() - refillDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysLate === 0) refillOnTime++;
            totalDaysLate += Math.max(0, daysLate);
            if (daysLate > 7) ltfuRiskCount++;
          }
        });

        const refillPunctualityRate = totalRefills > 0 ? (refillOnTime / totalRefills) * 100 : 0;
        const daysLateAverage = totalRefills > 0 ? totalDaysLate / totalRefills : 0;

        // Appointment Attendance (simulated from appointments data)
        const appointmentsInPeriod = appointments.filter((a: any) => {
          const appDate = new Date(a.createdAt);
          const { startDate, endDate } = getDateRange();
          return appDate >= startDate && appDate <= endDate;
        }).length;
        const appointmentAttendanceRate = patients.length > 0 ? (appointmentsInPeriod / (patients.length * 4)) * 100 : 0;

        setAdherence({
          refillPunctualityRate: Math.min(refillPunctualityRate, 100),
          daysLateAverage: Math.round(daysLateAverage * 10) / 10,
          ltfuRiskCount,
          appointmentAttendanceRate: Math.min(appointmentAttendanceRate, 100),
        });

        // ===== OPERATIONAL & OUTCOME ANALYTICS =====
        const completed = patients.filter((p: any) => p.status?.toUpperCase() === 'COMPLETED').length;
        const treatmentSuccessRate = patients.length > 0 ? (completed / patients.length) * 100 : 0;
        
        // Mortality Rate (simulated - would need a specific status)
        const deceased = patients.filter((p: any) => p.status?.toUpperCase() === 'DECEASED').length;
        const mortalityRate = patients.length > 0 ? (deceased / patients.length) * 100 : 0;

        // Average Regiment Duration
        const completedPatients = patients.filter((p: any) => p.status?.toUpperCase() === 'COMPLETED');
        const avgDuration = completedPatients.length > 0
          ? completedPatients.reduce((sum: number, p: any) => {
              const start = new Date(p.treatmentStartDate || p.createdAt);
              const end = new Date(p.updatedAt || new Date());
              const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
              return sum + months;
            }, 0) / completedPatients.length
          : 0;

        setOperational({
          treatmentSuccessRate: Math.min(treatmentSuccessRate, 100),
          mortalityRate: Math.min(mortalityRate, 100),
          averageRegimentDuration: Math.round(avgDuration * 10) / 10,
          systemUtilization: patients.length,
        });

        // Chart data for monthly trends
        const monthlyData: { [key: string]: number } = {};
        patients.forEach((p: any) => {
          const createdDate = new Date(p.createdAt);
          const monthKey = createdDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
        });

        setChartData(
          Object.entries(monthlyData).map(([name, value]) => ({
            name,
            value: value as number,
          }))
        );

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch report data:', error);
        setLoading(false);
      }
    };

    fetchReportData();
  }, [reportPeriod, selectedMonth, selectedYear]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
        <h1 className="text-4xl font-black text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">Comprehensive TB Care Program Performance Analysis</p>
      </div>

      {/* Period Selection Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Period Type */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Report Period</label>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="month">Monthly</option>
              <option value="quarter">Quarterly</option>
              <option value="half-year">Half-Yearly</option>
              <option value="year">Yearly</option>
            </select>
          </div>

          {/* Year Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {[2026].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Month Selection (show for month view) */}
          {reportPeriod === 'month' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {months.map((month, idx) => (
                  <option key={idx} value={idx}>{month}</option>
                ))}
              </select>
            </div>
          )}

          {/* Quarter Selection (show for quarter view) */}
          {reportPeriod === 'quarter' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Quarter</label>
              <select
                value={Math.floor(selectedMonth / 3)}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value) * 3)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="0">Q1 (Jan-Mar)</option>
                <option value="1">Q2 (Apr-Jun)</option>
                <option value="2">Q3 (Jul-Sep)</option>
                <option value="3">Q4 (Oct-Dec)</option>
              </select>
            </div>
          )}

          {/* Half-Year Selection */}
          {reportPeriod === 'half-year' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Half-Year</label>
              <select
                value={selectedMonth < 6 ? 0 : 6}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="0">H1 (Jan-Jun)</option>
                <option value="6">H2 (Jul-Dec)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 1. ENROLLMENT & DEMOGRAPHIC ANALYTICS */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-8 border-l-4 border-blue-600">
        <div className="flex items-center gap-3 mb-6">
          <Users className="text-blue-600" size={32} />
          <h2 className="text-2xl font-black text-gray-900">1. Enrollment & Demographic Analytics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Total Enrollment */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-blue-500">
            <p className="text-gray-600 text-xs font-bold uppercase">Total Enrollment</p>
            <p className="text-3xl font-black text-blue-600 mt-2">{enrollment.totalEnrollment}</p>
            <p className="text-xs text-gray-500 mt-1">New Patients</p>
          </div>

          {/* Monthly Growth */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-green-500">
            <p className="text-gray-600 text-xs font-bold uppercase">Monthly Growth</p>
            <p className="text-3xl font-black text-green-600 mt-2">{enrollment.monthlyGrowth.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">Growth Rate</p>
          </div>

          {/* Age Distribution */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-purple-500">
            <p className="text-gray-600 text-xs font-bold uppercase">Avg Age Group</p>
            <p className="text-3xl font-black text-purple-600 mt-2">
              {Object.entries(enrollment.ageDistribution).reduce((max, [, v]) => Math.max(max, v), 0) > 0
                ? Object.entries(enrollment.ageDistribution).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0]
                : 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Largest Cohort</p>
          </div>

          {/* Gender Ratio */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-pink-500">
            <p className="text-gray-600 text-xs font-bold uppercase">Male/Female</p>
            <p className="text-2xl font-black text-pink-600 mt-2">
              {enrollment.genderRatio['Male']}M / {enrollment.genderRatio['Female']}F
            </p>
            <p className="text-xs text-gray-500 mt-1">Sex Distribution</p>
          </div>

          {/* Facility Count */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-orange-500">
            <p className="text-gray-600 text-xs font-bold uppercase">Facilities</p>
            <p className="text-3xl font-black text-orange-600 mt-2">{Object.keys(enrollment.facilityLoad).length}</p>
            <p className="text-xs text-gray-500 mt-1">Active Clinics</p>
          </div>
        </div>

        {/* Age Distribution Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 min-w-0 min-h-0">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Age Group Distribution</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={Object.entries(enrollment.ageDistribution).map(([name, value]) => ({ name, value }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-4 min-w-0 min-h-0">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Facility Load (Top 5)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={Object.entries(enrollment.facilityLoad).map(([name, value]) => ({ name, value }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={11} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Geographic Heatmap */}
          <div className="bg-white rounded-lg shadow p-4 border-2 border-blue-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin size={16} /> Geographic Distribution
            </h3>
            <div className="space-y-2">
              {Object.entries(enrollment.geographicClusters)
                .slice(0, 8)
                .map(([location, count], idx) => {
                  const maxCount = Math.max(...Object.values(enrollment.geographicClusters).map(v => v as number));
                  const percentage = (count as number) / maxCount * 100;
                  const colors = ['bg-blue-900', 'bg-blue-800', 'bg-blue-700', 'bg-blue-600', 'bg-blue-500', 'bg-blue-400', 'bg-blue-300', 'bg-blue-200'];
                  const colorClass = colors[Math.floor((percentage / 100) * (colors.length - 1))] || 'bg-blue-100';
                  
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-20 text-xs font-bold text-gray-700 truncate">{location}</div>
                      <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden border border-gray-300">
                        <div
                          className={`h-full ${colorClass} flex items-center justify-end pr-2 transition-all`}
                          style={{ width: `${percentage}%` }}
                        >
                          {percentage > 15 && <span className="text-xs font-bold text-white">{count}</span>}
                        </div>
                      </div>
                      <div className="w-12 text-right text-xs font-bold text-gray-700">{count}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* GEOGRAPHIC CLUSTERING HEATMAP */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-100 rounded-xl shadow-lg p-8 border-l-4 border-cyan-600">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="text-cyan-600" size={32} />
          <h2 className="text-2xl font-black text-gray-900">Geographic Clustering & Heatmap</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Geographic Distribution by Location */}
          <div className="bg-white rounded-lg shadow p-4 min-w-0 min-h-0">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Patient Distribution by Location (Top 10)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={Object.entries(enrollment.geographicClusters)
                  .map(([name, value]) => ({ name, value }))
                  .sort((a, b) => (b.value as number) - (a.value as number))}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="name" fontSize={10} width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#06b6d4" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Geographic Heat Grid */}
          <div className="bg-white rounded-lg shadow p-4 min-w-0 min-h-0">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Location Intensity Heatmap</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {Object.entries(enrollment.geographicClusters)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .map(([location, count], idx) => {
                  const maxCount = Math.max(...Object.values(enrollment.geographicClusters).map(v => v as number));
                  const percentage = ((count as number) / maxCount) * 100;
                  
                  // Color intensity based on patient count
                  const getHeatColor = (pct: number) => {
                    if (pct >= 80) return 'from-red-600 to-red-400'; // Hottest
                    if (pct >= 60) return 'from-orange-600 to-orange-400';
                    if (pct >= 40) return 'from-yellow-600 to-yellow-400';
                    if (pct >= 20) return 'from-blue-500 to-blue-300';
                    return 'from-blue-300 to-blue-100'; // Coolest
                  };
                  
                  const heatColor = getHeatColor(percentage);

                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-24">
                        <p className="text-xs font-bold text-gray-700 truncate">{location}</p>
                        <p className="text-xs text-gray-500">{count} patients</p>
                      </div>
                      <div className="flex-1 relative h-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <div
                          className={`h-full bg-gradient-to-r ${heatColor} transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-end pr-3">
                          <span className="text-xs font-bold text-gray-900 bg-white/80 px-2 py-1 rounded">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Geographic Summary Stats */}
        <div className="bg-white rounded-lg shadow p-6 border border-cyan-200">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Geographic Coverage Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-cyan-50 rounded-lg border-l-4 border-cyan-600">
              <p className="text-xs text-gray-600 font-bold">LOCATIONS COVERED</p>
              <p className="text-3xl font-black text-cyan-600 mt-2">{Object.keys(enrollment.geographicClusters).length}</p>
              <p className="text-xs text-gray-500 mt-1">Sub-Counties/Areas</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border-l-4 border-green-600">
              <p className="text-xs text-gray-600 font-bold">HIGHEST DENSITY</p>
              <p className="text-sm font-bold text-green-700 mt-2">
                {Object.entries(enrollment.geographicClusters)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {Object.entries(enrollment.geographicClusters)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[1] || 0} patients
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border-l-4 border-purple-600">
              <p className="text-xs text-gray-600 font-bold">LOWEST DENSITY</p>
              <p className="text-sm font-bold text-purple-700 mt-2">
                {Object.entries(enrollment.geographicClusters)
                  .sort((a, b) => (a[1] as number) - (b[1] as number))[0]?.[0] || 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {Object.entries(enrollment.geographicClusters)
                  .sort((a, b) => (a[1] as number) - (b[1] as number))[0]?.[1] || 0} patients
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border-l-4 border-orange-600">
              <p className="text-xs text-gray-600 font-bold">AVG PATIENTS/LOCATION</p>
              <p className="text-3xl font-black text-orange-600 mt-2">
                {Object.keys(enrollment.geographicClusters).length > 0
                  ? Math.round(
                      Object.values(enrollment.geographicClusters).reduce((a, b) => a + (b as number), 0) /
                        Object.keys(enrollment.geographicClusters).length
                    )
                  : 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Per Location</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CLINICAL PROFILE ANALYTICS */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-8 border-l-4 border-green-600">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="text-green-600" size={32} />
          <h2 className="text-2xl font-black text-gray-900">2. Clinical Profile Analytics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* DS-TB */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-blue-500">
            <p className="text-gray-600 text-xs font-bold uppercase">DS-TB Cases</p>
            <p className="text-3xl font-black text-blue-600 mt-2">{clinical.drugResistanceProfile['DS-TB'] || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Drug Sensitive</p>
          </div>

          {/* MDR-TB */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-red-500">
            <p className="text-gray-600 text-xs font-bold uppercase">MDR-TB Cases</p>
            <p className="text-3xl font-black text-red-600 mt-2">{clinical.drugResistanceProfile['MDR-TB'] || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Multi-Drug Resistant</p>
          </div>

          {/* HIV Co-infection */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-purple-500">
            <p className="text-gray-600 text-xs font-bold uppercase">HIV Co-infection</p>
            <p className="text-3xl font-black text-purple-600 mt-2">{clinical.hivCoinfectionRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">Of Total Cases</p>
          </div>

          {/* Most Common Diagnosis */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-orange-500">
            <p className="text-gray-600 text-xs font-bold uppercase">Diagnosis Type</p>
            <p className="text-sm font-bold text-orange-600 mt-2">
              {Object.entries(clinical.diagnosisDistribution).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Most Common</p>
          </div>
        </div>

        {/* Clinical Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4 min-w-0 min-h-0">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Drug Resistance Profile</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={Object.entries(clinical.drugResistanceProfile).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {['#3b82f6', '#ef4444'].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-4 min-w-0 min-h-0">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Case Status Distribution</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={Object.entries(clinical.statusDistribution).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. ADHERENCE & RETENTION ANALYTICS */}
      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-lg p-8 border-l-4 border-yellow-600">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="text-yellow-600" size={32} />
          <h2 className="text-2xl font-black text-gray-900">3. Adherence & Retention (Action Required)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Refill Punctuality */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-green-500">
            <p className="text-gray-600 text-xs font-bold uppercase">Refill Punctuality</p>
            <p className="text-3xl font-black text-green-600 mt-2">{adherence.refillPunctualityRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">On-Time Pickups</p>
          </div>

          {/* Days Late Average */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-orange-500">
            <p className="text-gray-600 text-xs font-bold uppercase">Days Late (Avg)</p>
            <p className="text-3xl font-black text-orange-600 mt-2">{adherence.daysLateAverage.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-1">Days Overdue</p>
          </div>

          {/* LTFU Risk Count */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs font-bold uppercase">LTFU Risk</p>
                <p className="text-3xl font-black text-red-600 mt-2">{adherence.ltfuRiskCount}</p>
                <p className="text-xs text-gray-500 mt-1">&gt;7 Days Overdue</p>
              </div>
              {adherence.ltfuRiskCount > 0 && <AlertCircle className="text-red-500" size={32} />}
            </div>
          </div>

          {/* Appointment Attendance */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-blue-500">
            <p className="text-gray-600 text-xs font-bold uppercase">Appointment Attendance</p>
            <p className="text-3xl font-black text-blue-600 mt-2">{adherence.appointmentAttendanceRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">Completed Visits</p>
          </div>
        </div>

        {/* Adherence Chart */}
        <div className="bg-white rounded-lg shadow p-4 min-w-0 min-h-0">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Adherence Metrics Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#f59e0b" name="Patient Enrollment" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. OPERATIONAL & OUTCOME ANALYTICS */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-8 border-l-4 border-purple-600">
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle className="text-purple-600" size={32} />
          <h2 className="text-2xl font-black text-gray-900">4. Operational & Outcome Analytics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Treatment Success Rate */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-green-500">
            <p className="text-gray-600 text-xs font-bold uppercase">Treatment Success Rate</p>
            <p className="text-3xl font-black text-green-600 mt-2">{operational.treatmentSuccessRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">Completed Treatment</p>
          </div>

          {/* Mortality Rate */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-red-500">
            <p className="text-gray-600 text-xs font-bold uppercase">Mortality Rate</p>
            <p className="text-3xl font-black text-red-600 mt-2">{operational.mortalityRate.toFixed(2)}%</p>
            <p className="text-xs text-gray-500 mt-1">Deaths During Treatment</p>
          </div>

          {/* Average Regiment Duration */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-blue-500">
            <p className="text-gray-600 text-xs font-bold uppercase">Avg Regiment Duration</p>
            <p className="text-3xl font-black text-blue-600 mt-2">{operational.averageRegimentDuration.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-1">Months to Completion</p>
          </div>

          {/* System Utilization */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-orange-500">
            <p className="text-gray-600 text-xs font-bold uppercase">System Utilization</p>
            <p className="text-3xl font-black text-orange-600 mt-2">{operational.systemUtilization}</p>
            <p className="text-xs text-gray-500 mt-1">Active Patient Records</p>
          </div>
        </div>

        {/* Outcome Metrics */}
        <div className="bg-white rounded-lg shadow p-4 min-w-0 min-h-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="py-4 border-r">
              <TrendingUp className="text-green-500 mx-auto mb-2" size={24} />
              <p className="text-xs text-gray-600">Success Rate</p>
              <p className="text-2xl font-black text-green-600">{operational.treatmentSuccessRate.toFixed(0)}%</p>
            </div>
            <div className="py-4 border-r">
              <TrendingDown className="text-red-500 mx-auto mb-2" size={24} />
              <p className="text-xs text-gray-600">Mortality</p>
              <p className="text-2xl font-black text-red-600">{operational.mortalityRate.toFixed(2)}%</p>
            </div>
            <div className="py-4 border-r">
              <Clock className="text-blue-500 mx-auto mb-2" size={24} />
              <p className="text-xs text-gray-600">Avg Duration</p>
              <p className="text-2xl font-black text-blue-600">{operational.averageRegimentDuration.toFixed(1)}mo</p>
            </div>
            <div className="py-4">
              <Zap className="text-orange-500 mx-auto mb-2" size={24} />
              <p className="text-xs text-gray-600">Utilization</p>
              <p className="text-2xl font-black text-orange-600">{operational.systemUtilization}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
