import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  ArrowLeft, User, Phone, MapPin, Calendar, 
  Activity, Clock, AlertCircle, Edit2, Save, X,
  CheckCircle, Beaker, RefreshCw
} from 'lucide-react';

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // States
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
      setPatient(response.data);
      setEditForm(response.data); 
    } catch (err) {
      console.error("Error fetching patient details", err);
      setPatient(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPatientDetails();
  }, [fetchPatientDetails]);

  // --- UPDATE LOGIC ---
  
  // 1. Full Profile Update
  const handleSaveProfile = async () => {
    setUpdating(true);
    try {
      // Send the entire editForm to the backend
      const response = await api.put(`/patients/${id}`, editForm);
      // Sync the main view with the updated data from server
      setPatient(response.data);
      setIsEditing(false);
      showToast("Profile updated successfully");
    } catch (err) {
      console.error("Update failed", err);
      showToast("Error: Failed to update profile", "error");
    } finally {
      setUpdating(false);
    }
  };

  // 2. Medication Refill Update (Adds 28 days)
  const handleLogRefill = async () => {
    if (!window.confirm("Confirm Day 28 supply collection?")) return;
    setUpdating(true);
    try {
      const currentNextDate = new Date(patient.nextRefillDate);
      const newNextDate = new Date(currentNextDate.setDate(currentNextDate.getDate() + 28));
      
      await api.put(`/patients/${id}`, { 
        nextRefillDate: newNextDate, 
        status: 'ACTIVE' 
      });
      
      await fetchPatientDetails();
      showToast("Medication refill logged");
    } catch (err) {
      console.error("Refill log failed", err);
      showToast("Error: Update failed", "error");
    } finally {
      setUpdating(false);
    }
  };

  // 3. Status Toggle Update
  const handleStatusChange = async (newStatus: string) => {
    if (!window.confirm(`Change status to ${newStatus}?`)) return;
    setUpdating(true);
    try {
      await api.put(`/patients/${id}`, { status: newStatus });
      await fetchPatientDetails();
      showToast(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error("Status update failed", err);
      showToast("Error: Status update failed", "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-slate-500 font-medium bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
        <p className="font-bold tracking-tight text-slate-600">Loading clinical record...</p>
      </div>
    </div>
  );

  if (!patient) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-10 text-center space-y-4">
      <AlertCircle className="text-red-500" size={48} />
      <p className="text-slate-800 font-black text-xl">Patient record not found</p>
      <button onClick={() => navigate('/dashboard')} className="text-blue-600 font-bold hover:underline">
        Return to Dashboard
      </button>
    </div>
  );

  const isOverdue = new Date(patient.nextRefillDate) < new Date() && patient.status === 'ACTIVE';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 px-4 animate-in fade-in duration-500">
      {/* Navigation Header */}
      <div className="flex justify-between items-center mt-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>
        
        <button 
          onClick={() => {
            setIsEditing(!isEditing);
            if (!isEditing) setEditForm(patient); 
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
            isEditing ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
        >
          {isEditing ? <><X size={18} /> Cancel</> : <><Edit2 size={18} /> Edit Profile</>}
        </button>
      </div>

      {/* Profile Info Card */}
      <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] rotate-12">
            <User size={200} />
        </div>

        <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-8 rounded-2xl text-white shadow-2xl shadow-blue-200 relative shrink-0">
          <User size={56} />
          {patient.status === 'ACTIVE' && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 border-4 border-white rounded-full"></div>
          )}
        </div>
        
        <div className="flex-1 w-full space-y-5 z-10">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-top-2 duration-300">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                <input 
                  className="w-full mt-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                <input 
                  className="w-full mt-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
                  value={editForm.phone} 
                  onChange={e => setEditForm({...editForm, phone: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnosis</label>
                <select 
                  className="w-full mt-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none appearance-none font-bold text-slate-800"
                  value={editForm.diagnosis}
                  onChange={e => setEditForm({...editForm, diagnosis: e.target.value})}
                >
                  <option value="Pulmonary Positive">Pulmonary (+)</option>
                  <option value="Pulmonary Negative">Pulmonary (-)</option>
                  <option value="Extra-pulmonary">Extra-pulmonary</option>
                  <option value="Drug Resistant">Drug Resistant</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</label>
                <input 
                  className="w-full mt-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
                  value={editForm.address || ''} 
                  onChange={e => setEditForm({...editForm, address: e.target.value})} 
                  placeholder="Enter physical address"
                />
              </div>
              <div className="flex items-end md:col-span-1">
                <button 
                  onClick={handleSaveProfile}
                  disabled={updating}
                  className="w-full bg-slate-900 text-white px-10 py-3.5 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-blue-600 transition shadow-lg disabled:opacity-50 active:scale-95"
                >
                  {updating ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} 
                  Update Patient Record
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-4">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">{patient.name}</h2>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest ${patient.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                  {patient.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10 pt-2 border-t border-slate-50 mt-4">
                <div className="flex items-center gap-4 text-slate-600 font-semibold">
                  <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400"><Phone size={20} /></div>
                  {patient.phone}
                </div>
                <div className="flex items-center gap-4 text-slate-600 font-semibold">
                  <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400"><MapPin size={20} /></div>
                  {patient.address || 'Address not provided'}
                </div>
                <div className="flex items-center gap-4 text-slate-600 font-semibold">
                  <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400"><Beaker size={20} /></div>
                  {patient.diagnosis}
                </div>
                <div className="flex items-center gap-4 text-slate-600 font-semibold">
                  <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400"><Calendar size={20} /></div>
                  Enrolled: {new Date(patient.treatmentStartDate).toLocaleDateString('en-GB')}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-10 flex items-center gap-3">
            <Clock size={24} className="text-blue-600" /> Treatment Timeline
          </h3>
          
          <div className="relative border-l-2 border-slate-100 ml-4 space-y-14 py-2">
              <div className="relative pl-12">
                <div className="absolute -left-2.75 top-1.5 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-lg"></div>
                <p className="font-black text-slate-900">Treatment Initiation</p>
                <p className="text-sm text-slate-500 font-bold mt-1">Patient started regimen on {new Date(patient.treatmentStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>

              <div className="relative pl-12">
                <div className={`absolute -left-2.75 top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-lg ${isOverdue ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`}></div>
                <div className="flex flex-col gap-1.5">
                    <p className="font-black text-slate-900">Next Scheduled Refill</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`text-sm font-black flex items-center gap-2 px-3 py-1.5 rounded-xl border ${isOverdue ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                        <Calendar size={14} /> 
                        {new Date(patient.nextRefillDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {isOverdue && <span className="bg-rose-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100">Action Overdue</span>}
                    </div>
                </div>
              </div>
          </div>
        </div>
        
        {/* Sidebar Actions */}
        <div className="space-y-6">
          <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Activity size={18} className="text-blue-600" /> Clinical Actions
            </h3>
            <div className="space-y-4">
               <button 
                disabled={updating || patient.status !== 'ACTIVE'} 
                onClick={handleLogRefill} 
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none active:scale-95"
               >
                 {updating ? "Processing..." : "Log Medication Refill"}
               </button>
               
               <button 
                disabled={updating}
                onClick={() => handleStatusChange(patient.status === 'ACTIVE' ? 'DISCONTINUED' : 'ACTIVE')} 
                className={`w-full py-4 rounded-2xl font-black transition-all border-2 ${patient.status === 'ACTIVE' ? 'bg-white text-rose-600 border-rose-50 hover:bg-rose-50' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}
               >
                 {patient.status === 'ACTIVE' ? 'Discontinue Treatment' : 'Reinstate Treatment'}
               </button>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                <Activity size={120} />
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Patient Biometrics</p>
              <div className="mt-4 flex items-end gap-2">
                <p className="text-5xl font-black">{patient.age}</p>
                <p className="text-lg font-bold text-slate-500 mb-1.5">Years</p>
              </div>
              <p className="text-xl font-black text-blue-400 uppercase tracking-widest mt-2">{patient.sex}</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {toast.show && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-100 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-300 ${toast.type === 'success' ? 'bg-slate-900' : 'bg-rose-600'}`}>
          <div className="bg-white/20 p-1.5 rounded-full">
            {toast.type === 'success' ? <CheckCircle className="text-emerald-400" size={20} /> : <AlertCircle className="text-white" size={20} />}
          </div>
          <span className="font-black text-sm tracking-wide">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default PatientProfile;