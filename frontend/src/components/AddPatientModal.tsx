import { useState } from 'react';
import { X, Loader2, MapPin, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api/axios';

const AddPatientModal = ({ isOpen, onClose, onRefresh }: any) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', 
    phone: '', 
    age: '', 
    sex: 'Male', 
    address: '', 
    diagnosis: 'Pulmonary Positive', 
    extrapulmonarySite: '',
    patientType: 'NEW',
    treatmentStartDate: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!user.id) {
        throw new Error("Staff session expired. Please log in again.");
      }
      
      if (!user.facilityId) {
        throw new Error("Facility information missing. Please log in again.");
      }

      const payload = {
        name: formData.name,
        phone: formData.phone,
        age: formData.age,
        sex: formData.sex,
        address: formData.address,
        diagnosis: formData.diagnosis,
        extrapulmonarySite: formData.extrapulmonarySite,
        patientType: formData.patientType,
        treatmentStartDate: formData.treatmentStartDate,
        staffId: user.id,
        facilityId: user.facilityId
      };

      console.log('Submitting patient data:', payload);
      
      const response = await api.post('/patients', payload);

      // Safely extract the name from response
      const patientName = response.data?.name || response.data?.patient?.name || "Patient";
      setSuccessMessage(`${patientName} enrolled successfully.`);
      setShowSuccess(true);
      
      // Reset form
      setFormData({
        name: '', phone: '', age: '', sex: 'Male', address: '',
        diagnosis: 'Pulmonary Positive', extrapulmonarySite: '',
        patientType: 'NEW', treatmentStartDate: ''
      });
      
      // Refresh after a short delay
      setTimeout(() => {
        setShowSuccess(false);
        onRefresh();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error("Full error object:", err);
      console.error("Error response:", err.response);
      console.error("Error data:", err.response?.data);
      
      let errorMessage = "Error adding patient record";
      
      if (err.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.message || "Invalid patient data. Check all fields.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Enroll TB Patient</h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Clinical Intake Form</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-2 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">FULL NAME</label>
              <input 
                required 
                value={formData.name}
                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">PHONE</label>
              <input 
                required 
                value={formData.phone}
                placeholder="Unique contact number" 
                className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                onChange={e => setFormData({...formData, phone: e.target.value})} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">AGE</label>
              <input 
                required 
                type="number" 
                value={formData.age}
                className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                onChange={e => setFormData({...formData, age: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-bold text-blue-600 ml-1 flex items-center gap-1">
                <Activity size={14}/> TREATMENT CATEGORY
              </label>
              <select 
                className="w-full p-3 border border-blue-200 rounded-xl bg-white outline-none" 
                value={formData.diagnosis}
                onChange={e => setFormData({...formData, diagnosis: e.target.value})}>
                <option value="Pulmonary Positive">Pulmonary Positive (Bacteriologically Confirmed)</option>
                <option value="Pulmonary Negative">Pulmonary Negative (X-ray Suggestive)</option>
                <option value="Extra-pulmonary">Extra-pulmonary</option>
                <option value="Drug Resistant">Drug Resistant TB (MDR/RR)</option>
              </select>
            </div>

            {formData.diagnosis === 'Extra-pulmonary' && (
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-blue-600 ml-1">SITE OF INFECTION</label>
                <input 
                  required 
                  value={formData.extrapulmonarySite}
                  placeholder="e.g. Lymph node"
                  className="w-full p-3 border border-blue-300 rounded-xl bg-white outline-none"
                  onChange={e => setFormData({...formData, extrapulmonarySite: e.target.value})} 
                />
              </div>
            )}

            <div className="col-span-2 space-y-1">
              <label className="text-xs font-bold text-blue-600 ml-1">TYPE OF PATIENT</label>
              <select 
                className="w-full p-3 border border-blue-200 rounded-xl bg-white outline-none" 
                value={formData.patientType}
                onChange={e => setFormData({...formData, patientType: e.target.value})}>
                <option value="NEW">New (Never treated before)</option>
                <option value="RETREATMENT">Retreatment (Relapse/Failure/Loss to Follow-up)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1">
              <MapPin size={14}/> HOME ADDRESS
            </label>
            <textarea 
              required 
              rows={2} 
              value={formData.address}
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Detailed physical address"
              onChange={e => setFormData({...formData, address: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1">SEX</label>
                <select 
                  className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none" 
                  value={formData.sex}
                  onChange={e => setFormData({...formData, sex: e.target.value})}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1">TREATMENT START DATE</label>
                <input 
                  required 
                  type="date" 
                  value={formData.treatmentStartDate}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none"
                  onChange={e => setFormData({...formData, treatmentStartDate: e.target.value})} 
                />
              </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
              isSubmitting ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Complete Registration'}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-in fade-in zoom-in">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="text-emerald-500" size={48} />
            </div>
            
            <h2 className="text-xl font-bold text-center text-slate-900 mb-2">Success!</h2>
            
            <p className="text-slate-600 text-center mb-6">
              {successMessage}
            </p>
            
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full px-4 py-3 font-bold rounded-lg transition-all bg-emerald-600 text-white hover:bg-emerald-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddPatientModal;