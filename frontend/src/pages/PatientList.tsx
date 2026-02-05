import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  Search, Filter, Loader2
} from 'lucide-react';

const PatientList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('All');

  const FACILITY_INITIAL = "C";

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await api.get('/patients');
        
        // Sort by creation date (oldest first for serial numbering)
        const chronologicalData = response.data.sort((a: any, b: any) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // Assign serial numbers for the System ID logic
        const dataWithSerials = chronologicalData.map((patient: any, index: number) => ({
            ...patient,
            serialNumber: index + 1
        }));

        // Display newest at the top
        setPatients([...dataWithSerials].reverse());
      } catch (err) {
        console.error("Failed to fetch patients", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const generateSystemId = (name: string = "Unknown", serialNumber: number = 0, createdAt: string = "") => {
    const nameInitials = name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase() || "NA";
    
    const year = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
    const serial = String(serialNumber).padStart(3, '0');
    
    return `PT/${nameInitials}/${FACILITY_INITIAL}/${year}/${serial}`;
  };

  const formatName = (name: string) => {
    if (!name) return "Unnamed Patient";
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getDiagnosisDisplay = (diagnosis: string) => {
    switch (diagnosis) {
      case 'Pulmonary Positive':
        return { label: 'P-Pos', style: 'bg-red-50 text-red-600 border-red-100' };
      case 'Pulmonary Negative':
        return { label: 'P-Neg', style: 'bg-green-50 text-green-600 border-green-100' };
      case 'Extra-pulmonary':
        return { label: 'EP', style: 'bg-amber-50 text-amber-600 border-amber-100' };
      case 'Drug Resistant':
      case 'MDR-TB':
        return { label: 'MDR', style: 'bg-violet-50 text-violet-600 border-violet-100' };
      default:
        return { label: diagnosis || 'N/A', style: 'bg-slate-50 text-slate-600 border-slate-100' };
    }
  };

  const filteredPatients = patients.filter(p => {
    const sysId = generateSystemId(p.name, p.serialNumber, p.createdAt).toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = 
      p.name?.toLowerCase().includes(searchLower) || 
      p.phone?.includes(searchTerm) ||
      sysId.includes(searchLower) ||
      (p.address && p.address.toLowerCase().includes(searchLower));
    
    const matchesDropdown = filterValue === 'All' || 
      p.gender === filterValue || 
      p.diagnosis === filterValue ||
      (filterValue === 'MDR-TB' && (p.diagnosis === 'Drug Resistant' || p.diagnosis === 'MDR-TB'));

    return matchesSearch && matchesDropdown;
  });

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="font-black tracking-tight uppercase text-[10px]">Accessing Clinical Registry...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Patient Registry</h1>
          <p className="text-slate-500 font-bold mt-1">Manage and monitor all enrolled clinical cases</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Search by ID, name, or phone..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none font-bold transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl px-4">
          <Filter size={18} className="text-slate-400 mr-2" />
          <select 
            className="bg-transparent outline-none font-black text-slate-600 text-sm cursor-pointer py-4 pr-2"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
          >
            <option value="All">All Records</option>
            <optgroup label="Sex">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </optgroup>
            <optgroup label="Diagnosis">
              <option value="Pulmonary Positive">P-Pos</option>
              <option value="Pulmonary Negative">P-Neg</option>
              <option value="Extra-pulmonary">EP</option>
              <option value="Drug Resistant">MDR-TB</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">System ID</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sex</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnosis</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((p) => {
                const diag = getDiagnosisDisplay(p.diagnosis);
                return (
                  <tr 
                    key={p.id} // FIX: Prisma uses id
                    className="transition-all duration-200 group cursor-pointer hover:bg-blue-50/40"
                    onClick={() => navigate(`/patients/${p.id}`)} // FIX: Prisma uses id
                  >
                    <td className="px-8 py-6 text-slate-400 font-bold text-sm">
                      {generateSystemId(p.name, p.serialNumber, p.createdAt)}
                    </td>
                    <td className="px-8 py-6 text-slate-900 font-black">
                      {formatName(p.name)}
                    </td>
                    <td className="px-8 py-6 text-slate-600 font-bold">
                      {p.sex || p.gender || 'N/A'}
                    </td>
                    <td className="px-8 py-6 text-slate-600 font-bold">
                      {p.phone}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-2 py-1 rounded-md border text-[10px] font-black uppercase tracking-wide ${diag.style}`}>
                        {diag.label}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        p.status === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {p.status || 'UNKNOWN'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredPatients.length === 0 && (
            <div className="py-20 text-center text-slate-400 font-bold">
              No matching clinical records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientList;