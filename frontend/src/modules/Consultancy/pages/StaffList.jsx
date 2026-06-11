import React, { useEffect, useState } from 'react';
import { staffApi } from '../../../api';
import { Plus, Edit2, Trash2, X, User } from 'lucide-react';

const StaffList = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({ name: '', role: 'Delivery Boy', phone: '', email: '', status: 'Active' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaff = () => {
    setLoading(true);
    staffApi.list()
      .then(res => setStaffList(res.staff || []))
      .catch(err => setError(err.message || 'Failed to load staff'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openModal = (staff = null) => {
    setFormError('');
    if (staff) {
      setEditingStaff(staff);
      setFormData({ name: staff.name, role: staff.role, phone: staff.phone, email: staff.email || '', status: staff.status });
    } else {
      setEditingStaff(null);
      setFormData({ name: '', role: 'Delivery Boy', phone: '', email: '', status: 'Active' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (formData.phone.length !== 10) {
      setFormError('Phone number must be exactly 10 digits');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStaff) {
        await staffApi.update(editingStaff.id, formData);
      } else {
        await staffApi.create(formData);
      }
      closeModal();
      fetchStaff();
    } catch (err) {
      setFormError(err.message || 'Failed to save staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await staffApi.delete(id);
      fetchStaff();
    } catch (err) {
      alert(err.message || 'Failed to delete staff');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading staff directory...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Staff Management</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your managers, delivery boys, and accountants.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" /> Add Staff
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.map(staff => (
          <div key={staff.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
              <button onClick={() => openModal(staff)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(staff.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xl">
                {staff.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 leading-tight">{staff.name}</h3>
                <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full mt-1">
                  {staff.role}
                </span>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 border-t border-gray-100 pt-4">
              <p><strong className="text-gray-400 font-medium">Phone:</strong> {staff.phone}</p>
              {staff.email && <p><strong className="text-gray-400 font-medium">Email:</strong> {staff.email}</p>}
              <p>
                <strong className="text-gray-400 font-medium">Status:</strong> 
                <span className={`ml-2 font-bold ${staff.status === 'Active' ? 'text-green-600' : 'text-red-500'}`}>
                  {staff.status}
                </span>
              </p>
            </div>
          </div>
        ))}
        {staffList.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No staff members found. Add your first staff member!</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold">{editingStaff ? 'Edit Staff' : 'Add New Staff'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors hover:bg-gray-100">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{formError}</div>}
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition" placeholder="John Doe" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition bg-white">
                  <option value="Manager">Manager</option>
                  <option value="Delivery Boy">Delivery Boy</option>
                  <option value="Accountant">Accountant</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition" placeholder="9876543210" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email (Optional)</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition" placeholder="john@example.com" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition bg-white">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 text-white bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffList;
