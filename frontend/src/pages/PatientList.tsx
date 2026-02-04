import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  Users, Search, Filter, Plus, ChevronRight, Loader2
} from 'lucide-react';

const PatientList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const FACILITY_INITIAL = "C";

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await api.get('/patients');
        
        /**
         * 1. Chronological Sort: Ensures the serial number is assigned based on 
         * the date of registration, keeping the System ID permanent.
         */
        const chronologicalData = response.data.sort((a: any, b: any) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        /**
         * 2. Map Serial Numbers: Assigns index-based IDs (1, 2, 3...)
         */
        const dataWithSerials = chronologicalData.map((patient: any, index: number) => ({
            ...patient,
            serialNumber: index + 1
        }));

        /**
         * 3. UI Display Sort: Reverse to show newest patients at the top.
         */
        setPatients([...dataWithSerials].reverse());
      } catch (err) {
        console.error("Failed to fetch patients", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  /**
   * Generates Registry ID: PT / (Initials) / (Facility) / (Year) / (Serial)
   */
  const generateSystemId = (name: string, serialNumber: number, createdAt: string) => {
    const nameInitials = name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase();
    
    const year = new Date(createdAt).getFullYear() || new Date().getFullYear();
    const serial = String(serialNumber).padStart(3, '0');
    
    return `PT/${nameInitials}/${FACILITY_INITIAL}/${year}/${serial}`;
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="font-bold tracking-tight uppercase text-xs">Accessing Clinical Registry...</p>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Patient Registry</h1>
          <p className="text-slate-500 font-medium">Manage and monitor all enrolled clinical cases</p>
        </div>
        <button 
          onClick={() => navigate('/add-patient')}
          className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-blue-200"
        >
          <Plus size={22} /> Enroll New Patient
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Search by name or phone number..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none font-medium transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          <Filter size={18} /> Filters
        </button>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Diagnosis</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Registry Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((p) => (
                <tr 
                  key={p.id} 
                  className="transition-all duration-200 group cursor-pointer hover:bg-blue-50/40"
                  onClick={() => navigate(`/patients/${p.id}`)}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-black text-[11px] tracking-tight border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                        {generateSystemId(p.name, p.serialNumber, p.createdAt)}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-base group-hover:text-blue-600 transition-colors uppercase">
                          {p.name}
                        </p>
                        <p className="text-sm text-slate-500 font-bold tracking-tight">{p.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-700">{p.diagnosis}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">TB Program Record</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                      p.status === 'ACTIVE' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' 
                        : 'bg-rose-50 text-rose-600 border-rose-100/50'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${p.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                      {p.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-xl text-[11px] font-black hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-200 group-hover:shadow-lg group-hover:border-slate-900">
                      OPEN FILE <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPatients.length === 0 && (
          <div className="py-32 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
               <Users className="text-slate-200" size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900">No Records Found</h3>
            <p className="text-slate-400 font-medium">Try searching with a different name or phone number.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;