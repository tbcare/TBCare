import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Save, RefreshCw, AlertCircle } from 'lucide-react';

const EditPatient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: 0,
    sex: '',
    address: '',
    diagnosis: '',
    status: 'ACTIVE',
    nextRefillDate: ''
  });

  useEffect(() => {
    const initializeForm = async () => {
      try {
        // First, try to use patient data from navigation state
        const patientFromState = (location.state as any)?.patient;
        
        if (patientFromState) {
          setFormData({
            name: patientFromState.name || '',
            phone: patientFromState.phone || '',
            age: patientFromState.age || 0,
            sex: patientFromState.sex || patientFromState.gender || '',
            address: patientFromState.address || '',
            diagnosis: patientFromState.diagnosis || '',
            status: patientFromState.status || 'ACTIVE',
            nextRefillDate: patientFromState.nextRefillDate ? new Date(patientFromState.nextRefillDate).toISOString().split('T')[0] : ''
          });
          return;
        }

        // If no state data, fetch from API
        setLoading(true);
        const response = await api.get(`/patients/${id}`);
        const p = response.data;
        
        setFormData({
          name: p.name || '',
          phone: p.phone || '',
          age: p.age || 0,
          sex: p.sex || p.gender || '',
          address: p.address || '',
          diagnosis: p.diagnosis || '',
          status: p.status || 'ACTIVE',
          nextRefillDate: p.nextRefillDate ? new Date(p.nextRefillDate).toISOString().split('T')[0] : ''
        });
      } catch (err: any) {
        console.error("Failed to load patient", err);
        if (err.response?.status === 404) {
          setError('Patient record not found. The patient may have been deleted or the ID is invalid.');
          setTimeout(() => navigate('/patients'), 3000);
        } else {
          setError(err.response?.data?.message || 'Failed to load patient details');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeForm();
  }, [id, location.state, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name.trim()) {
      setError('Patient name is required');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put(`/patients/${id}`, {
        name: formData.name,
        phone: formData.phone,
        age: parseInt(String(formData.age)) || 0,
        sex: formData.sex,
        address: formData.address,
        diagnosis: formData.diagnosis,
        status: formData.status,
        nextRefillDate: formData.nextRefillDate || null
      });
      navigate(`/patients/${id}`);
    } catch (err: any) {
      console.error("Update failed", err);
      if (err.response?.status === 404) {
        setError('Patient record not found. This record may have been deleted. Redirecting to patient list...');
        setTimeout(() => navigate('/patients'), 3000);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to update patient');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="text-slate-500 font-bold">Loading patient record...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={20} /> Back
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
          <div>
            <p className="font-bold text-red-900">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-white">
          <h1 className="text-2xl font-black tracking-tight">Edit Patient Record</h1>
          <p className="opacity-80 font-medium">Update information for {formData.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Row 1: Name and Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Full Name *</label>
              <input 
                name="name"
                type="text"
                placeholder="Patient's full name"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Phone Number *</label>
              <input 
                name="phone"
                type="tel"
                placeholder="Contact phone number"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Row 2: Age and Sex */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Age</label>
              <input 
                name="age"
                type="number"
                min="0"
                max="120"
                placeholder="Patient age"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                value={formData.age}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Sex</label>
              <select 
                name="sex"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-bold text-slate-700"
                value={formData.sex}
                onChange={handleChange}
              >
                <option value="">Select Sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          {/* Row 3: Address */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Address</label>
            <textarea 
              name="address"
              placeholder="Patient address"
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium resize-none"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          {/* Row 4: Diagnosis and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Diagnosis</label>
              <select 
                name="diagnosis"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-bold text-slate-700"
                value={formData.diagnosis}
                onChange={handleChange}
              >
                <option value="">Select Diagnosis</option>
                <option value="Pulmonary Positive">Pulmonary Positive</option>
                <option value="Pulmonary Negative">Pulmonary Negative</option>
                <option value="Extra-pulmonary">Extra-pulmonary</option>
                <option value="Drug Resistant">Drug Resistant (MDR-TB)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Patient Status</label>
              <select 
                name="status"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-bold text-slate-700"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="DEFAULTED">DEFAULTED</option>
              </select>
            </div>
          </div>

          {/* Row 5: Next Refill Date */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Next Refill Date</label>
            <input 
              name="nextRefillDate"
              type="date"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
              value={formData.nextRefillDate}
              onChange={handleChange}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPatient;