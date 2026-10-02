import React, { useState } from 'react';
import { Calendar, Clock, Edit2, Check, X, FileText } from 'lucide-react';
import api from '../api/client';

const AttendanceTable = ({ records, showUser = false, canEdit = false, onRecordUpdated }) => {
  const [editingRecord, setEditingRecord] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const openEditModal = (rec) => {
    setEditingRecord(rec);
    setEditStatus(rec.status);
    setEditNotes(rec.notes || '');
    setEditCheckIn(rec.check_in ? rec.check_in.substring(0, 16) : '');
    setEditCheckOut(rec.check_out ? rec.check_out.substring(0, 16) : '');
    setEditError('');
  };

  const closeEditModal = () => {
    setEditingRecord(null);
    setEditError('');
  };

  const handleSaveEdit = async () => {
    try {
      setSaveLoading(true);
      setEditError('');
      const payload = {
        status: editStatus,
        notes: editNotes,
        check_in: editCheckIn ? new Date(editCheckIn).toISOString() : null,
        check_out: editCheckOut ? new Date(editCheckOut).toISOString() : null,
      };
      await api.put(`/attendance/${editingRecord.id}`, payload);
      closeEditModal();
      if (onRecordUpdated) onRecordUpdated();
    } catch (err) {
      setEditError(err.response?.data?.detail || 'Failed to update record');
    } finally {
      setSaveLoading(false);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Present</span>;
      case 'HALF_DAY':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Half Day</span>;
      case 'ABSENT':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">Absent</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  if (!records || records.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs">
        <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
        <h4 className="text-base font-medium text-slate-700">No attendance records found</h4>
        <p className="text-xs text-slate-400 mt-1">Try adjusting the date filters or check back later.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-semibold">Date</th>
              {showUser && <th className="py-3 px-4 font-semibold">Employee</th>}
              <th className="py-3 px-4 font-semibold">Check In</th>
              <th className="py-3 px-4 font-semibold">Check Out</th>
              <th className="py-3 px-4 font-semibold">Hours</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Notes</th>
              {canEdit && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {records.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                  {formatDate(rec.date)}
                </td>
                {showUser && (
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="text-slate-800 font-semibold">{rec.user?.full_name || `User #${rec.user_id}`}</div>
                    <div className="text-xs text-slate-500">{rec.user?.email}</div>
                  </td>
                )}
                <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                  {formatTime(rec.check_in)}
                </td>
                <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                  {formatTime(rec.check_out)}
                </td>
                <td className="py-3 px-4 font-mono font-semibold text-blue-700 whitespace-nowrap">
                  {rec.work_hours > 0 ? `${rec.work_hours} hrs` : '-'}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {statusBadge(rec.status)}
                </td>
                <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                  {rec.notes || '-'}
                </td>
                {canEdit && (
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEditModal(rec)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Adjust / Regularize Record"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit / Regularization Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Regularize Attendance
              </h3>
              <button onClick={closeEditModal} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="HALF_DAY">HALF_DAY</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Check In Time</label>
                <input
                  type="datetime-local"
                  value={editCheckIn}
                  onChange={(e) => setEditCheckIn(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Check Out Time</label>
                <input
                  type="datetime-local"
                  value={editCheckOut}
                  onChange={(e) => setEditCheckOut(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Adjustment Notes / Reason</label>
                <textarea
                  rows="2"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Reason for regularization..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              {editError && (
                <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                  {editError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 border border-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saveLoading}
                  className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTable;
