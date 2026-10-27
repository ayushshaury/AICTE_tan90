import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, Mail, AlertCircle, ArrowRight, UserCheck, ShieldAlert, Landmark } from 'lucide-react';
import { EmblemOfIndia } from '../components/EmblemOfIndia';
import { AicteEmblem } from '../components/AicteEmblem';
import { GovFooter } from '../components/GovFooter';
import { GovUtilityBar } from '../components/GovUtilityBar';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { isHindi } = useLanguage();

  const [email, setEmail] = useState('officer1@aicte.demo.gov.in');
  const [password, setPassword] = useState('demo12345');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || (isHindi ? 'अमान्य आधिकारिक क्रेडेंशियल्स।' : 'Invalid official credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo12345');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col justify-between font-sans text-slate-900 antialiased">
      {/* 1. Official Government Utility & Accessibility Bar */}
      <GovUtilityBar />

      {/* 2. Official Institutional Header */}
      <div className="bg-white text-slate-800 py-4 px-4 sm:px-8 border-b-[3px] border-[#FF9933] shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4 text-center sm:text-left">
            <div className="shrink-0 flex items-center justify-center">
              <AicteEmblem size={48} />
            </div>
            <div className="hidden sm:block h-10 w-px bg-slate-200 shrink-0" />
            <div className="shrink-0 flex items-center justify-center">
              <EmblemOfIndia size={46} className="h-12 w-auto" />
            </div>
            <div>
              {isHindi ? (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm sm:text-base font-bold tracking-tight text-[#002147]">
                      अखिल भारतीय तकनीकी शिक्षा परिषद (AICTE 90*)
                    </div>
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#002147] text-amber-300 tracking-wider border border-amber-400/40 shrink-0">
                      AICTE 90*
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-[#B45309] uppercase tracking-wide">
                    ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm sm:text-base font-bold tracking-tight text-[#002147] uppercase">
                      ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                    </div>
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#002147] text-amber-300 tracking-wider border border-amber-400/40 shrink-0">
                      AICTE 90*
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-slate-600 tracking-tight">
                    Statutory Body under Ministry of Education, Government of India
                  </div>
                </>
              )}
              <div className="text-[10px] text-slate-500 pt-0.5">
                {isHindi ? 'शिक्षा मंत्रालय, भारत सरकार के अधीन सांविधिक निकाय' : 'Statutory Body under Ministry of Education, Government of India'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Login Container */}
      <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-xl">
          {/* Official Security Warning Notice */}
          <div className="mb-6 p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start space-x-3 shadow-xs">
            <ShieldAlert className="w-5 h-5 text-[#E65100] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>{isHindi ? 'भारत सरकार कंप्यूटर सुरक्षा वैधानिक चेतावनी:' : 'Government of India Computer Security Warning:'}</strong>{' '}
              {isHindi
                ? 'यह पोर्टल अधिकृत संवीक्षा अधिकारियों, समिति सदस्यों एवं अनुमोदित संस्थानों हेतु आरक्षित है। सभी क्रियाकलाप सूचना प्रौद्योगिकी अधिनियम (IT Act 2000) के तहत क्रिप्टोग्राफ़िक रूप से दर्ज किए जाते हैं।'
                : 'This portal is restricted to authorized Scrutiny Officers, Committee Members, and Approved Institutions. All access and activity is cryptographically recorded under the Information Technology Act, 2000.'}
            </div>
          </div>

          <div className="bg-white py-8 px-6 shadow-xl rounded-xl sm:px-10 border border-slate-200">
            <div className="border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center space-x-2">
                <Landmark className="w-5 h-5 text-[#002147]" />
                <h2 className="text-lg font-bold text-[#002147] tracking-tight">
                  {isHindi ? 'AICTE 90* अधिकृत एकल साइन-ऑन (SSO) पोर्टल' : 'AICTE 90* Official Single Sign-On (SSO) Portal'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isHindi
                  ? 'अपनी संवीक्षा कार्यशाला तक पहुँचने के लिए अपना पंजीकृत आधिकारिक ईमेल एवं क्रेडेंशियल्स दर्ज करें।'
                  : 'Enter your registered official email and credentials to access your scrutiny workspace.'}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-3 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Official Government / Institutional Email
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. officer1@aicte.demo.gov.in"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002147] focus:border-[#002147] font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Password / Passcode
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">Default: demo12345</span>
                </div>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002147] focus:border-[#002147]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold uppercase tracking-wider text-white bg-[#002147] hover:bg-[#081526] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Authenticating Official Session...' : 'Authenticate & Sign In to Portal'}
                  <ArrowRight className="w-4 h-4 ml-2 text-amber-400" />
                </button>
              </div>
            </form>

            {/* Quick Demo Persona Selector for Evaluators */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <UserCheck className="w-4 h-4 text-[#E65100]" />
                  <span>Authorized Evaluation Roles (1-Click Login)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Password: demo12345</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('officer1@aicte.demo.gov.in')}
                  className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#002147] hover:bg-slate-50 transition-all bg-slate-50/50"
                >
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Smt. Priya Nair</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-mono font-semibold">GAZETTED</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">Scrutiny Officer (Engineering & Tech)</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('applicant.apex@demo.edu.in')}
                  className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#002147] hover:bg-slate-50 transition-all bg-slate-50/50"
                >
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Dr. Arvind Patel</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-mono font-semibold">INSTITUTE</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">Applicant (Apex Inst. of Tech)</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('senior@aicte.demo.gov.in')}
                  className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#002147] hover:bg-slate-50 transition-all bg-slate-50/50"
                >
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Prof. K. Ramaswamy</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-mono font-semibold">REGIONAL</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">Regional Director / Senior Reviewer</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@aicte.demo.gov.in')}
                  className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#002147] hover:bg-slate-50 transition-all bg-slate-50/50"
                >
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Dr. Rajesh Sharma</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono font-semibold">ADMIN</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">Chief Portal Administrator</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Official Footer */}
      <GovFooter />
    </div>
  );
};
