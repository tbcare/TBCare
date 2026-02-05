import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  ArrowLeft, User, Phone, MapPin, Calendar, 
  Clock, AlertCircle, Edit2, Save, X,
  CheckCircle, Beaker, RefreshCw, Trash2
} from 'lucide-react';

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [toast, setToast] = useState<{ show: boolean, message: string; type: 'success' | 'error' }>({ 
    show: false, message: '', type: 'success' 
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchPatientDetails = useCallback(async () => {
    if (!id) return; 
    try {
      setLoading(true);
      const response = await api.get(`/patients/${id}`);
      // DEBUG: Ensure we handle both MongoDB _id and standard id
      const data = response.data;
      setPatient(data);
      setEditForm(data); 
    } catch (err) {
      console.error("Fetch Error:", err);
      setPatient(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPatientDetails();
  }, [fetchPatientDetails]);

  const formatName = (name: string) => {
    if (!name) return "";
    return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getDiagnosisDisplay = (diagnosis: string) => {
    switch (diagnosis) {
      case 'Pulmonary Positive': return { label: 'P-Pos', style: 'bg-red-50 text-red-600 border-red-100' };
      case 'Pulmonary Negative': return { label: 'P-Neg', style: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'Extra-pulmonary': return { label: 'EP', style: 'bg-amber-50 text-amber-600 border-amber-100' };
      case 'Drug Resistant':
      case 'MDR-TB': return { label: 'MDR', style: 'bg-violet-50 text-violet-600 border-violet-100' };
      default: return { label: diagnosis, style: 'bg-slate-50 text-slate-600 border-slate-100' };
    }
  };

  const handleSaveProfile = async () => {
    setUpdating(true);
    try {
      // Use id from params to ensure we hit the right endpoint
      const response = await api.put(`/patients/${id}`, editForm);
      setPatient(response.data);
      setIsEditing(false);
      showToast("Clinical profile updated");
    } catch (err) {
      console.error("Update Error:", err);
      showToast("Failed to update profile", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Permanently delete this clinical record?")) return;
    setUpdating(true);
    try {
      await api.delete(`/patients/${id}`);
      navigate('/patients'); 
    } catch (err) {
      showToast("Deletion failed", "error");
      setUpdating(false);
    }
  };

  const handleLogRefill = async () => {
    if (!window.confirm("Log collection of 28-day supply?")) return;
    setUpdating(true);
    try {
      // FIX: Improved date calculation to avoid mutation
      const baseDate = new Date(patient.nextRefillDate);
      const newNextDate = new Date(baseDate.getTime() + (28 * 24 * 60 * 60 * 1000));
      
      await api.put(`/patients/${id}`, { 
        nextRefillDate: newNextDate.toISOString(), 
        status: 'ACTIVE' 
      });
      
      await fetchPatientDetails();
      showToast("Refill cycle logged");
    } catch (err) {
      console.error("Refill Log Error:", err);
      showToast("Update failed", "error");
    } finally {
      setUpdating(false);
    }
  };

  // State guards
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
        <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Verifying Identity...</p>
      </div>
    </div>
  );

  if (!patient) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <AlertCircle className="text-rose-500" size={48} />
      <h2 className="text-2xl font-black text-slate-900">Record Not Found</h2>
      <button onClick={() => navigate('/patients')} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black hover:bg-blue-600 transition">
        Return to Registry
      </button>
    </div>
  );

  const isOverdue = new Date(patient.nextRefillDate) < new Date() && patient.status === 'ACTIVE';
  const diag = getDiagnosisDisplay(patient.diagnosis);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 px-4 animate-in fade-in duration-500">
      {/* Header & Actions */}
      <div className="flex justify-between items-center mt-8">
        <button onClick={() => navigate('/patients')} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Registry
        </button>
        <div className="flex gap-3">
            <button 
              onClick={() => { setIsEditing(!isEditing); if (!isEditing) setEditForm(patient); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black transition-all ${
                isEditing ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              {isEditing ? <><X size={18} /> Cancel</> : <><Edit2 size={18} /> Edit Profile</>}
            </button>
            {!isEditing && (
              <button onClick={handleDelete} className="p-2.5 bg-white text-slate-400 hover:text-rose-600 border border-slate-200 rounded-xl transition-colors">
                <Trash2 size={20} />
              </button>
            )}
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        <div className="bg-blue-600 p-8 rounded-2xl text-white shadow-xl relative shrink-0">
          <User size={48} />
          {patient.status === 'ACTIVE' && <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></div>}
        </div>
        
        <div className="flex-1 w-full space-y-4">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                <input className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-slate-800"
                  value={editForm?.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
                <input className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-slate-800"
                  value={editForm?.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</label>
                <input className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-slate-800"
                  value={editForm?.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <button onClick={handleSaveProfile} disabled={updating} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-blue-600 transition disabled:opacity-50">
                  {updating ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} Save Clinical Record
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-4">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">{formatName(patient.name)}</h2>
                <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wide ${diag.style}`}>
                    {diag.label}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-3 text-slate-600 font-bold">
                  <Phone size={18} className="text-blue-500" /> {patient.phone}
                </div>
                <div className="flex items-center gap-3 text-slate-600 font-bold">
                  <MapPin size={18} className="text-blue-500" /> {patient.address || 'No Address Provided'}
                </div>
                <div className="flex items-center gap-3 text-slate-600 font-bold">
                  <Calendar size={18} className="text-blue-500" /> Start: {new Date(patient.treatmentStartDate).toLocaleDateString('en-GB')}
                </div>
                <div className="flex items-center gap-3 text-slate-600 font-bold">
                  <Beaker size={18} className="text-blue-500" /> {patient.diagnosis}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Timeline and Refill Control */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3"><Clock size={24} className="text-blue-600" /> Treatment Timeline</h3>
          <div className="relative border-l-2 border-slate-100 ml-4 space-y-12 py-2">
              <div className="relative pl-10">
                <div className="absolute -left-2.5 top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-lg"></div>
                <p className="font-black text-slate-900 uppercase text-xs tracking-tight">Initiation</p>
                <p className="text-sm text-slate-500 font-bold mt-1">{new Date(patient.treatmentStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="relative pl-10">
                <div className={`absolute -left-2.5 top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-lg ${isOverdue ? 'bg-rose-500 animate-pulse' : 'bg-blue-400'}`}></div>
                <p className="font-black text-slate-900 uppercase text-xs tracking-tight">Next Refill Due</p>
                <p className={`text-sm font-black mt-1 ${isOverdue ? 'text-rose-600' : 'text-slate-500'}`}>
                    {new Date(patient.nextRefillDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {isOverdue && " (OVERDUE)"}
                </p>
              </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm h-fit">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Log Medication</h3>
          <div className="space-y-3">
             <button disabled={updating || patient.status !== 'ACTIVE'} onClick={handleLogRefill} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition disabled:bg-slate-100 disabled:text-slate-400 shadow-lg shadow-blue-100">
               {updating ? "Updating..." : "Confirm Refill"}
             </button>
             <button onClick={() => navigate('/patients')} className="w-full py-4 text-slate-500 font-black hover:bg-slate-50 rounded-2xl transition">
               Close Record
             </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <CheckCircle className="text-emerald-400" size={20} />
          <span className="font-black text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default PatientProfile;