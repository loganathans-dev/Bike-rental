import React, { useEffect, useState } from 'react';
import { bikesApi } from '../../../api';
import { BikeThumbnail } from '../../../components/BikeThumbnail';
import { isPartnerLoggedIn } from '../../../utils/auth';
import { fileToDataUrl } from '../../../utils/files';
import { useNavigate } from 'react-router-dom';
import { shopsApi } from '../../../api';
import { 
  Plus, Search, Edit2, Trash2, Power, ArrowLeft,
  Info, IndianRupee, FileText, Image as ImageIcon, ShieldAlert,
  UploadCloud, Save, CheckCircle2, ChevronLeft, ChevronRight, Bike
} from 'lucide-react';

const emptyBikeForm = {
  id: '',
  name: '', brand: '', vehicleNumber: '', category: 'Cruiser',
  fuelType: 'Petrol', mileage: '', pricePerHour: '', pricePerDay: '',
  securityDeposit: '', description: '', chassisNumber: '', engineNumber: '',
  rcNumber: '', rcDocument: null, insurancePolicyNumber: '', insuranceExpiryDate: '',
  insuranceDocument: null, images: null, isAvailable: true
};

const steps = [
  { id: 1, title: 'Basic',     icon: <Info className="w-4 h-4 sm:w-5 sm:h-5" /> },
  { id: 2, title: 'Pricing',   icon: <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" /> },
  { id: 3, title: 'Reg. Docs', icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5" /> },
  { id: 4, title: 'Insurance', icon: <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" /> },
  { id: 5, title: 'Media',     icon: <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" /> },
];

const BikeManagement = () => {
  const navigate = useNavigate();
  const [view, setView]               = useState('list');
  const [bikes, setBikes]             = useState([]);
  const [formData, setFormData]       = useState(emptyBikeForm);
  const [searchTerm, setSearchTerm]   = useState('');
  const [isEditing, setIsEditing]     = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading]         = useState(true);
  const [shopStatus, setShopStatus]   = useState(null);
  const [error, setError]             = useState('');
  const totalSteps = steps.length;

  const loadBikes = () => {
    setLoading(true);
    bikesApi.listAuth()
      .then(({ bikes: data }) => setBikes(data))
      .catch(() => setBikes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isPartnerLoggedIn()) {
      navigate('/consultancy/signin');
      return;
    }
    shopsApi.getMine()
      .then(({ shop }) => setShopStatus(shop.status))
      .catch(() => setShopStatus('none'))
      .finally(() => loadBikes());
  }, [navigate]);

  const handleAddNew = () => { setFormData(emptyBikeForm); setIsEditing(false); setCurrentStep(1); setError(''); setView('form'); };
  const handleEdit   = (bike) => { setFormData({ ...emptyBikeForm, ...bike, pricePerDay: String(bike.pricePerDay), pricePerHour: String(bike.pricePerHour || '') }); setIsEditing(true); setCurrentStep(1); setError(''); setView('form'); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bike?')) return;
    await bikesApi.delete(id);
    loadBikes();
  };
  const handleToggle = async (id) => {
    await bikesApi.toggle(id);
    loadBikes();
  };
  const validateStep = (step) => {
    setError('');
    let missing = [];
    if (step === 1) {
      if (!formData.name) missing.push('Bike Name / Model');
      if (!formData.brand) missing.push('Brand');
      if (!formData.vehicleNumber) missing.push('Vehicle Number');
      if (!formData.category) missing.push('Category');
      if (!formData.fuelType) missing.push('Fuel Type');
    } else if (step === 2) {
      if (!formData.pricePerHour) missing.push('Price per Hour');
      if (!formData.pricePerDay) missing.push('Price per Day');
      if (!formData.securityDeposit) missing.push('Security Deposit');
    } else if (step === 3) {
      if (!formData.chassisNumber) missing.push('Chassis Number');
      if (!formData.engineNumber) missing.push('Engine Number');
      if (!formData.rcNumber) missing.push('RC Number');
      if (!isEditing && !formData.rcDocument) missing.push('RC Document');
    } else if (step === 4) {
      // Insurance is optional depending on business rules, but if you want to enforce:
      // if (!formData.insurancePolicyNumber) missing.push('Insurance Policy Number');
    } else if (step === 5) {
      if (!isEditing && !formData.images) missing.push('Bike Images');
    }

    if (missing.length > 0) {
      setError(`Please fill all required fields: ${missing.join(', ')}`);
      return false;
    }
    return true;
  };

  const nextStep     = () => { if (validateStep(currentStep) && currentStep < totalSteps) setCurrentStep(p => p + 1); };
  const prevStep     = () => { if (currentStep > 1) setCurrentStep(p => p - 1); };

  const handleChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? files[0] : type === 'checkbox' ? checked : value
    }));
  };

  const verificationBadge = (status) => {
    if (status === 'approved') {
      return (
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
          Live on customer site
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">
          Rejected
        </span>
      );
    }
    return (
      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
        Pending admin approval
      </span>
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateStep(5)) return;
    try {
      const rcDocument = formData.rcDocument instanceof File ? await fileToDataUrl(formData.rcDocument) : undefined;
      const insuranceDocument = formData.insuranceDocument instanceof File ? await fileToDataUrl(formData.insuranceDocument) : undefined;
      const images = formData.images instanceof File ? await fileToDataUrl(formData.images) : undefined;

      const payload = {
        name: formData.name,
        brand: formData.brand,
        vehicleNumber: formData.vehicleNumber,
        category: formData.category,
        fuelType: formData.fuelType,
        mileage: formData.mileage,
        pricePerDay: formData.pricePerDay,
        pricePerHour: formData.pricePerHour,
        securityDeposit: formData.securityDeposit,
        description: formData.description,
        chassisNumber: formData.chassisNumber,
        engineNumber: formData.engineNumber,
        rcNumber: formData.rcNumber,
        insurancePolicyNumber: formData.insurancePolicyNumber,
        insuranceExpiryDate: formData.insuranceExpiryDate,
        isAvailable: formData.isAvailable,
        ...(rcDocument && { rcDocument }),
        ...(insuranceDocument && { insuranceDocument }),
        ...(images && { images: [images] }),
      };

      if (isEditing) {
        await bikesApi.update(formData.id, payload);
      } else {
        await bikesApi.create(payload);
        alert('Bike saved. It will show on the customer page after an admin approves it in Bike Verification.');
      }
      setView('list');
      loadBikes();
    } catch (err) {
      alert(err.message || 'Failed to save bike');
    }
  };

  // ─── Render helpers matching ShopRegistration style ──────────────────────────
  const renderInput = (label, name, type = 'text', required = true, placeholder = '') => (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={name} className="text-sm font-semibold text-gray-700 ml-1">
        {label} {required && <span className="text-purple-500">*</span>}
      </label>
      <input
        type={type} id={name} name={name}
        value={type !== 'file' ? formData[name] : undefined}
        onChange={handleChange} placeholder={placeholder}
        className="w-full p-2.5 bg-white/60 border border-gray-200 rounded-lg text-gray-800 text-sm outline-none transition-all duration-300 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 hover:border-purple-300 shadow-sm"
        required={required}
      />
    </div>
  );

  const renderSelect = (label, name, options, required = true) => (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={name} className="text-sm font-semibold text-gray-700 ml-1">
        {label} {required && <span className="text-purple-500">*</span>}
      </label>
      <select
        id={name} name={name} value={formData[name]} onChange={handleChange}
        className="w-full p-2.5 bg-white/60 border border-gray-200 rounded-lg text-gray-800 text-sm outline-none transition-all duration-300 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 cursor-pointer shadow-sm"
        required={required}
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );

  const renderTextarea = (label, name, required = false, placeholder = '') => (
    <div className="flex flex-col gap-1.5 w-full col-span-full">
      <label htmlFor={name} className="text-sm font-semibold text-gray-700 ml-1">
        {label} {required && <span className="text-purple-500">*</span>}
      </label>
      <textarea
        id={name} name={name} value={formData[name]} onChange={handleChange}
        placeholder={placeholder} rows="2"
        className="w-full p-2.5 bg-white/60 border border-gray-200 rounded-lg text-gray-800 text-sm outline-none transition-all duration-300 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 hover:border-purple-300 shadow-sm resize-none"
        required={required}
      />
    </div>
  );

  const renderFileDropzone = (label, name) => (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-semibold text-gray-700 ml-1 text-left">
        {label} {!isEditing && <span className="text-purple-500">*</span>}
      </label>
      <div className="relative group w-full h-24 flex flex-col items-center justify-center border-2 border-dashed border-purple-200 rounded-lg bg-purple-50/50 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 cursor-pointer overflow-hidden">
        <input type="file" name={name} onChange={handleChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" required={!isEditing && !formData[name]} />
        <UploadCloud className="w-6 h-6 text-purple-400 mb-1 group-hover:text-purple-600 transition-colors" />
        <span className="text-sm font-medium text-purple-600 truncate px-2 w-full text-center" title={formData[name] instanceof File ? formData[name].name : (typeof formData[name] === 'string' ? formData[name].split('/').pop() : '')}>
          {formData[name] instanceof File 
            ? formData[name].name 
            : formData[name] 
              ? (typeof formData[name] === 'string' ? formData[name].split('/').pop() : "File exists (Click to replace)") 
              : "Upload"}
        </span>
      </div>
    </div>
  );

  const filteredBikes = bikes.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Stepper bar ─────────────────────────────────────────────────────────────
  const Stepper = () => (
    <div className="flex items-center justify-between mb-8 relative">
      <div className="absolute left-0 top-4 sm:top-5 w-full h-1 bg-gray-200 rounded-full -z-10" />
      <div
        className="absolute left-0 top-4 sm:top-5 h-1 bg-purple-600 rounded-full -z-10 transition-all duration-500"
        style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
      />
      {steps.map(step => (
        <div key={step.id} className="flex flex-col items-center gap-1 sm:gap-2 bg-white px-1">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${
            currentStep >= step.id ? 'bg-purple-600 text-white shadow-purple-500/40' : 'bg-white text-gray-400 border border-gray-200'
          }`}>
            {currentStep > step.id ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : step.icon}
          </div>
          <span className={`text-[9px] sm:text-[11px] font-bold uppercase tracking-wider hidden sm:block ${
            currentStep >= step.id ? 'text-purple-700' : 'text-gray-400'
          }`}>{step.title}</span>
        </div>
      ))}
    </div>
  );

  // ─── Nav Footer ───────────────────────────────────────────────────────────────
  const NavFooter = () => (
    <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
      <button
        type="button" onClick={prevStep} disabled={currentStep === 1}
        className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
          currentStep === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <ChevronLeft className="w-4 h-4 flex-shrink-0" /> Back
      </button>
      {currentStep < totalSteps ? (
        <button
          type="button" onClick={nextStep}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 hover:shadow-md active:scale-95 transition-all duration-300"
        >
          Continue <ChevronRight className="w-4 h-4 flex-shrink-0" />
        </button>
      ) : (
        <button
          type="submit"
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-bold hover:from-purple-700 hover:to-indigo-700 hover:shadow-md active:scale-95 transition-all duration-300"
        >
          <Save className="w-4 h-4 flex-shrink-0" /> {isEditing ? 'Save Changes' : 'Add Bike'}
        </button>
      )}
    </div>
  );

  return (
    <div className="font-sans min-h-full">

      {/* ═══════════════════════ LIST VIEW ═══════════════════════ */}
      {view === 'list' && (
        <div className="animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Bike Inventory</h2>
              <p className="text-gray-500 text-sm mt-1">Manage and track your rental vehicles.</p>
            </div>
            {shopStatus === 'approved' ? (
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-5 h-5 flex-shrink-0" /> Add New Bike
              </button>
            ) : (
              <div className="text-sm font-semibold text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                {shopStatus === 'none' ? 'Register your shop first to add bikes' : 'Shop must be approved by admin'}
              </div>
            )}
          </div>

          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            New bikes are saved as <strong>Pending</strong> and appear on the customer home page only after an admin approves them under{' '}
            <strong>Admin → Bike Verification</strong>.
          </div>

          <div className="relative w-full sm:max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text" placeholder="Search by name or vehicle number..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-purple-300 transition-all text-sm shadow-sm"
            />
          </div>

          {filteredBikes.length === 0 ? (
            <div className="bg-purple-50/40 border-2 border-dashed border-purple-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center mb-4">
                <Bike className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">No bikes found</h3>
              <p className="text-gray-500 mt-1 mb-4 text-sm max-w-sm">Add your first vehicle to start managing your rental inventory.</p>
              {shopStatus === 'approved' && (
                <button onClick={handleAddNew} className="text-purple-600 font-semibold hover:text-purple-800 underline">
                  Add your first bike →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredBikes.map(bike => (
                <div key={bike.id} className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] overflow-hidden hover:shadow-[0_10px_30px_-10px_rgba(139,92,246,0.2)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
                  <div className="h-36 bg-gradient-to-br from-purple-50 to-indigo-100 relative overflow-hidden border-b border-gray-100">
                    <BikeThumbnail
                      bike={bike}
                      className="w-full h-full object-cover"
                      iconClassName="w-14 h-14 text-purple-300"
                    />
                    {verificationBadge(bike.verificationStatus)}
                    <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${bike.isAvailable ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {bike.isAvailable ? 'Available' : 'Rented'}
                    </div>
                  </div>
                  <div className="p-4 flex-grow flex flex-col">
                    <h3 className="font-bold text-gray-900 text-base">{bike.name}</h3>
                    <p className="text-xs text-gray-500 mb-3">{bike.brand} • {bike.category}</p>
                    <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600 mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase">Vehicle No</span>
                        <span className="font-medium text-gray-700 text-xs">{bike.vehicleNumber}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase">Price/Day</span>
                        <span className="font-bold text-purple-700">₹{bike.pricePerDay || '--'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-2.5 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center">
                    <button onClick={() => handleToggle(bike.id)} title={bike.isAvailable ? 'Mark Rented' : 'Mark Available'}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${bike.isAvailable ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
                      <Power className="w-3.5 h-3.5 flex-shrink-0" /> {bike.isAvailable ? 'Rent Out' : 'Restore'}
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(bike)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(bike.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ FORM VIEW ═══════════════════════ */}
      {view === 'form' && (
        <div
          className="min-h-full bg-[conic-gradient(at_bottom_right,_var(--tw-gradient-stops))] from-purple-100 via-white to-purple-50 -m-6 sm:-m-8 p-4 sm:p-8"
        >
          {/* Decorative blobs */}
          <div className="fixed top-0 left-0 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl pointer-events-none hidden sm:block" />
          <div className="fixed bottom-0 right-0 w-96 h-96 bg-pink-300/15 rounded-full blur-3xl pointer-events-none hidden sm:block" />

          <div className="w-full max-w-4xl mx-auto relative z-10">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/50 overflow-hidden">

              {/* Header */}
              <div className="bg-gradient-to-r from-purple-700 to-purple-900 px-5 sm:px-8 py-5 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                <div className="relative z-10 flex items-center gap-3">
                  <button onClick={() => setView('list')} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                    <ArrowLeft className="w-5 h-5 flex-shrink-0" />
                  </button>
                  <div className="flex flex-col items-start text-left">
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                      {isEditing ? 'Edit Bike' : 'Add New Bike'}
                    </h2>
                    <p className="mt-0.5 text-purple-200 text-xs sm:text-sm">
                      Fill in the vehicle details below.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-8">
                <Stepper />

                {error && (
                  <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{error}</div>
                )}

                <form onSubmit={handleSave} className="flex flex-col justify-between">
                  <div className="min-h-[240px]">

                    {/* Step 1 – Basic Details */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center justify-center sm:justify-start gap-2">
                          <Info className="text-purple-600 w-5 h-5 flex-shrink-0" /> Basic Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderInput('Bike Name / Model', 'name', 'text', true, 'E.g. Classic 350')}
                          {renderInput('Brand', 'brand', 'text', true, 'E.g. Royal Enfield')}
                          {renderInput('Vehicle Number', 'vehicleNumber', 'text', true, 'E.g. KA 01 AB 1234')}
                          {renderSelect('Category', 'category', ['Cruiser', 'Sports', 'Naked', 'Scooter', 'Adventure', 'Commuter'])}
                          {renderSelect('Fuel Type', 'fuelType', ['Petrol', 'Diesel', 'Electric', 'CNG'])}
                          {renderTextarea('Description', 'description', false, 'Any specific details about this bike…')}
                        </div>
                      </div>
                    )}

                    {/* Step 2 – Pricing */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center justify-center sm:justify-start gap-2">
                          <IndianRupee className="text-purple-600 w-5 h-5 flex-shrink-0" /> Pricing & Performance
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderInput('Mileage (kmpl)', 'mileage', 'number', false, 'E.g. 35')}
                          {renderInput('Price per Hour (₹)', 'pricePerHour', 'number', true, 'E.g. 100')}
                          {renderInput('Price per Day (₹)', 'pricePerDay', 'number', true, 'E.g. 1200')}
                          {renderInput('Security Deposit (₹)', 'securityDeposit', 'number', true, 'E.g. 2000')}
                        </div>
                      </div>
                    )}

                    {/* Step 3 – Registration */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center justify-center sm:justify-start gap-2">
                          <FileText className="text-purple-600 w-5 h-5 flex-shrink-0" /> Registration Documents
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderInput('Chassis Number', 'chassisNumber', 'text', true)}
                          {renderInput('Engine Number', 'engineNumber', 'text', true)}
                          {renderInput('RC Number', 'rcNumber', 'text', true)}
                          {renderFileDropzone('RC Document (PDF / Image)', 'rcDocument')}
                        </div>
                      </div>
                    )}

                    {/* Step 4 – Insurance */}
                    {currentStep === 4 && (
                      <div className="space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center justify-center sm:justify-start gap-2">
                          <ShieldAlert className="text-purple-600 w-5 h-5 flex-shrink-0" /> Insurance Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderInput('Insurance Policy Number', 'insurancePolicyNumber')}
                          {renderInput('Insurance Expiry Date', 'insuranceExpiryDate', 'date')}
                          {renderFileDropzone('Insurance Document', 'insuranceDocument')}
                        </div>
                      </div>
                    )}

                    {/* Step 5 – Media & Availability */}
                    {currentStep === 5 && (
                      <div className="space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center justify-center sm:justify-start gap-2">
                          <ImageIcon className="text-purple-600 w-5 h-5 flex-shrink-0" /> Media & Availability
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderFileDropzone('Bike Images', 'images')}
                          <div className="flex items-center gap-3 p-4 bg-white/60 border border-gray-200 rounded-lg shadow-sm hover:border-purple-300 transition-all">
                            <input
                              type="checkbox" id="isAvailable" name="isAvailable"
                              checked={formData.isAvailable} onChange={handleChange}
                              className="w-5 h-5 accent-purple-600 cursor-pointer flex-shrink-0"
                            />
                            <label htmlFor="isAvailable" className="text-sm font-semibold text-gray-800 cursor-pointer">
                              Mark as Available for Rent
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <NavFooter />
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BikeManagement;
