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
  AlertCircle,
  MessageSquare,
  Send
} from 'lucide-react';
import { DOCTORS, TIME_SLOTS, VISIT_TYPES } from '../constants';
import { AppointmentData, AppStage } from '../types';

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

// TODO: 請將您的 LIFF ID 填入此處
const LIFF_ID = ''; 

// TODO: 請將您的 Google Apps Script 網址填入此處
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyf-VZptSQPtbnGH3DwsCO76nmEQqaUKBZbumUpfRBuQr-aNFOzMcCfCEgBqA74lm9m/exec';

export const AppointmentForm: React.FC = () => {
  const [stage, setStage] = useState<AppStage>(AppStage.VERIFY_PHONE);
  const [data, setData] = useState<AppointmentData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof AppointmentData, string>>>({});
  const [isLiffLoggedIn, setIsLiffLoggedIn] = useState(false);
  
  // OTP State
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [smsSentStatus, setSmsSentStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Date Constraints
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const maxBirthday = new Date();
  maxBirthday.setFullYear(maxBirthday.getFullYear() - 10);
  const maxBirthdayStr = maxBirthday.toISOString().split('T')[0];

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

  // Countdown timer for OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  const handleSendOtp = () => {
    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(data.phoneNumber)) {
      setErrors({ phoneNumber: '請輸入正確的手機號碼 (09xxxxxxxx)' });
      return;
    }
    setErrors({});
    
    // Simulate sending OTP
    const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(mockOtp);
    setShowOtpInput(true);
    setCountdown(60); // 60 seconds cooldown
    
    console.log(`OTP Sent: ${mockOtp}`);
    alert(`【測試模式】您的驗證碼為：${mockOtp}\n(實際應用中會發送簡訊至您的手機)`);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === generatedOtp) {
        setStage(AppStage.FILL_FORM);
    } else {
        setErrors({ phoneNumber: '驗證碼錯誤，請重新輸入' });
    }
  };

  const sendSuccessSMS = async () => {
      setSmsSentStatus('sending');
      // Simulate API Delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log(`Sending confirmation SMS to ${data.phoneNumber}`);
      setSmsSentStatus('sent');
  };

  const saveToGoogleSheets = async (appointmentData: AppointmentData) => {
    if (!GOOGLE_SCRIPT_URL) {
      console.warn('Google Script URL not set');
      return;
    }

    try {
      // Transform data for Google Sheets
      const sheetData = {
        timestamp: new Date().toISOString(),
        name: appointmentData.name,
        phoneNumber: appointmentData.phoneNumber,
        idNumber: appointmentData.idNumber,
        birthday: appointmentData.birthday,
        date: appointmentData.date,
        timeSlot: appointmentData.timeSlot?.label || '',
        doctor: appointmentData.doctor?.name || '',
        visitType: appointmentData.visitType?.label || ''
      };

      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Important for Google Apps Script
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sheetData),
      });
      console.log('Data sent to Google Sheets');
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<keyof AppointmentData, string>> = {};

    if (!data.name.trim()) newErrors.name = '請輸入姓名';
    if (!data.birthday) newErrors.birthday = '請選擇出生年月日';
    if (!data.idNumber.trim()) newErrors.idNumber = '請輸入身分證字號';
    if (!data.date) newErrors.date = '請選擇預約日期';
    if (!data.doctor) newErrors.doctor = '請選擇醫師';
    if (!data.timeSlot) newErrors.timeSlot = '請選擇時段';
    if (!data.visitType) newErrors.visitType = '請選擇診療類型';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Save to Google Sheets
      saveToGoogleSheets(data);
      // Send SMS
      await sendSuccessSMS(); 
      setStage(AppStage.SUCCESS);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRestart = () => {
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
    setOtp('');
    setShowOtpInput(false);
    setSmsSentStatus('idle');
  };

  // 1. Phone Verification View (With OTP)
  if (stage === AppStage.VERIFY_PHONE) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-teal-100 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">身分驗證</h2>
          <p className="text-slate-500 mb-6 text-sm">請輸入手機號碼並進行簡訊驗證。</p>
          
          <div className="space-y-4">
            <div className="text-left">
              <label className="block text-sm font-medium text-slate-700 mb-1 pl-1">手機號碼</label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                    <input
                    type="tel"
                    value={data.phoneNumber}
                    onChange={(e) => setData({ ...data, phoneNumber: e.target.value })}
                    disabled={showOtpInput}
                    className={`w-full pl-10 pr-4 h-[52px] appearance-none rounded-xl border ${errors.phoneNumber && !showOtpInput ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-slate-50'} focus:bg-white focus:border-teal-500 outline-none transition-all`}
                    placeholder="0912345678"
                    />
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
              </div>
              {errors.phoneNumber && !showOtpInput && <p className="text-rose-500 text-xs mt-1 pl-1">{errors.phoneNumber}</p>}
            </div>

            {/* OTP Input Section */}
            {showOtpInput && (
                <div className="text-left animate-fade-in">
                     <label className="block text-sm font-medium text-slate-700 mb-1 pl-1">驗證碼</label>
                     <div className="relative">
                        <input
                            type="text"
                            maxLength={4}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full pl-10 pr-4 h-[52px] appearance-none rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none text-center tracking-widest font-bold text-lg"
                            placeholder="- - - -"
                        />
                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                     </div>
                     {errors.phoneNumber && showOtpInput && <p className="text-rose-500 text-xs mt-1 pl-1">{errors.phoneNumber}</p>}
                     <div className="text-center mt-2">
                        {countdown > 0 ? (
                            <span className="text-xs text-slate-400">重新發送 ({countdown}s)</span>
                        ) : (
                            <button 
                                onClick={handleSendOtp}
                                className="text-xs text-teal-600 hover:text-teal-800 font-medium underline"
                            >
                                沒收到驗證碼？重新發送
                            </button>
                        )}
                     </div>
                </div>
            )}
            
            {!showOtpInput ? (
                <button
                onClick={handleSendOtp}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                發送驗證碼
                </button>
            ) : (
                <button
                onClick={handleVerifyOtp}
                className="w-full bg-teal-800 hover:bg-teal-900 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                <span>驗證並開始預約</span>
                <ChevronRight className="w-4 h-4" />
                </button>
            )}
          </div>
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
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              已驗證: {data.phoneNumber}
            </div>
          </div>

          <form onSubmit={handleSubmitForm} className="space-y-6">
            
             {/* Section 1: Personal Info */}
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
                    className={`w-full px-4 h-[52px] appearance-none rounded-xl border ${errors.name ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-slate-50'} focus:border-teal-500 outline-none`}
                    placeholder="請輸入姓名"
                  />
                  {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
                  {isLiffLoggedIn && data.name && <p className="text-teal-500 text-[10px] mt-1">* 已自動帶入 LINE 暱稱</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">出生年月日</label>
                  <input
                    type="date"
                    max={maxBirthdayStr}
                    value={data.birthday}
                    onChange={(e) => setData({ ...data, birthday: e.target.value })}
                    className={`w-full px-4 h-[52px] appearance-none rounded-xl border ${errors.birthday ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-slate-50'} focus:border-teal-500 outline-none`}
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
                      className={`w-full pl-10 pr-3 h-[52px] appearance-none rounded-xl border ${errors.idNumber ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-slate-50'} focus:border-teal-500 outline-none`}
                      placeholder="請輸入身分證字號"
                    />
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                  {errors.idNumber && <p className="text-rose-500 text-xs mt-1">{errors.idNumber}</p>}
                </div>
              </div>
            </div>

            {/* Section 2: Date */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-500" /> 預約日期
              </h3>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">選擇日期</label>
                <input
                  type="date"
                  min={todayStr}
                  value={data.date}
                  onChange={(e) => setData({ ...data, date: e.target.value })}
                  className={`w-full px-4 h-[52px] appearance-none rounded-xl border ${errors.date ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-slate-50'} focus:border-teal-500 outline-none`}
                />
                {errors.date && <p className="text-rose-500 text-xs mt-1">{errors.date}</p>}
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
            {/* SMS Status Indicator */}
            {smsSentStatus === 'sending' && (
                 <div className="flex items-center gap-2 text-teal-600 bg-teal-50 p-2 rounded mb-2 text-xs">
                     <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                     正在發送預約簡訊...
                 </div>
            )}
            {smsSentStatus === 'sent' && (
                 <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded mb-2 text-xs border border-green-100">
                     <Send className="w-3 h-3" />
                     已發送預約成功簡訊通知
                 </div>
            )}

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
