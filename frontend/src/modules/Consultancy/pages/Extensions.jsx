import React, { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { extensionsApi } from '../../../api';

const Extensions = () => {
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExtensions = async () => {
    try {
      setLoading(true);
      const { extensions: data } = await extensionsApi.list();
      setExtensions(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch extensions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtensions();
  }, []);

  const handleRespond = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this extension request?`)) return;
    try {
      await extensionsApi.respond(id, { status });
      fetchExtensions();
    } catch (err) {
      alert(err.message || 'Failed to update extension');
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-800">Booking Extensions</h1>
        <button
          onClick={fetchExtensions}
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
                <th className="p-4 font-semibold">Requested At</th>
                <th className="p-4 font-semibold">Current End Time</th>
                <th className="p-4 font-semibold">New End Time</th>
                <th className="p-4 font-semibold">Extra Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {extensions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    No extension requests found.
                  </td>
                </tr>
              ) : (
                extensions.map((ext) => (
                  <tr key={ext.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-purple-600">{ext.bookingId}</td>
                    <td className="p-4 text-gray-600">
                      {new Date(ext.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-gray-600">
                      {new Date(ext.oldEndTime).toLocaleString()}
                    </td>
                    <td className="p-4 font-semibold text-gray-800">
                      {new Date(ext.newEndTime).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-gray-800">
                      ₹{ext.extraAmount}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        ext.status === 'approved' ? 'bg-green-100 text-green-800' :
                        ext.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ext.status === 'approved' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {ext.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                        {ext.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {ext.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {ext.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespond(ext.id, 'approved')}
                            className="text-green-600 hover:text-green-800 font-medium text-xs bg-green-50 px-2 py-1 rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRespond(ext.id, 'rejected')}
                            className="text-red-600 hover:text-red-800 font-medium text-xs bg-red-50 px-2 py-1 rounded"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Resolved</span>
                      )}
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

export default Extensions;
