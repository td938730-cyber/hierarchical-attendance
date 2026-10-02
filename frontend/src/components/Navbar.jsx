import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Users, Shield, LogOut, Network, CalendarCheck } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleBadgeColor = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    MANAGER: 'bg-blue-100 text-blue-800 border-blue-200',
    EMPLOYEE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  }[user.role] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Navigation */}
          <div className="flex items-center space-x-6 sm:space-x-8">
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab('my')}>
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-xs">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-base sm:text-lg text-slate-800 tracking-tight">Attendance Portal</span>
                <span className="text-[11px] text-blue-600 block -mt-1 font-medium">College Project &bull; Assam</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex space-x-1.5">
              <button
                onClick={() => setActiveTab('my')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'my'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <CalendarCheck className="w-4 h-4" />
                <span>My Attendance</span>
              </button>

              {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                <button
                  onClick={() => setActiveTab('team')}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                    activeTab === 'team'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Team Attendance</span>
                </button>
              )}

              {user.role === 'ADMIN' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Org & Users</span>
                </button>
              )}
            </nav>
          </div>

          {/* User profile info & logout */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end space-x-2">
                <span className="text-sm font-semibold text-slate-800">{user.full_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${roleBadgeColor}`}>
                  {user.role}
                </span>
              </div>
              {user.manager ? (
                <p className="text-xs text-slate-500">Reports to: <span className="text-slate-700 font-medium">{user.manager.full_name}</span></p>
              ) : (
                <p className="text-xs text-blue-600 font-medium">Head of Organization</p>
              )}
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
