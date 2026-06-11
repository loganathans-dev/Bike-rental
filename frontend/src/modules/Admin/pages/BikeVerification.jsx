import React, { useEffect, useState } from 'react';
import { Search, Filter, CheckCircle, XCircle, Bike as BikeIcon } from 'lucide-react';
import { bikesApi, shopsApi } from '../../../api';

const BikeVerification = () => {
  const [bikes, setBikes] = useState([]);
  const [shopMap, setShopMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([bikesApi.listAuth(), shopsApi.list()])
      .then(([{ bikes: bikeData }, { shops }]) => {
        setBikes(bikeData);
        setShopMap(Object.fromEntries(shops.map((s) => [s.id, s.name])));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await bikesApi.setVerification(id, status);
    load();
  };

  const filteredBikes = bikes.filter(bike => {
    const shopName = shopMap[bike.shopId] || '';
    const status = bike.verificationStatus || 'pending';
    const matchesSearch = bike.name.toLowerCase().includes(searchTerm.toLowerCase()) || shopName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Approved</span>;
      case 'pending': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Pending</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Rejected</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bike Verification</h1>
        <p className="text-gray-500 mt-1">Review and approve partner bike listings.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Search bikes or shops..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg appearance-none bg-white" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Loading bikes...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="p-4 font-semibold">Bike</th>
                  <th className="p-4 font-semibold">Shop</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBikes.map((bike) => (
                  <tr key={bike.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <BikeIcon className="w-5 h-5 text-gray-400" />
                        <span className="font-bold text-gray-900">{bike.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-700">{shopMap[bike.shopId] || bike.shopId}</td>
                    <td className="p-4 text-gray-700">{bike.category}</td>
                    <td className="p-4">{getStatusBadge(bike.verificationStatus || 'pending')}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => updateStatus(bike.id, 'approved')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><CheckCircle className="w-5 h-5" /></button>
                        <button onClick={() => updateStatus(bike.id, 'rejected')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><XCircle className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BikeVerification;
