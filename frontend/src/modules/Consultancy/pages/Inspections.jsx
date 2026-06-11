import React, { useEffect, useState } from 'react';
import { RefreshCw, Camera, AlertCircle, CheckCircle2 } from 'lucide-react';
import { inspectionsApi } from '../../../api';

const Inspections = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const { inspections: data } = await inspectionsApi.list();
      setInspections(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch inspections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Damage Inspections</h1>
        <button
          onClick={fetchInspections}
          className="flex items-center text-sm text-purple-600 hover:text-purple-800 bg-purple-50 px-3 py-1.5 rounded-lg"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold">Booking ID</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Photos (Before / After)</th>
                <th className="p-4 font-semibold">Damage Assessed</th>
                <th className="p-4 font-semibold">Damage Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inspections.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No inspections recorded yet.
                  </td>
                </tr>
              ) : (
                inspections.map((insp) => (
                  <tr key={insp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-purple-600">{insp.bookingId}</td>
                    <td className="p-4 font-semibold text-gray-800">{insp.customerName}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        insp.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {insp.status === 'completed' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Camera className="w-3 h-3 mr-1" />}
                        {insp.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 flex items-center gap-2">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">{insp.beforePhotos?.length || 0} Before</span>
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">{insp.afterPhotos?.length || 0} After</span>
                    </td>
                    <td className="p-4 font-bold text-red-600">
                      {insp.damageAmount > 0 ? `₹${insp.damageAmount}` : 'None'}
                    </td>
                    <td className="p-4 text-gray-600 text-xs max-w-xs truncate" title={insp.damageNotes}>
                      {insp.damageNotes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inspections;
