import React, { useState, useEffect } from 'react';
import api from '../api/client';
import AttendanceTable from '../components/AttendanceTable';
import { useAuth } from '../context/AuthContext';
import { Users, Filter, CheckCircle2, Clock, Hourglass, ArrowDownRight, Layers } from 'lucide-react';

const TeamDashboard = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [subordinates, setSubordinates] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [directOnly, setDirectOnly] = useState(false); // Default shows all downline reports per user preference
  const [selectedUserId, setSelectedUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Load subordinates for dropdown
  const fetchSubordinates = async () => {
    try {
      const res = await api.get('/users/hierarchy/subordinates', {
        params: { direct_only: directOnly }
      });
      setSubordinates(res.data);
    } catch (err) {
      console.error('Failed to load subordinates', err);
    }
  };

  const fetchTeamAttendance = async () => {
    try {
      setLoading(true);
      const params = {
        direct_only: directOnly,
      };
      if (selectedUserId) params.user_id = selectedUserId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (statusFilter) params.status_filter = statusFilter;

      const [teamRes, summaryRes] = await Promise.all([
        api.get('/attendance/team', { params }),
        api.get('/attendance/summary', { params: { scope: 'team', start_date: startDate || undefined, end_date: endDate || undefined } })
      ]);

      setRecords(teamRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to load team attendance', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubordinates();
  }, [directOnly]);

  useEffect(() => {
    fetchTeamAttendance();
  }, [directOnly, selectedUserId, startDate, endDate, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Team Attendance & Hierarchy Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Supervise team attendance, review shifts, and regularize missed punches.
          </p>
        </div>

        {/* Downline Scope Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setDirectOnly(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              !directOnly
                ? 'bg-white text-blue-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Downline Reports</span>
          </button>
          <button
            onClick={() => setDirectOnly(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              directOnly
                ? 'bg-white text-blue-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Direct Reports Only</span>
          </button>
        </div>
      </div>

      {/* Team Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-medium">Subordinates Present</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              {summary.present_days}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total full shifts logged</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-medium">Half-Day Records</span>
              <Hourglass className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-600 font-mono">
              {summary.half_days}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Partial working sessions</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-medium">Downline Work Hours</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700 font-mono">
              {summary.total_hours} <span className="text-xs text-slate-500 font-normal">hrs</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Cumulative team output</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-medium">Subordinates Tracked</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-700 font-mono">
              {subordinates.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Members in current scope</p>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Member selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Member:</span>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs px-3 py-1.5 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Downline Members ({subordinates.length})</option>
              {subordinates.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.full_name} ({sub.role})
                </option>
              ))}
            </select>
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs px-3 py-1.5 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-xs px-2.5 py-1.5 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-xs px-2.5 py-1.5 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
          />
          {(selectedUserId || statusFilter || startDate || endDate) && (
            <button
              onClick={() => {
                setSelectedUserId('');
                setStatusFilter('');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-slate-800">Subordinate Logs</h3>
        <AttendanceTable
          records={records}
          showUser={true}
          canEdit={true}
          onRecordUpdated={fetchTeamAttendance}
        />
      </div>
    </div>
  );
};

export default TeamDashboard;
