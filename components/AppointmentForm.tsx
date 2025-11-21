import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  User, 
  Smartphone, 
  CreditCard, 
  CheckCircle2, 
  Stethoscope, 
  Clock, 
  Activity, 
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { DOCTORS, TIME_SLOTS, VISIT_TYPES } from '../constants';
import { AppointmentData, AppStage, Doctor, TimeSlot, VisitType } from '../types';

const INITIAL_DATA: AppointmentData = {
  phoneNumber: '',
  date: '',
  name: '',
  birthday: '',
  idNumber: '',
  doctor: null,
  timeSlot: null,
  visitType: null,
  lineUserId: '',
};

// TODO: 未來請將您的 LIFF ID 填入此處，例如 '1657xxxxxx-Abcdefgh'
const LIFF_ID = ''; 

export const AppointmentForm: React.FC = () => {
  const [stage, setStage] = useState<AppStage>(AppStage.VERIFY_PHONE);
  const [data, setData] = useState<AppointmentData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof AppointmentData, string>>>({});
  const [isLiffLoggedIn, setIsLiffLoggedIn] = useState(false);

  // Initialize LIFF
  useEffect(() => {
    const initLiff = async () => {
      try {
        const liff = (window as any).liff;
        if (liff && LIFF_ID) {
          await liff.init({ liffId: LIFF_ID });
          
          if (liff.isLoggedIn()) {
            setIsLiffLoggedIn(true);
            const profile = await liff.getProfile();
            console.log('LIFF Profile:', profile);
            setData(prev => ({
              ...prev,
              name: profile.displayName || '',
              lineUserId: profile.userId
            }));
          }
        } else if (!LIFF_ID) {
          console.log('LIFF ID 未設定，跳過 LIFF 初始化');
        }
      } catch (error) {
        console.error('LIFF init failed:', error);
      }
    };

    initLiff();
  }, []);
  
  // Helper validation functions
  const validateDate = (dateStr: string): boolean => {
    // Accepts YYYY/MM/DD or YYYY/M/D
    const regex = /^\d{4}\/\d{1,2}\/\d{1,2}$/;
    if (!regex.test(dateStr)) return false;
    
    const [year, month, day] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  };

  const handlePhoneVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(data.phoneNumber)) {
      setErrors({ phoneNumber: '請輸入正確的手機號碼 (09開頭共10碼)' });
      return;
    }
    setErrors({});
    setStage(AppStage.FILL_FORM);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<keyof AppointmentData, string>> = {};

    if (!validateDate(data.date)) newErrors.date = '格式錯誤 (例: 2023/10/25 或 2023/5/3)';
    if (!data.name.trim()) newErrors.name = '請輸入姓名';
    if (!validateDate(data.birthday)) newErrors.birthday = '格式錯誤 (例: 1990/05/01 或 1990/5/1)';
    if (!data.idNumber.trim()) newErrors.idNumber = '請輸入身分證字號';
    if (!data.doctor) newErrors.doctor = '請選擇醫師';
    if (!data.timeSlot) newErrors.timeSlot = '請選擇時段';
    if (!data.visitType) newErrors.visitType = '請選擇診療類型';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setStage(AppStage.SUCCESS);
    } else {
      // Scroll to top or first error could be added here
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRestart = () => {
    // Keep lineUserId and name if logged in via LIFF
    if (isLiffLoggedIn) {
        setData({
            ...INITIAL_DATA,
            name: data.name,
            lineUserId: data.lineUserId
        });
    } else {
        setData(INITIAL_DATA);
    }
    setStage(AppStage.VERIFY_PHONE);
    setErrors({});
  };

  // 1. Phone Verification View
  if (stage === AppStage.VERIFY_PHONE) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-teal-100 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">身分驗證</h2>
          <p className="text-slate-500 mb-6 text-sm">為了確保預約權益，請先輸入您的手機號碼進行驗證。</p>
          
          <form onSubmit={handlePhoneVerify} className="space-y-4">
            <div className="text-left">
              <label className="block text-sm font-medium text-slate-700 mb-1 pl-1">手機號碼</label>
              <div className="relative">
                <input
                  type="tel"
                  value={data.phoneNumber}
                  onChange={(e) => setData({ ...data, phoneNumber: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.phoneNumber ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-slate-50'} focus:bg-white focus:border-teal-500 outline-none transition-all`}
                  placeholder="0912345678"
                  autoFocus
                />
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
              {errors.phoneNumber && <p className="text-rose-500 text-xs mt-1 pl-1">{errors.phoneNumber}</p>}
            </div>
            
            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <span>開始預約</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Main Form View
  if (stage === AppStage.FILL_FORM) {
    return (
      <div className="h-full overflow-y-auto no-scrollbar bg-slate-50">
        <div className="max-w-3xl mx-auto p-4 md:p-8 pb-24">
          
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1 h-6 bg-teal-500 rounded-full block"></span>
              填寫預約資料
            </h2>
            <div className="text-xs font-medium bg-teal-100 text-teal-700 px-3 py-1 rounded-full flex items-center gap-1">
              {isLiffLoggedIn && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
              已驗證: {data.phoneNumber}
            </div>
          </div>

          <form onSubmit={handleSubmitForm} className="space-y-6">
            
            {/* Section 1: Date */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-500" /> 預約日期
              </h3>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">日期 (YYYY/MM/DD)</label>
                <input
                  type="text"
                  value={data.date}
                  onChange={(e) => setData({ ...data, date: e.target.value })}
                  className={`w-full p-3 rounded-xl border ${errors.date ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-slate-50'} focus:border-teal-500 outline-none`}
                  placeholder="例如: 2023/10/25 或 2023/5/3"
                />
                {errors.date && <p className="text-rose-500 text-xs mt-1">{errors.date}</p>}
              </div>
            </div>

            {/* Section 2: Personal Info */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-teal-500" /> 個人資料
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">姓名</label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    className={`w-full p-3 rounded-xl border ${errors.name ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-slate-50'} focus:border-teal-500 outline-none`}
                    placeholder="請輸入姓名"
                  />
                  {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
                  {isLiffLoggedIn && data.name && <p className="text-teal-500 text-[10px] mt-1">* 已自動帶入 LINE 暱稱</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">出生年月日 (YYYY/MM/DD)</label>
                  <input
                    type="text"
                    value={data.birthday}
                    onChange={(e) => setData({ ...data, birthday: e.target.value })}
                    className={`w-full p-3 rounded-xl border ${errors.birthday ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-slate-50'} focus:border-teal-500 outline-none`}
                    placeholder="例如: 1990/05/01 或 1990/5/1"
                  />
                  {errors.birthday && <p className="text-rose-500 text-xs mt-1">{errors.birthday}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">身分證字號</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={data.idNumber}
                      onChange={(e) => setData({ ...data, idNumber: e.target.value.toUpperCase() })}
                      className={`w-full pl-10 pr-3 py-3 rounded-xl border ${errors.idNumber ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-slate-50'} focus:border-teal-500 outline-none`}
                      placeholder="請輸入身分證字號"
                    />
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                  {errors.idNumber && <p className="text-rose-500 text-xs mt-1">{errors.idNumber}</p>}
                </div>
              </div>
            </div>

            {/* Section 3: Doctor Selection */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-500" /> 選擇醫師
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {DOCTORS.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setData({ ...data, doctor: doc })}
                    className={`relative p-3 rounded-xl border transition-all text-center flex flex-col items-center gap-2 ${
                      data.doctor?.id === doc.id 
                        ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' 
                        : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                    }`}
                  >
                    {data.doctor?.id === doc.id && (
                      <div className="absolute top-2 right-2 text-teal-600">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100">
                      <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{doc.name}</div>
                      <div className="text-xs text-slate-500">{doc.specialty}</div>
                    </div>
                  </button>
                ))}
              </div>
              {errors.doctor && <p className="text-rose-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.doctor}</p>}
            </div>

            {/* Section 4: Time Slot */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-500" /> 選擇時段
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setData({ ...data, timeSlot: slot })}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                      data.timeSlot?.id === slot.id
                        ? 'border-teal-500 bg-teal-600 text-white shadow-md'
                        : 'border-slate-200 text-slate-600 hover:border-teal-400 hover:text-teal-600'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
              {errors.timeSlot && <p className="text-rose-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.timeSlot}</p>}
            </div>

            {/* Section 5: Visit Type */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-500" /> 診療類型
              </h3>
              <div className="flex flex-col gap-3">
                {VISIT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setData({ ...data, visitType: type })}
                    className={`flex items-center justify-center p-4 rounded-xl border transition-all ${
                      data.visitType?.id === type.id
                        ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500'
                        : 'border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    <span className={`font-bold ${data.visitType?.id === type.id ? 'text-teal-800' : 'text-slate-700'}`}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
              {errors.visitType && <p className="text-rose-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.visitType}</p>}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                確認預約
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 3. Success View
  return (
    <div className="flex items-center justify-center h-full p-6 bg-teal-50 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-teal-100">
        <div className="bg-teal-600 p-6 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">預約完成 🎉</h2>
          <p className="text-teal-100 text-sm mt-1">您的掛號資訊如下</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl space-y-3 text-sm border border-slate-100">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">手機號碼</span>
              <span className="font-medium text-slate-800">{data.phoneNumber}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">預約日期</span>
              <span className="font-medium text-slate-800">{data.date}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">姓名</span>
              <span className="font-medium text-slate-800">{data.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">出生年月日</span>
              <span className="font-medium text-slate-800">{data.birthday}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">身分證字號</span>
              <span className="font-medium text-slate-800">{data.idNumber}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">醫師</span>
              <span className="font-medium text-slate-800">{data.doctor?.name} <span className="text-slate-400 text-xs">({data.doctor?.specialty})</span></span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">時段</span>
              <span className="font-medium text-slate-800">{data.timeSlot?.label}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-500">診療類型</span>
              <span className="font-medium text-slate-800">{data.visitType?.label}</span>
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-all"
          >
            預約下一筆
          </button>
        </div>
      </div>
    </div>
  );
};
