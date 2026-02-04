import { LayoutDashboard, Users, FileText, LogOut } from 'lucide-react'; // Removed unused React import
import { useNavigate, useLocation } from 'react-router-dom';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation(); // To track which page is active

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Helper to determine if a link is active
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            TBCare
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <button 
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              isActive('/dashboard') 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>

          <button 
            onClick={() => navigate('/patients')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              isActive('/patients') 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users size={20} /> Patients
          </button>

          <button 
            onClick={() => navigate('/reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              isActive('/reports') 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText size={20} /> Reports
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;