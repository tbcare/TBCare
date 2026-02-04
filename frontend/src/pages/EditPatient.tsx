import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';

const EditPatient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    diagnosis: '',
    status: '',
    nextRefillDate: ''
  });

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await api.get(`/patients/${id}`);
        const p = response.data;
        setFormData({
          name: p.name,
          phone: p.phone,
          diagnosis: p.diagnosis,
          status: p.status,
          nextRefillDate: new Date(p.nextRefillDate).toISOString().split('T')[0]
        });
      } catch (err) {
        console.error("Failed to fetch patient", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/patients/${id}`, formData);
      navigate(`/patients/${id}`);
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-slate-500 font-bold">Loading record...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors">
        <ArrowLeft size={20} /> Cancel Edit
      </button>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-white">
          <h1 className="text-2xl font-black tracking-tight">Update Clinical Record</h1>
          <p className="opacity-80 font-medium">Modifying details for {formData.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Full Name</label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-medium"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Patient Status</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="DEFAULTED">DEFAULTED</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              disabled={saving}
              className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-black hover:bg-blue-600 transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPatient;