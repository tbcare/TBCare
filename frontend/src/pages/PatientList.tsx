import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  Search, Filter, Loader2, Edit2, Trash2, CheckSquare, Square
} from 'lucide-react';

const PatientList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('All');
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const FACILITY_INITIAL = "C";

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await api.get('/patients');
        
        const chronologicalData = response.data.sort((a: any, b: any) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        const dataWithSerials = chronologicalData.map((patient: any, index: number) => ({
            ...patient,
            serialNumber: index + 1
        }));

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

  const togglePatientSelection = (patientId: string) => {
    const newSelected = new Set(selectedPatients);
    if (newSelected.has(patientId)) {
      newSelected.delete(patientId);
    } else {
      newSelected.add(patientId);
    }
    setSelectedPatients(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedPatients.size === filteredPatients.length && selectedPatients.size > 0) {
      setSelectedPatients(new Set());
    } else {
      const allIds = new Set(filteredPatients.map(p => p.id));
      setSelectedPatients(allIds);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    try {
      await api.delete(`/patients/${patientId}`);
      setPatients(patients.filter(p => p.id !== patientId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Failed to delete patient", err);
      alert("Failed to delete patient");
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedPatients.size} patient(s)?`)) {
      try {
        await Promise.all(
          Array.from(selectedPatients).map(id => api.delete(`/patients/${id}`))
        );
        setPatients(patients.filter(p => !selectedPatients.has(p.id)));
        setSelectedPatients(new Set());
        setShowCheckboxes(false);
      } catch (err) {
        console.error("Failed to delete patients", err);
        alert("Failed to delete some patients");
      }
    }
  };

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
        <div className="flex gap-3">
          <button
            onClick={() => setShowCheckboxes(!showCheckboxes)}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              showCheckboxes
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {showCheckboxes ? '✓ Selection Mode' : 'Select'}
          </button>
          {selectedPatients.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 transition-all flex items-center gap-2"
            >
              <Trash2 size={18} />
              Delete ({selectedPatients.size})
            </button>
          )}
        </div>
      </div>

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

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                {showCheckboxes && (
                  <th className="px-6 py-6 text-center">
                    <button
                      onClick={toggleSelectAll}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {selectedPatients.size === filteredPatients.length && filteredPatients.length > 0 ? (
                        <CheckSquare size={20} className="text-blue-600" />
                      ) : (
                        <Square size={20} className="text-slate-400" />
                      )}
                    </button>
                  </th>
                )}
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">System ID</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sex</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnosis</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((p) => {
                const diag = getDiagnosisDisplay(p.diagnosis);
                const isSelected = selectedPatients.has(p.id);
                return (
                  <tr 
                    key={p.id}
                    className={`transition-all duration-200 group hover:bg-blue-50/40 ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    {showCheckboxes && (
                      <td className="px-6 py-6 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePatientSelection(p.id);
                          }}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare size={20} className="text-blue-600" />
                          ) : (
                            <Square size={20} className="text-slate-400" />
                          )}
                        </button>
                      </td>
                    )}
                    <td 
                      className="px-8 py-6 text-slate-400 font-bold text-sm cursor-pointer"
                      onClick={() => navigate(`/patients/${p.id}`)}
                    >
                      {generateSystemId(p.name, p.serialNumber, p.createdAt)}
                    </td>
                    <td 
                      className="px-8 py-6 text-slate-900 font-black cursor-pointer"
                      onClick={() => navigate(`/patients/${p.id}`)}
                    >
                      {formatName(p.name)}
                    </td>
                    <td 
                      className="px-8 py-6 text-slate-600 font-bold cursor-pointer"
                      onClick={() => navigate(`/patients/${p.id}`)}
                    >
                      {p.sex || p.gender || 'N/A'}
                    </td>
                    <td 
                      className="px-8 py-6 text-slate-600 font-bold cursor-pointer"
                      onClick={() => navigate(`/patients/${p.id}`)}
                    >
                      {p.phone}
                    </td>
                    <td 
                      className="px-8 py-6 cursor-pointer"
                      onClick={() => navigate(`/patients/${p.id}`)}
                    >
                      <span className={`px-2 py-1 rounded-md border text-[10px] font-black uppercase tracking-wide ${diag.style}`}>
                        {diag.label}
                      </span>
                    </td>
                    <td 
                      className="px-8 py-6 cursor-pointer"
                      onClick={() => navigate(`/patients/${p.id}`)}
                    >
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        p.status === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {p.status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-8 py-6 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/edit-patient/${p.id}`, { state: { patient: p } });
                        }}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                        title="Edit patient"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(p.id);
                        }}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                        title="Delete patient"
                      >
                        <Trash2 size={18} />
                      </button>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-in fade-in zoom-in">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Delete Patient Record?</h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this patient's data? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await handleDeletePatient(deleteConfirm);
                }}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-all"
              >
                No, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;