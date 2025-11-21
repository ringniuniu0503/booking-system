import React from 'react';
import { AppointmentForm } from './components/AppointmentForm';
import { Stethoscope } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-100 flex flex-col items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-[800px] border border-slate-100">
        {/* Header */}
        <div className="bg-teal-600 p-4 md:p-6 flex items-center gap-3 shadow-md z-10 shrink-0">
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">醫療預約系統</h1>
            <p className="text-teal-100 text-xs md:text-sm">線上智慧掛號</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative overflow-hidden">
          <AppointmentForm />
        </div>
      </div>
      
      <footer className="mt-6 text-slate-400 text-xs text-center">
        &copy; {new Date().getFullYear()} MediBook Appointment System. All rights reserved.
      </footer>
    </div>
  );
};

export default App;