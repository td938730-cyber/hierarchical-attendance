import React, { useState, useEffect } from 'react';
import api from '../api/client';
import ClockWidget from '../components/ClockWidget';
import AttendanceTable from '../components/AttendanceTable';
import { useAuth } from '../context/AuthContext';
import { Calendar, CheckCircle2, Clock, Hourglass, TrendingUp, UserCheck, Shield } from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const [recordsRes, summaryRes] = await Promise.all([
        api.get('/attendance/my', { params }),
        api.get('/attendance/summary', { params: { ...params, scope: 'my' } }),
      ]);

      setRecords(recordsRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to load attendance records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Manager Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Welcome back, {user?.full_name} 👋
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track your daily shift hours, record punches, and view your attendance records.
          </p>
        </div>

        {user?.manager ? (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-500">Reporting Manager</p>
              <p className="text-xs font-semibold text-slate-800">{user.manager.full_name}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 px-3.5 py-2 rounded-xl text-xs text-purple-800 font-medium">
            <Shield className="w-4 h-4 text-purple-600" />
            <span>Top Level / Organization Head</span>
          </div>
        )}
      </div>

      {/* Interactive Punch Clock Widget */}
      <ClockWidget onAttendanceChange={fetchAttendance} />

      {/* Metrics Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-medium">Days Present</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              {summary.present_days}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Full working shifts</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-medium">Half Days</span>
              <Hourglass className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-600 font-mono">
              {summary.half_days}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Partial shifts logged</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-medium">Total Hours</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700 font-mono">
              {summary.total_hours} <span className="text-xs text-slate-500 font-normal">hrs</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Cumulative time recorded</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-medium">Avg Hours/Day</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-700 font-mono">
              {summary.average_hours} <span className="text-xs text-slate-500 font-normal">hrs</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Daily pace</p>
          </div>
        </div>
      )}

      {/* Attendance History Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Attendance History</h3>
            <p className="text-xs text-slate-500">Your recent punch entries and hours recorded</p>
          </div>

          {/* Date range filters */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-slate-300 text-xs px-2.5 py-1.5 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-slate-300 text-xs px-2.5 py-1.5 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <AttendanceTable
          records={records}
          showUser={false}
          canEdit={false}
          onRecordUpdated={fetchAttendance}
        />
      </div>
    </div>
  );
};

export default EmployeeDashboard;
