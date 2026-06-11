import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopsApi } from '../../../api';
import { isPartnerLoggedIn } from '../../../utils/auth';
import { fileToDataUrl } from '../../../utils/files';
import { 
  Store, 
  MapPin, 
  Clock, 
  Image as ImageIcon, 
  ShieldCheck, 
  Landmark,
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  UploadCloud
} from 'lucide-react';
import LocationPicker from '../../../components/LocationPicker';

const ShopRegistration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const totalSteps = 6;

  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    contactNumber: '',
    email: '',
    gstNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    openingTime: '',
    closingTime: '',
    workingDays: '',
    shopLogo: null,
    shopBanner: null,
    shopFrontImage: null,
    minimumAge: '',
    licenseRequired: 'Yes',
    securityDepositRules: '',
    lateReturnCharges: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    accountHolderName: '',
    locationLat: null,
    locationLng: null
  });

  useEffect(() => {
    if (!isPartnerLoggedIn()) {
      navigate('/consultancy/signin');
      return;
    }
    shopsApi.getMine()
      .then(({ shop }) => {
        setIsEdit(true);
        setFormData((prev) => ({
          ...prev,
          shopName: shop.shopName || '',
          ownerName: shop.ownerName || '',
          contactNumber: shop.contactNumber || '',
          email: shop.email || '',
          gstNumber: shop.gstNumber || '',
          address: shop.address || '',
          city: shop.city || '',
          state: shop.state || '',
          pincode: shop.pincode || '',
          openingTime: shop.openingTime || '',
          closingTime: shop.closingTime || '',
          workingDays: shop.workingDays || '',
          minimumAge: shop.minimumAge || '',
          licenseRequired: shop.licenseRequired || 'Yes',
          securityDepositRules: shop.securityDepositRules || '',
          lateReturnCharges: shop.lateReturnCharges || '',
          accountHolderName: shop.accountHolderName || '',
          accountNumber: shop.accountNumber || '',
          ifscCode: shop.ifscCode || '',
          bankName: shop.bankName || '',
          locationLat: shop.locationLat || null,
          locationLng: shop.locationLng || null,
        }));
      })
      .catch(() => {});
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (name === 'contactNumber') {
      setFormData(prev => ({
        ...prev,
        [name]: value.replace(/\D/g, '').slice(0, 10)
      }));
      return;
    }

    if (name === 'minimumAge') {
      setFormData(prev => ({
        ...prev,
        [name]: value.replace(/\D/g, '').slice(0, 2)
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value
    }));
  };

  const validateStep = (step) => {
    setError('');
    let missing = [];
    if (step === 1) {
      if (!formData.shopName) missing.push('Shop Name');
      if (!formData.ownerName) missing.push('Owner Name');
      if (!formData.contactNumber) missing.push('Contact Number');
      else if (formData.contactNumber.length !== 10) missing.push('Valid 10-digit Contact Number');
      if (!formData.email) missing.push('Email Address');
    } else if (step === 2) {
      if (!formData.city) missing.push('City');
      if (!formData.state) missing.push('State');
      if (!formData.pincode) missing.push('Pincode');
      if (!formData.locationLat || !formData.locationLng) missing.push('Pinpoint Exact Location');
      if (!formData.address) missing.push('Complete Address');
    } else if (step === 3) {
      if (!formData.openingTime) missing.push('Opening Time');
      if (!formData.closingTime) missing.push('Closing Time');
      if (!formData.workingDays || formData.workingDays.length === 0) missing.push('Working Days');
    } else if (step === 4) {
      if (!isEdit && !formData.shopLogo) missing.push('Shop Logo');
      if (!isEdit && !formData.shopBanner) missing.push('Store Banner');
      if (!isEdit && !formData.shopFrontImage) missing.push('Front Image');
    } else if (step === 5) {
      if (!formData.minimumAge) missing.push('Minimum Age');
      if (!formData.securityDepositRules) missing.push('Security Deposit Rules');
      if (!formData.lateReturnCharges) missing.push('Late Return Charges');
    } else if (step === 6) {
      if (!formData.accountHolderName) missing.push('Account Holder Name');
      if (!formData.accountNumber) missing.push('Account Number');
      if (!formData.ifscCode) missing.push('IFSC Code');
      if (!formData.bankName) missing.push('Bank Name');
    }

    if (missing.length > 0) {
      setError(`Please fill all required fields: ${missing.join(', ')}`);
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(6)) return;
    setError('');
    setSubmitting(true);
    try {
      const [shopLogo, shopBanner, shopFrontImage] = await Promise.all([
        fileToDataUrl(formData.shopLogo),
        fileToDataUrl(formData.shopBanner),
        fileToDataUrl(formData.shopFrontImage),
      ]);

      const payload = {
        shopName: formData.shopName,
        ownerName: formData.ownerName,
        contactNumber: formData.contactNumber,
        email: formData.email,
        gstNumber: formData.gstNumber,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        openingTime: formData.openingTime,
        closingTime: formData.closingTime,
        workingDays: formData.workingDays,
        minimumAge: formData.minimumAge,
        licenseRequired: formData.licenseRequired,
        securityDepositRules: formData.securityDepositRules,
        lateReturnCharges: formData.lateReturnCharges,
        accountHolderName: formData.accountHolderName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        bankName: formData.bankName,
        locationLat: formData.locationLat,
        locationLng: formData.locationLng,
        ...(shopLogo && { shopLogo }),
        ...(shopBanner && { shopBanner }),
        ...(shopFrontImage && { shopFrontImage }),
      };

      if (isEdit) {
        await shopsApi.updateMine(payload);
      } else {
        await shopsApi.register(payload);
      }
      navigate('/consultancy/shop-profile');
    } catch (err) {
      setError(err.message || 'Failed to save shop');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: 'Basic', icon: <Store className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 2, title: 'Location', icon: <MapPin className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 3, title: 'Schedule', icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 4, title: 'Media', icon: <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 5, title: 'Policies', icon: <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 6, title: 'Bank', icon: <Landmark className="w-4 h-4 sm:w-5 sm:h-5" /> },
  ];

  const renderInput = (label, name, type = "text", required = true, placeholder = "") => (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={name} className="text-sm font-semibold text-gray-700 ml-1">
        {label} {required && <span className="text-purple-500">*</span>}
      </label>
      <input 
        type={type} 
        id={name} 
        name={name}
        value={type !== 'file' ? formData[name] : undefined} 
        onChange={handleChange} 
        placeholder={placeholder}
        className="w-full p-2.5 bg-white/60 border border-gray-200 rounded-lg text-gray-800 text-sm outline-none transition-all duration-300 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 hover:border-purple-300 shadow-sm"
        required={required} 
      />
    </div>
  );

  const renderTextarea = (label, name, required = true, placeholder = "") => (
    <div className="flex flex-col gap-1.5 w-full md:col-span-2">
      <label htmlFor={name} className="text-sm font-semibold text-gray-700 ml-1">
        {label} {required && <span className="text-purple-500">*</span>}
      </label>
      <textarea 
        id={name} 
        name={name}
        value={formData[name]} 
        onChange={handleChange} 
        placeholder={placeholder}
        rows="2"
        className="w-full p-2.5 bg-white/60 border border-gray-200 rounded-lg text-gray-800 text-sm outline-none transition-all duration-300 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 hover:border-purple-300 shadow-sm resize-none"
        required={required} 
      />
    </div>
  );

  const renderFileDropzone = (label, name) => (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-semibold text-gray-700 ml-1 text-left">
        {label} {!isEdit && <span className="text-purple-500">*</span>}
      </label>
      <div className="relative group w-full h-24 flex flex-col items-center justify-center border-2 border-dashed border-purple-200 rounded-lg bg-purple-50/50 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 cursor-pointer overflow-hidden">
        <input 
          type="file" 
          name={name} 
          onChange={handleChange} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          required={!isEdit}
        />
        <UploadCloud className="w-6 h-6 text-purple-400 mb-1 group-hover:text-purple-600 transition-colors" />
        <span className="text-sm font-medium text-purple-600 truncate px-2 w-full text-center">
          {formData[name] ? formData[name].name : "Upload"}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[conic-gradient(at_bottom_right,_var(--tw-gradient-stops))] from-purple-100 via-white to-purple-50 pt-8 pb-12 px-3 sm:px-6 flex justify-center items-start font-sans relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300/30 rounded-full blur-3xl hidden sm:block" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-300/20 rounded-full blur-3xl hidden sm:block" />

      <div className="w-full max-w-4xl relative z-10">
        
        {/* Glassmorphic Card Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/50 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-700 to-purple-900 px-5 sm:px-8 py-5 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10 flex flex-col items-center sm:items-start text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Partner with Us</h2>
              <p className="mt-1 text-purple-200 text-xs sm:text-sm max-w-lg">
                Set up your bike rental shop profile securely.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            {error && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{error}</div>
            )}
            {/* Custom Stepper */}
            <div className="flex items-center justify-between mb-8 relative">
              <div className="absolute left-0 top-4 sm:top-5 w-full h-1 bg-gray-200 rounded-full -z-10"></div>
              <div 
                className="absolute left-0 top-4 sm:top-5 h-1 bg-purple-600 rounded-full -z-10 transition-all duration-500 ease-in-out"
                style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
              ></div>
              
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center gap-1 sm:gap-2 bg-white px-1">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${
                    currentStep >= step.id 
                      ? 'bg-purple-600 text-white shadow-purple-500/40' 
                      : 'bg-white text-gray-400 border border-gray-200'
                  }`}>
                    {currentStep > step.id ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : step.icon}
                  </div>
                  <span className={`text-[9px] sm:text-[11px] font-bold uppercase tracking-wider hidden sm:block ${
                    currentStep >= step.id ? 'text-purple-700' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col justify-between">
              
              {/* Form Content Area */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-[220px]">
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
                      <Store className="text-purple-600 w-5 h-5 flex-shrink-0" /> Basic Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderInput('Shop Name', 'shopName', 'text', true, 'Royal Enfield Hub')}
                      {renderInput('Owner Name', 'ownerName', 'text', true, 'John Doe')}
                      {renderInput('Contact Number', 'contactNumber', 'tel', true, '+91 9876543210')}
                      {renderInput('Email Address', 'email', 'email', true, 'hello@shop.com')}
                      {renderInput('GST Number (Optional)', 'gstNumber', 'text', false, '22AAAAA0000A1Z5')}
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
                      <MapPin className="text-purple-600 w-5 h-5 flex-shrink-0" /> Location Info
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderInput('City', 'city', 'text', true, 'Bangalore')}
                      {renderInput('State', 'state', 'text', true, 'Karnataka')}
                      {renderInput('Pincode', 'pincode', 'text', true, '560001')}
                    </div>
                    <div className="mt-4">
                      <label className="text-sm font-semibold text-gray-700 ml-1 block mb-1.5">
                        Pinpoint Exact Location <span className="text-purple-500">*</span>
                      </label>
                      <LocationPicker 
                        initialPosition={formData.locationLat ? { lat: formData.locationLat, lng: formData.locationLng } : null}
                        onLocationSelect={(pos) => setFormData(prev => ({ ...prev, locationLat: pos.lat, locationLng: pos.lng }))}
                        onAddressSelect={(addressData) => {
                          setFormData(prev => ({
                            ...prev,
                            address: addressData.fullAddress || prev.address,
                            city: addressData.city || prev.city,
                            state: addressData.state || prev.state,
                            pincode: addressData.pincode || prev.pincode
                          }));
                        }}
                      />
                    </div>
                    <div className="mt-2">
                      {renderTextarea('Complete Address', 'address', true, '123 Main Street, Sector 4')}
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
                      <Clock className="text-purple-600 w-5 h-5 flex-shrink-0" /> Operating Schedule
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderInput('Opening Time', 'openingTime', 'time')}
                      {renderInput('Closing Time', 'closingTime', 'time')}
                      <div className="md:col-span-2 flex flex-col gap-1.5 w-full">
                        <label htmlFor="workingDays" className="text-sm font-semibold text-gray-700 ml-1">
                          Working Days <span className="text-purple-500">*</span>
                        </label>
                        <select 
                          id="workingDays" 
                          name="workingDays"
                          value={formData.workingDays} 
                          onChange={handleChange} 
                          className="w-full p-2.5 bg-white/60 border border-gray-200 rounded-lg text-gray-800 text-sm outline-none transition-all duration-300 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 cursor-pointer shadow-sm"
                          required
                        >
                          <option value="">Select Working Days</option>
                          <option value="Monday to Friday">Monday to Friday</option>
                          <option value="Monday to Saturday">Monday to Saturday</option>
                          <option value="Monday to Sunday (All Days)">Monday to Sunday (All Days)</option>
                          <option value="Weekends Only">Weekends Only</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
                      <ImageIcon className="text-purple-600 w-5 h-5 flex-shrink-0" /> Visual Identity
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {renderFileDropzone('Shop Logo', 'shopLogo')}
                      {renderFileDropzone('Store Banner', 'shopBanner')}
                      {renderFileDropzone('Front Image', 'shopFrontImage')}
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
                      <ShieldCheck className="text-purple-600 w-5 h-5 flex-shrink-0" /> Rental Policies
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderInput('Minimum Age Requirement', 'minimumAge', 'text', true, '18')}
                      
                      <div className="flex flex-col gap-1.5 w-full text-left">
                        <label htmlFor="licenseRequired" className="text-sm font-semibold text-gray-700 ml-1">
                          Driving License Required <span className="text-purple-500">*</span>
                        </label>
                        <select 
                          id="licenseRequired" 
                          name="licenseRequired"
                          value={formData.licenseRequired} 
                          onChange={handleChange} 
                          className="w-full p-2.5 bg-white/60 border border-gray-200 rounded-lg text-gray-800 text-sm outline-none transition-all duration-300 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 cursor-pointer shadow-sm"
                        >
                          <option value="Yes">Yes, Mandatory</option>
                          <option value="No">No, Not Required</option>
                        </select>
                      </div>

                      {renderTextarea('Security Deposit Rules', 'securityDepositRules', true, 'E.g. ₹1000 refundable deposit required.')}
                      {renderTextarea('Late Return Charges', 'lateReturnCharges', true, 'E.g. ₹50 per extra hour.')}
                    </div>
                  </div>
                )}

                {currentStep === 6 && (
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
                      <Landmark className="text-purple-600 w-5 h-5 flex-shrink-0" /> Bank Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderInput('Account Holder Name', 'accountHolderName', 'text', true, 'E.g. John Doe')}
                      {renderInput('Account Number', 'accountNumber', 'text', true, 'E.g. 1234567890')}
                      {renderInput('IFSC Code', 'ifscCode', 'text', true, 'E.g. HDFC0001234')}
                      <div className="flex flex-col gap-1.5 w-full">
                        <label htmlFor="bankName" className="text-sm font-semibold text-gray-700 ml-1">
                          Bank Name <span className="text-purple-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          id="bankName" 
                          name="bankName"
                          list="banks"
                          value={formData.bankName} 
                          onChange={handleChange} 
                          placeholder="E.g. HDFC Bank"
                          className="w-full p-2.5 bg-white/60 border border-gray-200 rounded-lg text-gray-800 text-sm outline-none transition-all duration-300 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 hover:border-purple-300 shadow-sm"
                          required
                        />
                        <datalist id="banks">
                          <option value="HDFC Bank" />
                          <option value="State Bank of India" />
                          <option value="ICICI Bank" />
                          <option value="Axis Bank" />
                          <option value="Kotak Mahindra Bank" />
                          <option value="Punjab National Bank" />
                          <option value="Bank of Baroda" />
                          <option value="Canara Bank" />
                          <option value="Union Bank of India" />
                        </datalist>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                <button 
                  type="button" 
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    currentStep === 1 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 flex-shrink-0" /> Back
                </button>

                {currentStep < totalSteps ? (
                  <button 
                    type="button" 
                    onClick={nextStep}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 hover:shadow-md hover:shadow-purple-500/30 active:scale-95 transition-all duration-300"
                  >
                    Continue <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  </button>
                ) : (
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-bold hover:from-purple-700 hover:to-indigo-700 hover:shadow-md hover:shadow-purple-500/40 active:scale-95 transition-all duration-300 disabled:opacity-70"
                  >
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {submitting ? 'Saving...' : isEdit ? 'Update Shop' : 'Complete'}
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopRegistration;
