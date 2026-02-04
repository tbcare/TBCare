import { useEffect, useState } from 'react'; // 'React' import removed to fix ts(6133)
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  User, Calendar, Phone, ClipboardList, Plus, 
  ChevronRight, AlertCircle, Clock, Search, 
  Filter, Trash2, Edit3, CheckCircle 
} from 'lucide-react';
import AddPatientModal from '../components/AddPatientModal';

// Define a basic interface for better type safety
interface Patient {
  id: string;
  name: string;
  phone: string;
  diagnosis: string;
  patientType: string;
  nextRefillDate: string;
}

const Dashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: '', name: '' });
  const [toast, setToast] = useState<{ show: boolean, message: string }>({ show: false, message: '' });

  const navigate = useNavigate();

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients');
      setPatients(response.data);
    } catch (err) {
      console.error("Failed to load patients", err);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  // --- NAVIGATION LOGIC ---
  const handleViewOrUpdate = (id: string) => {
    navigate(`/patient/${id}`);
  };

  // --- DELETE LOGIC ---
  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/patients/${deleteModal.id}`);
      setDeleteModal({ isOpen: false, id: '', name: '' });
      fetchPatients();
      showToast("Patient record successfully removed");
    } catch (err) {
      console.error("Delete failed", err);
      showToast("Error: Could not delete record");
    }
  };

  const openDeleteModal = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); 
    setDeleteModal({ isOpen: true, id, name });
  };

  const handleEditClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    handleViewOrUpdate(id);
  };

  // --- STATS CALCULATION ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueTodayCount = patients.filter((p) => {
    const d = new Date(p.nextRefillDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;

  const pastDueCount = patients.filter((p) => {
    const d = new Date(p.nextRefillDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  }).length;

  const filteredPatients = patients.filter((p) => {
    const nameMatch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = p.phone?.includes(searchTerm);
    const matchesSearch = nameMatch || phoneMatch;
    const matchesDropdown = filterType === 'ALL' || p.diagnosis === filterType;
    return matchesSearch && matchesDropdown;
  });

  // --- STYLING HELPERS ---
  const getPatientTypeStyle = (type: string) => 
    type === 'NEW' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100';

  const getDiagnosisStyle = (diag: string) => {
    const styles: Record<string, string> = {
      'Drug Resistant': 'bg-rose-50 text-rose-700 border-rose-100',
      'Extra-pulmonary': 'bg-purple-50 text-purple-700 border-purple-100',
    };
    return styles[diag] || 'bg-blue-50 text-blue-700 border-blue-100';
  };

  return (
    <div className="space-y-6 relative max-w-7xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ClipboardList className="text-blue-600" size={28} /> Clinical Dashboard
          </h2>
          <p className="text-slate-500 text-sm font-medium">Monitoring active TB treatment courses</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Updated: min-w-60 is the canonical class for 240px */}
          <div className="relative flex-1 min-w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              className="pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer text-slate-700 font-bold"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">All Diagnoses</option>
              <option value="Pulmonary Positive">Pulmonary (+)</option>
              <option value="Pulmonary Negative">Pulmonary (-)</option>
              <option value="Extra-pulmonary">Extra-pulmonary</option>
              <option value="Drug Resistant">Drug Resistant</option>
            </select>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95"
          >
            <Plus size={20} /> Add Patient
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-amber-200 transition-colors">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors"><Clock size={24} /></div>
          <div>
            {/* Updated: tracking-widest is the canonical class for 0.1em */}
            <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">Due Today</p>
            <p className="text-2xl font-black text-slate-900">{dueTodayCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-rose-200 transition-colors">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-100 transition-colors"><AlertCircle size={24} /></div>
          <div>
            {/* Updated: tracking-widest is the canonical class for 0.1em */}
            <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest">Past Due</p>
            <p className="text-2xl font-black text-slate-900">{pastDueCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-blue-200 transition-colors sm:col-span-2 lg:col-span-1">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors"><User size={24} /></div>
          <div>
            {/* Updated: tracking-widest is the canonical class for 0.1em */}
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Total Enrolled</p>
            <p className="text-2xl font-black text-slate-900">{patients.length}</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Classification</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Refill Date</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => {
                  const rDate = new Date(patient.nextRefillDate);
                  rDate.setHours(0,0,0,0);
                  const isPastDue = rDate.getTime() < today.getTime();
                  const isToday = rDate.getTime() === today.getTime();

                  return (
                    <tr 
                      key={patient.id} 
                      onClick={() => handleViewOrUpdate(patient.id)}
                      className="hover:bg-blue-50/30 transition cursor-pointer group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 group-hover:text-blue-700 transition-colors">{patient.name}</p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                              <Phone size={12} className="opacity-70" /> {patient.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border w-fit tracking-tight ${getPatientTypeStyle(patient.patientType)}`}>
                            {patient.patientType}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border w-fit tracking-tight ${getDiagnosisStyle(patient.diagnosis)}`}>
                            {patient.diagnosis}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-2 w-fit ${
                          isPastDue ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                          isToday ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          <Calendar size={14} /> {rDate.toLocaleDateString('en-GB')}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button 
                            onClick={(e) => handleEditClick(e, patient.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Update Profile"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={(e) => openDeleteModal(e, patient.id, patient.name)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Record"
                          >
                            <Trash2 size={18} />
                          </button>
                          <div className="flex items-center px-1">
                            <ChevronRight size={18} className="text-slate-300" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Search size={40} className="opacity-20" />
                      <p className="font-bold">No clinical records match your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {deleteModal.isOpen && (
        /* Updated: z-100 is the canonical class for z-index 100 */
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Delete Record?</h3>
              <p className="text-slate-500 mt-3 text-sm leading-relaxed font-medium">
                You are about to remove <span className="font-black text-slate-900">"{deleteModal.name}"</span>. 
                This will permanently erase their clinical history.
              </p>
            </div>
            <div className="flex p-4 gap-3 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setDeleteModal({ isOpen: false, id: '', name: '' })}
                className="flex-1 px-6 py-3 text-slate-600 font-black hover:bg-white rounded-xl transition"
              >
                Keep
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="flex-1 px-6 py-3 bg-rose-600 text-white font-black hover:bg-rose-700 rounded-xl transition shadow-lg shadow-rose-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {toast.show && (
        /* Updated: z-110 is the canonical class for z-index 110 */
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-110 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-emerald-500/20 p-1 rounded-full">
            <CheckCircle className="text-emerald-400" size={18} />
          </div>
          <span className="font-black text-sm tracking-wide">{toast.message}</span>
        </div>
      )}

      <AddPatientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={fetchPatients} 
      />
    </div>
  );
};

export default Dashboard;