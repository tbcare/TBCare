import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  ArrowLeft, 
  Save, 
  UserPlus, 
  Phone, 
  CheckCircle, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

const AddPatient = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    diagnosis: 'TB Category I',
    status: 'ACTIVE',
    nextRefillDate: new Date().toISOString().split('T')[0]
  });

  const showModal = (message: string, type: 'success' | 'error') => {
    setModal({ show: true, message, type });
  };

  const closeModal = () => {
    setModal({ show: false, message: '', type: 'success' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/patients', formData);
      showModal("Patient enrolled successfully!", "success");
    } catch (err) {
      console.error("Enrollment failed", err);
      showModal("Failed to enroll patient. Please check your connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Registry
        </button>
      </div>

      <div className="bg-white rounded-4xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Banner */}
        <div className="bg-slate-900 p-8 text-white flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <UserPlus size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Enroll New Patient</h1>
            <p className="text-slate-400 font-medium text-sm">Create a new clinical record in the registry</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Personal Details Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-4 h-0.5 bg-blue-600"></span> Personal Details
              </h3>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-slate-900"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    required
                    type="tel"
                    className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-slate-900"
                    placeholder="+233..."
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Clinical Details Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-4 h-0.5 bg-emerald-600"></span> Clinical Info
              </h3>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Diagnosis Category</label>
                <div className="relative">
                  <select 
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-bold text-slate-700 appearance-none"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                  >
                    <option value="TB Category I">TB Category I</option>
                    <option value="TB Category II">TB Category II</option>
                    <option value="MDR-TB">MDR-TB</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Initial Refill Date</label>
                <input
                  required
                  type="date"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-bold text-slate-700"
                  value={formData.nextRefillDate}
                  onChange={(e) => setFormData({...formData, nextRefillDate: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium italic">
              * Ensure all details are verified against clinical card.
            </p>
            <button
              disabled={loading}
              type="submit"
              className="flex items-center gap-3 bg-blue-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-blue-200 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Processing...
                </>
              ) : (
                <>
                  <Save size={20} /> Complete Enrollment
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal Popup Feedback */}
      {modal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-in fade-in zoom-in">
            <div className="flex items-center justify-center mb-4">
              {modal.type === 'success' ? (
                <CheckCircle className="text-emerald-500" size={48} />
              ) : (
                <AlertCircle className="text-red-500" size={48} />
              )}
            </div>
            
            <h2 className={`text-xl font-bold text-center mb-2 ${
              modal.type === 'success' ? 'text-slate-900' : 'text-red-600'
            }`}>
              {modal.type === 'success' ? 'Success!' : 'Error'}
            </h2>
            
            <p className="text-slate-600 text-center mb-6">
              {modal.message}
            </p>
            
            <button
              onClick={() => {
                closeModal();
                if (modal.type === 'success') {
                  navigate('/patients');
                }
              }}
              className={`w-full px-4 py-3 font-bold rounded-lg transition-all ${
                modal.type === 'success'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddPatient;