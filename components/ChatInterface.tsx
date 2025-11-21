import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Check, RefreshCcw, User, Calendar, CreditCard, Clock, Activity, Smartphone, ShieldCheck } from 'lucide-react';
import { Step, Message, Sender, AppointmentData, Doctor, TimeSlot, VisitType } from '../types';
import { DOCTORS, TIME_SLOTS, VISIT_TYPES } from '../constants';

const INITIAL_DATA: AppointmentData = {
  phoneNumber: '',
  date: '',
  name: '',
  birthday: '',
  idNumber: '',
  doctor: null,
  timeSlot: null,
  visitType: null,
};

export const ChatInterface: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.VERIFY_PHONE);
  const [data, setData] = useState<AppointmentData>(INITIAL_DATA);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Helper to add system message with a slight delay to simulate thinking
  const addSystemMessage = useCallback((text: string | React.ReactNode, delay = 600) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text,
          sender: Sender.SYSTEM,
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }, delay);
  }, []);

  // Helper to add user message immediately
  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text,
        sender: Sender.USER,
        timestamp: new Date(),
      },
    ]);
  };

  // Initialize chat
  useEffect(() => {
    // Only run once on mount
    if (messages.length === 0) {
      addSystemMessage(
        <div className="space-y-2">
          <p className="font-bold text-teal-700">歡迎使用線上預約系統 👋</p>
          <p>為了確保是真人預約，請先輸入您的 <span className="font-semibold text-teal-600">手機號碼</span> 進行驗證。</p>
        </div>, 
        300
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTextSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    addUserMessage(text);
    setInputText('');
    processInput(text);
  };

  const processInput = (input: string) => {
    switch (step) {
      case Step.VERIFY_PHONE:
        // Simple validation for Taiwan phone number (09xxxxxxxx)
        // eslint-disable-next-line no-case-declarations
        const phoneRegex = /^09\d{8}$/;
        if (!phoneRegex.test(input)) {
          addSystemMessage('手機號碼格式不正確，請輸入 09 開頭的 10 碼數字。');
          return;
        }
        
        // Simulate verification process
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            addSystemMessage(
                <div className="flex items-center gap-2 text-teal-700 font-medium">
                    <ShieldCheck className="w-5 h-5" />
                    <span>驗證成功！真人身分已確認。</span>
                </div>, 
                0
            );
            
            // Move to next step after short delay
            setTimeout(() => {
                setData((prev) => ({ ...prev, phoneNumber: input }));
                setStep(Step.SELECT_DATE);
                addSystemMessage('請選擇想要預約的日期。（格式：YYYY/MM/DD）');
            }, 1000);
        }, 800);
        break;

      case Step.SELECT_DATE:
        // Validate simple date format YYYY/MM/DD
        // eslint-disable-next-line no-case-declarations
        const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
        if (!dateRegex.test(input)) {
          addSystemMessage('日期格式不正確，請使用 YYYY/MM/DD 格式（例如 2023/10/20）。');
          return;
        }
        setData((prev) => ({ ...prev, date: input }));
        setStep(Step.CONFIRM_DATE);
        addSystemMessage(`已選擇日期：${input}。是否要開始預約？（是／否）`);
        break;

      case Step.CONFIRM_DATE:
        if (input.includes('是') || input.toLowerCase() === 'yes' || input.toLowerCase() === 'y') {
          setStep(Step.INPUT_NAME);
          addSystemMessage('好的，請輸入您的姓名。');
        } else {
          setStep(Step.SELECT_DATE);
          addSystemMessage('了解，請重新輸入您想要預約的日期。（格式：YYYY/MM/DD）');
        }
        break;

      case Step.INPUT_NAME:
        setData((prev) => ({ ...prev, name: input }));
        setStep(Step.INPUT_BIRTHDAY);
        addSystemMessage('請輸入出生年月日。（格式：YYYY/MM/DD）');
        break;

      case Step.INPUT_BIRTHDAY:
         // eslint-disable-next-line no-case-declarations
         const birthRegex = /^\d{4}\/\d{2}\/\d{2}$/;
         if (!birthRegex.test(input)) {
           addSystemMessage('日期格式不正確，請使用 YYYY/MM/DD 格式。');
           return;
         }
        setData((prev) => ({ ...prev, birthday: input }));
        setStep(Step.INPUT_ID);
        addSystemMessage('請輸入身分證字號。');
        break;

      case Step.INPUT_ID:
        // Simple length check, in real app use detailed validation
        if (input.length < 4) {
             addSystemMessage('身分證字號格式似乎有誤，請重新輸入。');
             return;
        }
        setData((prev) => ({ ...prev, idNumber: input }));
        setStep(Step.SELECT_DOCTOR);
        addSystemMessage(
          <>
            <p className="mb-2">個人資料已填寫完成。</p>
            <p>請選擇想預約的醫師（點擊下方選項）：</p>
          </>
        );
        break;

      case Step.SELECT_DOCTOR:
        // Handled by click handlers mostly, but if typed manually:
        // eslint-disable-next-line no-case-declarations
        const docIndex = parseInt(input);
        if (!isNaN(docIndex) && docIndex >= 1 && docIndex <= 6) {
             handleDoctorSelect(DOCTORS[docIndex - 1]);
        } else {
            addSystemMessage('請輸入有效的醫師編號 (1-6) 或點擊下方卡片。');
        }
        break;

        // Other steps are mostly handled by specific UI widgets calling handlers directly
      default:
        break;
    }
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    addUserMessage(`選擇：${doctor.name}`);
    setData((prev) => ({ ...prev, doctor }));
    setStep(Step.SELECT_TIME);
    addSystemMessage('請選擇時段。');
  };

  const handleTimeSelect = (time: TimeSlot) => {
    addUserMessage(`時段：${time.label}`);
    setData((prev) => ({ ...prev, timeSlot: time }));
    setStep(Step.SELECT_TYPE);
    addSystemMessage('請選擇診療類型：初診／內科／針灸');
  };

  const handleTypeSelect = (type: VisitType) => {
    // Do not add user message here immediately, let the finish flow handle it
    // actually, consistent UX suggests showing what they clicked
    const finalData = { ...data, visitType: type };
    setData(finalData);
    addUserMessage(`類型：${type.label}`);
    
    setStep(Step.COMPLETED);
    // Final Summary
    setTimeout(() => {
        const summary = (
            <div className="bg-teal-50 p-4 rounded-lg border border-teal-100 text-sm text-slate-700 space-y-2 w-full">
                <div className="font-bold text-teal-800 text-lg mb-2 border-b border-teal-200 pb-2">預約完成 🎉</div>
                <p><span className="font-semibold text-slate-500 w-20 inline-block">手機：</span>{finalData.phoneNumber}</p>
                <p><span className="font-semibold text-slate-500 w-20 inline-block">日期：</span>{finalData.date}</p>
                <p><span className="font-semibold text-slate-500 w-20 inline-block">姓名：</span>{finalData.name}</p>
                <p><span className="font-semibold text-slate-500 w-20 inline-block">生日：</span>{finalData.birthday}</p>
                <p><span className="font-semibold text-slate-500 w-20 inline-block">ID：</span>{finalData.idNumber}</p>
                <p><span className="font-semibold text-slate-500 w-20 inline-block">醫師：</span>{finalData.doctor?.name} ({finalData.doctor?.specialty})</p>
                <p><span className="font-semibold text-slate-500 w-20 inline-block">時段：</span>{finalData.timeSlot?.label}</p>
                <p><span className="font-semibold text-slate-500 w-20 inline-block">類型：</span>{type.label} <span className="text-red-500">(扣除 {type.deduction} 分鐘)</span></p>
                <div className="mt-4 text-xs text-slate-400 text-center pt-2 border-t border-teal-100">
                    感謝您使用預約系統。
                </div>
            </div>
        );
        addSystemMessage(summary);
    }, 500);
  };

  const restart = () => {
    setData(INITIAL_DATA);
    setMessages([]);
    setStep(Step.VERIFY_PHONE);
    addSystemMessage(
        <div className="space-y-2">
          <p className="font-bold text-teal-700">歡迎使用線上預約系統 👋</p>
          <p>為了確保是真人預約，請先輸入您的 <span className="font-semibold text-teal-600">手機號碼</span> 進行驗證。</p>
        </div>, 
        300
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[75%] p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                msg.sender === Sender.USER
                  ? 'bg-teal-600 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
           <div className="flex w-full justify-start">
             <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input / Interaction Area */}
      <div className="bg-white border-t border-slate-200 p-4">
        
        {/* Dynamic Contextual Input */}
        {step === Step.CONFIRM_DATE && (
            <div className="flex gap-2 mb-3">
                <button 
                    onClick={() => { addUserMessage('是'); processInput('是'); }}
                    className="flex-1 bg-teal-100 hover:bg-teal-200 text-teal-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                    是，開始預約
                </button>
                <button 
                     onClick={() => { addUserMessage('否'); processInput('否'); }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                    否，重新選擇
                </button>
            </div>
        )}

        {step === Step.SELECT_DOCTOR && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                {DOCTORS.map((doc) => (
                    <button
                        key={doc.id}
                        onClick={() => handleDoctorSelect(doc)}
                        className="flex flex-col items-center p-2 border border-slate-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all text-center group"
                    >
                        <div className="w-10 h-10 rounded-full overflow-hidden mb-1 bg-slate-200 ring-2 ring-offset-1 ring-transparent group-hover:ring-teal-400">
                             <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-slate-800 text-xs">{doc.name}</span>
                        <span className="text-[10px] text-slate-500">{doc.specialty}</span>
                    </button>
                ))}
            </div>
        )}

        {step === Step.SELECT_TIME && (
            <div className="grid grid-cols-2 gap-2 mb-3">
                {TIME_SLOTS.map((slot) => (
                     <button
                        key={slot.id}
                        onClick={() => handleTimeSelect(slot)}
                        className="flex items-center justify-center gap-2 p-3 border border-slate-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition-all"
                    >
                        <Clock className="w-4 h-4" />
                        <span className="font-medium text-sm">{slot.label}</span>
                    </button>
                ))}
            </div>
        )}

        {step === Step.SELECT_TYPE && (
            <div className="flex flex-col gap-2 mb-3">
                {VISIT_TYPES.map((type) => (
                     <button
                        key={type.id}
                        onClick={() => handleTypeSelect(type)}
                        className="flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-teal-100 p-2 rounded-full text-teal-600 group-hover:bg-teal-200">
                                <Activity className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-700">{type.label}</span>
                        </div>
                        <span className="text-xs font-medium text-rose-500 bg-rose-50 px-2 py-1 rounded-full">
                            扣 {type.deduction} 分鐘
                        </span>
                    </button>
                ))}
            </div>
        )}

        {step === Step.COMPLETED && (
             <button 
                onClick={restart}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg mb-2"
            >
                <RefreshCcw className="w-4 h-4" />
                預約新的門診
            </button>
        )}

        {/* Standard Text Input - Shown only when text input is appropriate */}
        {(step === Step.VERIFY_PHONE || step === Step.SELECT_DATE || step === Step.INPUT_NAME || step === Step.INPUT_BIRTHDAY || step === Step.INPUT_ID) && (
            <form onSubmit={handleTextSubmit} className="relative flex items-center gap-2">
                <div className="relative flex-1">
                    <input
                        type={step === Step.VERIFY_PHONE ? "tel" : "text"} 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={
                            step === Step.VERIFY_PHONE ? "輸入手機號碼 (09xxxxxxxx)" :
                            step === Step.SELECT_DATE ? "YYYY/MM/DD (例如 2023/10/25)" :
                            step === Step.INPUT_BIRTHDAY ? "YYYY/MM/DD (例如 1990/01/01)" :
                            "請輸入..."
                        }
                        className="w-full bg-slate-100 border border-transparent focus:bg-white focus:border-teal-500 text-slate-800 rounded-xl pl-10 pr-4 py-3 outline-none transition-all shadow-inner"
                        autoFocus
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {step === Step.VERIFY_PHONE ? <Smartphone className="w-4 h-4" /> :
                         step === Step.SELECT_DATE || step === Step.INPUT_BIRTHDAY ? <Calendar className="w-4 h-4" /> :
                         step === Step.INPUT_ID ? <CreditCard className="w-4 h-4" /> :
                         <User className="w-4 h-4" />}
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all shadow-lg flex-shrink-0"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        )}
      </div>
    </div>
  );
};
