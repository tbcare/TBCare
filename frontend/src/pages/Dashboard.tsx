import { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  User, ClipboardList, Plus, 
  AlertCircle, Clock, CheckCircle, 
  BarChart3, Activity
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, Cell
} from 'recharts';
import AddPatientModal from '../components/AddPatientModal';

interface Patient {
  id: string;
  name: string;
  phone: string;
  diagnosis: string;
  status: string;
  nextRefillDate: string;
  createdAt: string;
}

const Dashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients');
      setPatients(response.data);
    } catch (err) {
      console.error("Failed to load patients", err);
    }
  };

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // --- LOGIC CALCULATIONS ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let dueTodayCount = 0;
  let pastDueCount = 0;
  let monthlyTotalDue = 0;
  let monthlyAttended = 0;

  const diagCounts: Record<string, number> = {
    'P-Pos': 0, 'P-Neg': 0, 'EP': 0, 'MDR': 0
  };

  patients.forEach(p => {
    const rDate = new Date(p.nextRefillDate);
    const rDateMonth = rDate.getMonth();
    const rDateYear = rDate.getFullYear();
    rDate.setHours(0, 0, 0, 0);

    if (p.status === 'ACTIVE') {
      if (rDate.getTime() === today.getTime()) dueTodayCount++;
      if (rDate.getTime() < today.getTime()) pastDueCount++;
    }

    if (rDateMonth === currentMonth && rDateYear === currentYear) {
      monthlyTotalDue++;
      if (rDate > today || p.status !== 'ACTIVE') monthlyAttended++;
    }

    if (p.diagnosis === 'Pulmonary Positive') diagCounts['P-Pos']++;
    else if (p.diagnosis === 'Pulmonary Negative') diagCounts['P-Neg']++;
    else if (p.diagnosis === 'Extra-pulmonary') diagCounts['EP']++;
    else if (p.diagnosis === 'Drug Resistant' || p.diagnosis === 'MDR-TB') diagCounts['MDR']++;
  });

  const currentAdherenceRate = monthlyTotalDue > 0 
    ? Math.round((monthlyAttended / monthlyTotalDue) * 100) 
    : 100;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const adherenceTrendData = [
    { month: monthNames[(currentMonth - 2 + 12) % 12], rate: 85 }, 
    { month: monthNames[(currentMonth - 1 + 12) % 12], rate: 92 }, 
    { month: monthNames[currentMonth], rate: currentAdherenceRate }, 
  ];

  const diagnosisData = [
    { name: 'P-Pos', count: diagCounts['P-Pos'], color: '#ef4444' }, 
    { name: 'P-Neg', count: diagCounts['P-Neg'], color: '#3b82f6' }, // Themed Blue
    { name: 'EP', count: diagCounts['EP'], color: '#f59e0b' }, 
    { name: 'MDR', count: diagCounts['MDR'], color: '#8b5cf6' }, 
  ];

  return (
    <div className="space-y-6 relative max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Dashboard</h1>
            <p className="text-slate-500 font-bold text-sm">Clinical overview and treatment analytics</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black hover:bg-blue-600 transition flex items-center gap-2 shadow-xl active:scale-95"
        >
          <Plus size={20} /> New Enrollment
        </button>
      </div>

      {/* Standardized Compact Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* DUE TODAY - Blue Theme */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 h-24 transition-all hover:border-blue-200">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-tight">Due Today</p>
            <p className="text-2xl font-black text-slate-900">{dueTodayCount}</p>
          </div>
        </div>

        {/* CLINICAL ALERTS - Rose Theme */}
        <div className={`p-4 rounded-2xl border flex items-center gap-4 h-24 transition-all duration-500 bg-white ${
          pastDueCount > 0 
            ? 'border-rose-200 shadow-[0_4px_12px_rgba(244,63,94,0.08)]' 
            : 'border-slate-200 shadow-sm'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            pastDueCount > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-50 text-slate-400'
          }`}>
            <AlertCircle size={22} />
          </div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest leading-tight ${pastDueCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              Clinical Alerts
            </p>
            <p className="text-2xl font-black text-slate-900">{pastDueCount}</p>
          </div>
        </div>

        {/* ACTIVE PATIENTS - Emerald Theme */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 h-24 sm:col-span-2 lg:col-span-1">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
            <User size={22} />
          </div>
          <div>
            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest leading-tight">Active Patients</p>
            <p className="text-2xl font-black text-slate-900">
              {patients.filter(p => p.status === 'ACTIVE').length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Adherence Rate Line Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="mb-8 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Activity className="text-emerald-500" size={24} />
              <h3 className="font-black text-slate-800 text-xl">Treatment Adherence</h3>
            </div>
            <span className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black">
              {currentAdherenceRate}% Score
            </span>
          </div>
          <div className="h-[320px] w-full min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={adherenceTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 800}} dy={10} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '15px'}} 
                  itemStyle={{fontWeight: 900, color: '#059669'}}
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#10b981" 
                  strokeWidth={6} 
                  dot={{ r: 8, fill: '#10b981', strokeWidth: 4, stroke: '#fff' }} 
                  activeDot={{ r: 10, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diagnosis Bar Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="text-blue-600" size={24} />
            <h3 className="font-black text-slate-800 text-xl">Burden by Diagnosis</h3>
          </div>
          <div className="h-[320px] w-full min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diagnosisData} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 900}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none'}} />
                <Bar dataKey="count" radius={[12, 12, 0, 0]} barSize={50}>
                  {diagnosisData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {toast.show && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <CheckCircle className="text-emerald-400" size={20} />
          <span className="font-black text-sm tracking-wide">{toast.message}</span>
        </div>
      )}

      <AddPatientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={() => { fetchPatients(); showToast("Clinical Records Updated"); }} 
      />
    </div>
  );
};

export default Dashboard;