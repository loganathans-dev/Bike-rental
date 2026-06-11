import React, { useEffect, useState } from 'react';
import { Search, Filter, CheckCircle, XCircle, Ban } from 'lucide-react';
import { shopsApi } from '../../../api';

const ShopVerification = () => {
  const [shops, setShops] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(null);

  const loadShops = () => {
    setLoading(true);
    shopsApi.list()
      .then(({ shops: data }) => setShops(data))
      .finally(() => setLoading(false));
  };

  
  useEffect(() => { loadShops(); }, []);

  const updateStatus = async (id, status) => {
    await shopsApi.updateStatus(id, status);
    loadShops();
  };

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) || shop.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || shop.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Approved</span>;
      case 'pending': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Pending</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Rejected</span>;
      case 'blocked': return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Blocked</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shop Verification</h1>
          <p className="text-gray-500 mt-1">Manage and verify consultancy shops.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by shop or owner name..." 
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select 
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Loading shops...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="p-4 font-semibold">Shop Info</th>
                  <th className="p-4 font-semibold">Location</th>
                  <th className="p-4 font-semibold">Reg. Date</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredShops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <p 
                        className="font-bold text-gray-900 cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                        onClick={() => setSelectedShop(shop)}
                      >
                        {shop.name}
                      </p>
                      <p className="text-sm text-gray-500">{shop.owner} • {shop.id.slice(-8)}</p>
                    </td>
                    <td className="p-4 text-gray-700">{shop.location}</td>
                    <td className="p-4 text-gray-700 text-sm">{shop.date}</td>
                    <td className="p-4">{getStatusBadge(shop.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => updateStatus(shop.id, 'approved')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" title="Approve">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button onClick={() => updateStatus(shop.id, 'rejected')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Reject">
                          <XCircle className="w-5 h-5" />
                        </button>
                        <button onClick={() => updateStatus(shop.id, 'blocked')} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Block">
                          <Ban className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredShops.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      No shops found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-start shrink-0">
              <div>
                <h3 className="text-xl font-bold">{selectedShop.shopName}</h3>
                <p className="text-blue-100 text-sm mt-1">{selectedShop.ownerName} • {selectedShop.city}</p>
              </div>
              <button onClick={() => setSelectedShop(null)} className="text-blue-100 hover:text-white transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</p>
                  <div>{getStatusBadge(selectedShop.status)}</div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Registration Date</p>
                  <p className="font-medium text-gray-900">{selectedShop.date || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Contact & Location</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500 text-xs block">Email</span>
                    <span className="font-medium text-gray-900">{selectedShop.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Phone</span>
                    <span className="font-medium text-gray-900">{selectedShop.contactNumber || 'N/A'}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-500 text-xs block">Address</span>
                    <span className="font-medium text-gray-900">{selectedShop.address || 'N/A'} - {selectedShop.pincode}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Business Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500 text-xs block">GST Number</span>
                    <span className="font-medium text-gray-900">{selectedShop.gstNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Working Hours</span>
                    <span className="font-medium text-gray-900">{selectedShop.openingTime || 'N/A'} - {selectedShop.closingTime || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Bank Information</h4>
                <div className="bg-gray-50 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 block">Bank Name</span>
                    <span className="font-semibold text-gray-900">{selectedShop.bankName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Account Holder</span>
                    <span className="font-semibold text-gray-900">{selectedShop.accountHolderName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Account Number</span>
                    <span className="font-mono font-semibold text-gray-900 tracking-wider">{selectedShop.accountNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">IFSC Code</span>
                    <span className="font-mono font-semibold text-gray-900 tracking-wider">{selectedShop.ifscCode || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {(selectedShop.shopFrontImage || selectedShop.shopLogo || selectedShop.shopBanner) && (
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Documents & Images</h4>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {selectedShop.shopFrontImage && (
                      <div className="shrink-0">
                        <span className="text-xs text-gray-500 block mb-1">Shop Front</span>
                        <a href={selectedShop.shopFrontImage} target="_blank" rel="noreferrer">
                          <img src={selectedShop.shopFrontImage} alt="Shop Front" className="h-24 w-auto rounded-lg border border-gray-200 object-cover hover:opacity-80 transition" />
                        </a>
                      </div>
                    )}
                    {selectedShop.shopLogo && (
                      <div className="shrink-0">
                        <span className="text-xs text-gray-500 block mb-1">Shop Logo</span>
                        <a href={selectedShop.shopLogo} target="_blank" rel="noreferrer">
                          <img src={selectedShop.shopLogo} alt="Logo" className="h-24 w-auto rounded-lg border border-gray-200 object-cover hover:opacity-80 transition" />
                        </a>
                      </div>
                    )}
                    {selectedShop.shopBanner && (
                      <div className="shrink-0">
                        <span className="text-xs text-gray-500 block mb-1">Banner</span>
                        <a href={selectedShop.shopBanner} target="_blank" rel="noreferrer">
                          <img src={selectedShop.shopBanner} alt="Banner" className="h-24 w-auto rounded-lg border border-gray-200 object-cover hover:opacity-80 transition" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 shrink-0 bg-gray-50 flex gap-3">
              {selectedShop.status === 'pending' && (
                <>
                  <button onClick={() => { updateStatus(selectedShop.id, 'approved'); setSelectedShop(null); }} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl transition">
                    Approve Shop
                  </button>
                  <button onClick={() => { updateStatus(selectedShop.id, 'rejected'); setSelectedShop(null); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition">
                    Reject Shop
                  </button>
                </>
              )}
              {selectedShop.status === 'approved' && (
                <button onClick={() => { updateStatus(selectedShop.id, 'blocked'); setSelectedShop(null); }} className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-bold py-2.5 rounded-xl transition">
                  Block Shop
                </button>
              )}
              {selectedShop.status === 'blocked' && (
                <button onClick={() => { updateStatus(selectedShop.id, 'approved'); setSelectedShop(null); }} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl transition">
                  Unblock Shop
                </button>
              )}
              <button onClick={() => setSelectedShop(null)} className="flex-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopVerification;
