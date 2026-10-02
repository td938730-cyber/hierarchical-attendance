import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Play, Square, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const ClockWidget = ({ onAttendanceChange }) => {
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [errorMsg, setErrorMsg] = useState('');

  // Live timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance/today');
      setTodayData(res.data);
      setErrorMsg('');
    } catch (err) {
      console.error('Failed to get today status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      await api.post('/attendance/check-in', { notes: notes.trim() || undefined });
      setNotes('');
      await fetchTodayStatus();
      if (onAttendanceChange) onAttendanceChange();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to check in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      await api.post('/attendance/check-out', { notes: notes.trim() || undefined });
      setNotes('');
      await fetchTodayStatus();
      if (onAttendanceChange) onAttendanceChange();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to check out');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTimeStr = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Live Clock & Date */}
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Current Time
          </span>
          <div className="text-3xl font-extrabold text-slate-800 tracking-tight font-mono">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Status Details */}
        <div className="flex items-center gap-4 border-y md:border-y-0 md:border-x border-slate-200 py-3 md:py-0 md:px-6">
          <div>
            <p className="text-xs text-slate-500 font-medium">Clock In</p>
            <p className="text-sm font-semibold text-emerald-600 font-mono">
              {todayData?.attendance?.check_in ? formatTimeStr(todayData.attendance.check_in) : '--:--'}
            </p>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Clock Out</p>
            <p className="text-sm font-semibold text-amber-600 font-mono">
              {todayData?.attendance?.check_out ? formatTimeStr(todayData.attendance.check_out) : '--:--'}
            </p>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Work Hours</p>
            <p className="text-sm font-semibold text-blue-700 font-mono">
              {todayData?.attendance?.work_hours ? `${todayData.attendance.work_hours} hrs` : '--'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {!todayData?.is_checked_in ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional check-in note..."
                className="bg-slate-50 border border-slate-300 text-xs px-3 py-1.5 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleCheckIn}
                disabled={actionLoading || loading}
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Clock In Now</span>
              </button>
            </div>
          ) : !todayData?.is_checked_out ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional shift summary..."
                className="bg-slate-50 border border-slate-300 text-xs px-3 py-1.5 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleCheckOut}
                disabled={actionLoading || loading}
                className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Clock Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-2.5 rounded-xl font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Shift Completed Today</span>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 text-xs text-rose-700 flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};

export default ClockWidget;
