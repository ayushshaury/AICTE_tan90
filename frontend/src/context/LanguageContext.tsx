import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const translations: Translations = {
  // Sovereignty & Identity
  govt_of_india: {
    en: 'Government of India',
    hi: 'भारत सरकार (Govt. of India)',
  },
  ministry_of_edu: {
    en: 'Ministry of Education',
    hi: 'शिक्षा मंत्रालय (Ministry of Education)',
  },
  council_name: {
    en: 'ALL INDIA COUNCIL FOR TECHNICAL EDUCATION',
    hi: 'अखिल भारतीय तकनीकी शिक्षा परिषद (AICTE)',
  },
  council_name_short: {
    en: 'AICTE',
    hi: 'एआईसीटीई (AICTE)',
  },
  sub_brand: {
    en: 'Approval Process Handbook (APH) 2026-27 Regulatory Portal',
    hi: 'अनुमोदन प्रक्रिया हैंडबुक (APH) 2026-27 विनियामक पोर्टल',
  },
  satyameva_jayate: {
    en: 'TRUTH ALONE TRIUMPHS',
    hi: 'सत्यमेव जयते',
  },
  aicte_motto: {
    en: 'EXCELLENCE IN ACTION IS YOGA',
    hi: 'योगः कर्मसु कौशलम्',
  },
  toll_free: {
    en: 'Toll-Free National Helpline: 1800-111-363',
    hi: 'टोल-फ्री राष्ट्रीय हेल्पलाइन: 1800-111-363',
  },

  // Accessibility & Utilities
  skip_to_content: {
    en: 'Skip to Main Content',
    hi: 'मुख्य सामग्री पर जाएं (Skip to Content)',
  },
  screen_reader: {
    en: 'Screen Reader',
    hi: 'स्क्रीन रीडर (Screen Reader)',
  },
  high_contrast: {
    en: 'Contrast',
    hi: 'कंट्रास्ट (Contrast)',
  },
  high_contrast_on: {
    en: 'Contrast On',
    hi: 'उच्च कंट्रास्ट चालू',
  },

  // Navigation & Desks
  desk_navigation: {
    en: 'OFFICIAL DESK NAVIGATION',
    hi: 'आधिकारिक पोर्टल डेस्क (Official Desk)',
  },
  sec_registry: {
    en: 'CENTRAL REGISTRY',
    hi: 'केंद्रीय रजिस्ट्री (Central Registry)',
  },
  sec_scrutiny: {
    en: 'OFFICER SCRUTINY DESK',
    hi: 'अधिकारी संवीक्षा डेस्क (Officer Scrutiny)',
  },
  sec_audit: {
    en: 'REGULATORY AUDIT DESK',
    hi: 'विनियामक ऑडिट डेस्क (Regulatory Audit)',
  },
  sec_system: {
    en: 'SYSTEM CONFIGURATION',
    hi: 'सिस्टम विन्यास (System Desk)',
  },
  nav_dashboard: {
    en: 'National Dashboard',
    hi: 'राष्ट्रीय डैशबोर्ड (Dashboard)',
  },
  nav_applications: {
    en: 'Applications Register',
    hi: 'आवेदन पंजीका (Applications)',
  },
  nav_new_application: {
    en: 'New Regulatory Filing',
    hi: 'नया आवेदन प्रपत्र (New Filing)',
  },
  nav_review_queue: {
    en: 'Officer Work Queue',
    hi: 'अधिकारी कार्य कतार (Work Queue)',
  },
  nav_verification: {
    en: 'Issuer Verification Gateway',
    hi: 'निर्गमन सत्यापन गेटवे (Verification)',
  },
  nav_rules: {
    en: 'APH Compliance Heuristics',
    hi: 'संविधिक अनुपालन नियम (APH Rules)',
  },
  nav_reports: {
    en: 'Official Gazette & Extracts',
    hi: 'राजपत्र एवं संवीक्षा प्रतिवेदन (Gazette Reports)',
  },
  nav_audit: {
    en: 'Immutable Audit Trail',
    hi: 'अपरिवर्तनीय ऑडिट ट्रेल (Audit Log)',
  },
  nav_notifications: {
    en: 'Regulatory Dispatches',
    hi: 'नियामक अधिसूचनाएँ (Dispatches)',
  },
  nav_settings: {
    en: 'System Diagnostics & AI Engine',
    hi: 'प्रणाली विन्यास एवं AI स्थिति (Settings)',
  },

  // Auth & Roles
  role_officer: {
    en: 'AICTE Scrutiny Officer (Gazetted)',
    hi: 'एआईसीटीई संवीक्षा अधिकारी (राजपत्रित Gazetted)',
  },
  role_applicant: {
    en: 'Authorized Institute Principal',
    hi: 'अधिकृत संस्थान प्रमुख (Institute Principal)',
  },
  role_director: {
    en: 'Regional Director / RO Officer',
    hi: 'क्षेत्रीय निदेशक (Regional Director)',
  },
  role_admin: {
    en: 'Central Council Administrator',
    hi: 'केंद्रीय परिषद प्रशासक (Council Admin)',
  },
  sign_in: {
    en: 'Authorized Official Sign In',
    hi: 'अधिकृत अधिकारी प्रवेश (Sign In)',
  },
  sign_out: {
    en: 'Sign Out',
    hi: 'लॉग आउट (Sign Out)',
  },
  it_act_warning_title: {
    en: 'OFFICIAL GOVERNMENT OF INDIA SYSTEM — STATUTORY WARNING',
    hi: 'भारत सरकार आधिकारिक प्रणाली — वैधानिक चेतावनी (Statutory Warning)',
  },
  it_act_warning_body: {
    en: 'This portal is restricted to authorized regulatory scrutiny under the Information Technology Act 2000 (Sections 43, 66 & 72). Unauthorized access is strictly prohibited and subject to criminal prosecution.',
    hi: 'यह पोर्टल सूचना प्रौद्योगिकी अधिनियम 2000 (धारा 43, 66 एवं 72) के तहत अधिकृत विनियामक संवीक्षा हेतु आरक्षित है। अनधिकृत प्रवेश सख्त वर्जित है तथा कानूनी अभियोजन का आधार होगा।',
  },

  // Engine status
  ai_engine_active: {
    en: 'Scrutiny Engine Active',
    hi: 'संवीक्षा इंजन सक्रिय (AI Active)',
  },
  ai_engine_sub: {
    en: 'Automated Regulatory Engine',
    hi: 'स्वचालित विनियामक संवीक्षा सेवा',
  },
  ai_engine_offline: {
    en: 'Standard Mode Active',
    hi: 'मानक प्रणाली सक्रिय',
  },

  // Dashboard Page
  dash_notification_tag: {
    en: 'AICTE SCRUTINY NOTIFICATION — SESSION 2026-27',
    hi: 'राष्ट्रीय संवीक्षा सूचना | AICTE Scrutiny Notification (2026-27)',
  },
  dash_notification_title: {
    en: 'Mandatory Institutional Verification & AI-Assisted Document Scrutiny Active',
    hi: 'अनिवार्य संस्थागत सत्यापन एवं AI-सहायता प्राप्त दस्तावेज़ संवीक्षा सक्रिय',
  },
  dash_notification_desc: {
    en: 'All technical institutions seeking Extension of Approval (EoA) or Course Variations must submit verifiable Land, FDR, Fire Safety, and Affiliation documents pursuant to APH 2026-27 statutory directives.',
    hi: 'Extension of Approval (EoA) अथवा पाठ्यक्रम विस्तार चाहने वाले सभी तकनीकी संस्थानों को APH 2026-27 नियमों के तहत Land, FDR, Fire Safety एवं Affiliation दस्तावेज़ जमा करना अनिवार्य है।',
  },
  dash_total_apps: {
    en: 'Total Dockets in Registry',
    hi: 'पंजीका में कुल मिसिलें (Total Dockets)',
  },
  dash_pending_review: {
    en: 'Pending Officer Review',
    hi: 'अधिकारी समीक्षा हेतु लंबित (Pending Review)',
  },
  dash_verified_docs: {
    en: 'Verified Supporting Documents',
    hi: 'सत्यापित संलग्न दस्तावेज़ (Verified Documents)',
  },
  dash_critical_findings: {
    en: 'Critical Anomalies Detected',
    hi: 'गंभीर विसंगतियाँ पहचानी गईं (Critical Anomalies)',
  },
  dash_attention_queue: {
    en: 'Immediate Regulatory Attention Queue',
    hi: 'अतिशीघ्र विनियामक ध्यान कतार (Attention Queue)',
  },
  dash_attention_sub: {
    en: 'Applications flagged with critical discrepancies requiring immediate officer intervention',
    hi: 'गंभीर विसंगतियों वाले आवेदन जिन्हें तुरंत अधिकारी स्तर पर समीक्षा की आवश्यकता है',
  },

  // Applications Page
  app_registry_tag: {
    en: 'CENTRAL SCRUTINY REGISTRY',
    hi: 'संस्थागत आवेदन पंजीका (Central Scrutiny Registry)',
  },
  app_registry_title: {
    en: 'Institutional Approval Applications Master Register',
    hi: 'संस्थागत अनुमोदन आवेदन मास्टर पंजीका',
  },
  app_registry_desc: {
    en: 'National repository of institutional dockets undergoing automated AI compliance screening and gazetted officer review under APH 2026-27 norms.',
    hi: 'APH 2026-27 नियमों के तहत स्वचालित AI स्क्रीनिंग तथा राजपत्रित अधिकारी समीक्षा के अधीन राष्ट्रीय आवेदन संग्रह।',
  },
  export_gazette_csv: {
    en: 'Export Gazette (CSV)',
    hi: 'राजपत्र एक्सपोर्ट (CSV Gazette)',
  },
  create_new_application: {
    en: 'New Regulatory Filing',
    hi: 'नया आवेदन दर्ज करें (New Filing)',
  },

  // Application Detail Dossier
  dossier_tag: {
    en: 'INSTITUTIONAL COMPLIANCE DOSSIER',
    hi: 'संस्थागत संवीक्षा मिसिल (Institutional Dossier)',
  },
  tab_overview: {
    en: '1. Overview & Particulars',
    hi: '1. विवरण एवं संस्थान विवरण (Overview)',
  },
  tab_documents: {
    en: '2. Supporting Documents',
    hi: '2. संलग्न दस्तावेज़ (Documents)',
  },
  tab_extracted: {
    en: '3. Extracted Institutional Fields',
    hi: '3. निष्कर्षित डेटा फ़ील्ड्स (Extracted Fields)',
  },
  tab_findings: {
    en: '4. AI Scrutiny Findings',
    hi: '4. AI संवीक्षा निष्कर्ष (AI Findings)',
  },
  tab_order: {
    en: '5. Regulatory Decision Order',
    hi: '5. विनियामक निर्णय आदेश (Decision Order)',
  },
  run_ai_analysis_btn: {
    en: 'Execute Python AI Document Scrutiny',
    hi: 'Python AI दस्तावेज़ संवीक्षा चलाएं (Run AI Scrutiny)',
  },
  evaluate_rules_btn: {
    en: 'Evaluate APH 2026-27 Heuristics',
    hi: 'APH 2026-27 नियम मूल्यांकन करें (Evaluate Rules)',
  },
  order_memo_tag: {
    en: 'REGULATORY DECISION NOTICE',
    hi: 'संवीक्षा समिति विनियामक आदेश (Decision Notice)',
  },

  // New Application Page
  new_app_tag: {
    en: 'Approval Process Handbook 2026-27',
    hi: 'अनुमोदन प्रक्रिया हैंडबुक 2026-27 (APH 2026-27)',
  },
  new_app_title: {
    en: 'New Institutional Regulatory Filing & Scrutiny Docket',
    hi: 'नया संस्थागत विनियामक आवेदन एवं संवीक्षा मिसिल',
  },
  new_app_desc: {
    en: 'Initiate statutory compliance docket for Extension of Approval (EoA), New Course Introduction, or Intake Variation. All submitted data is scrutinised against AICTE APH 2026-27 statutory norms.',
    hi: 'Extension of Approval (EoA), नए पाठ्यक्रम अथवा Intake विस्तार हेतु विनियामक मिसिल प्रारंभ करें। सभी डेटा की APH 2026-27 मानदंडों के तहत संवीक्षा की जाती है।',
  },
  statutory_oath_title: {
    en: 'Statutory Declaration Under Oath (Section 193 Indian Penal Code & IT Act 2000)',
    hi: 'शपथपूर्वक वैधानिक घोषणा (भारतीय दंड संहिता धारा 193 एवं IT Act 2000)',
  },
  statutory_oath_body: {
    en: 'I hereby solemnly declare and affirm that all institutional particulars, land records, faculty rosters, building safety plans, and financial guarantees submitted through this AICTE portal are authentic, complete, and verifiable. I understand that submitting false or fraudulent documentation constitutes a cognizable offense and invites immediate de-recognition, withdrawal of approval, and penal prosecution.',
    hi: 'मैं एतद्द्वारा सत्यनिष्ठा से घोषणा करता/करती हूँ कि इस AICTE पोर्टल पर प्रस्तुत सभी संस्थागत विवरण, भूमि अभिलेख, संकाय सूची, भवन सुरक्षा प्रमाण पत्र तथा वित्तीय प्रतिभूतियाँ सत्य, पूर्ण तथा सत्यापन योग्य हैं। गलत या भ्रामक दस्तावेज़ प्रस्तुत करना दंडनीय अपराध होगा एवं अनुमोदन तत्काल निरस्त किया जाएगा।',
  },
  statutory_oath_checkbox: {
    en: 'I agree to the statutory declaration and affirm under oath that all submitted information is true and accurate.',
    hi: 'मैं वैधानिक घोषणा से सहमत हूँ और शपथपूर्वक पुष्टि करता/करती हूँ कि सभी प्रस्तुत सूचनाएँ सत्य एवं सटीक हैं।',
  },

  // Notifications Page
  notif_tag: {
    en: 'Regulatory Communications',
    hi: 'नियामक संचार (Regulatory Communications)',
  },
  notif_title: {
    en: 'Statutory Notices & Scrutiny Dispatches',
    hi: 'वैधानिक सूचनाएँ एवं संवीक्षा Dispatches',
  },
  notif_desc: {
    en: 'Official electronic communications regarding automated document analysis findings, deficiency memos, hearing notices, and approval status updates under APH 2026-27.',
    hi: 'स्वचालित दस्तावेज़ विश्लेषण निष्कर्ष, कमी ज्ञापन (Deficiency Memo) एवं अनुमोदन स्थिति से संबंधित आधिकारिक इलेक्ट्रॉनिक सूचनाएँ।',
  },

  // Review Queue Page
  queue_tag: {
    en: 'GAZETTED OFFICER WORK QUEUE',
    hi: 'राजपत्रित अधिकारी संवीक्षा कार्य कतार (Work Queue)',
  },
  queue_title: {
    en: 'Pending Regulatory Action & Scrutiny Queue',
    hi: 'लंबित विनियामक कार्रवाई एवं संवीक्षा कतार',
  },
  queue_desc: {
    en: 'Prioritized queue of institutional approval dockets requiring official gazetted scrutiny, hearing scheduling, or deficiency memo issuance.',
    hi: 'राजपत्रित अधिकारी द्वारा संवीक्षा, सुनवाई निर्धारण अथवा कमी ज्ञापन जारी करने हेतु प्राथमिकताप्राप्त संस्थागत मिसिलों की सूची।',
  },

  // Verification Page
  verif_tag: {
    en: 'ISSUER VERIFICATION GATEWAY',
    hi: 'स्रोत एवं निर्गमन प्राधिकारी सत्यापन गेटवे (Verification)',
  },
  verif_title: {
    en: 'Third-Party Source & Authority Validation Gateway',
    hi: 'तृतीय-पक्ष स्रोत एवं निर्गमन प्राधिकारी सत्यापन गेटवे',
  },
  verif_desc: {
    en: 'Automated verification against authorized external regulatory authorities including Sub-Registrar Land Records, State Fire Services, Scheduled Banks, and Affiliating Universities.',
    hi: 'सब-रजिस्ट्रार भूमि अभिलेख, राज्य अग्निशमन सेवा, बैंक एवं संबद्ध विश्वविद्यालयों के विरुद्ध स्वचालित सत्यापन।',
  },

  // Rules Page
  rules_tag: {
    en: 'AICTE APH 2026-27 COMPLIANCE HEURISTICS',
    hi: 'संविधिक अनुपालन नियम विन्यास (APH 2026-27 Rules)',
  },
  rules_title: {
    en: 'Statutory Approval Process Handbook Compliance Rules',
    hi: 'वैधानिक अनुमोदन प्रक्रिया हैंडबुक अनुपालन नियम',
  },
  rules_desc: {
    en: 'Deterministic compliance algorithms validating built-up area, faculty-to-student cadre ratios, corpus fund reserves, and mandatory fire NOC validity.',
    hi: 'निर्मित क्षेत्र, संकाय-छात्र अनुपात, कॉर्पस फंड एवं अग्निशमन NOC की वैधता की पुष्टि करने वाले विनियामक एल्गोरिदम।',
  },

  // Reports Page
  reports_tag: {
    en: 'OFFICIAL GAZETTE & AUDIT EXTRACTS',
    hi: 'राजपत्र एवं संवीक्षा प्रतिवेदन (Official Gazette & Extracts)',
  },
  reports_title: {
    en: 'Central Scrutiny Reports & Gazette Dossiers',
    hi: 'केंद्रीय संवीक्षा प्रतिवेदन एवं राजपत्र मिसिलें',
  },
  reports_desc: {
    en: 'Official summary extracts, institutional compliance records, and gazette export archives formatted for parliamentary and council review.',
    hi: 'संसदीय एवं परिषद समीक्षा हेतु तैयार आधिकारिक सारांश, संस्थागत अनुपालन अभिलेख तथा राजपत्र एक्सपोर्ट।',
  },

  // Audit Page
  audit_tag: {
    en: 'IMMUTABLE CRYPTOGRAPHIC AUDIT LOG',
    hi: 'अपरिवर्तनीय संवीक्षा एवं शासन ऑडिट लॉग (Audit Trail)',
  },
  audit_title: {
    en: 'National Scrutiny Chain-of-Custody & System Event Ledger',
    hi: 'राष्ट्रीय संवीक्षा कस्टडी श्रृंखला एवं सिस्टम इवेंट लेजर',
  },
  audit_desc: {
    en: 'Tamper-evident, cryptographically sequenced event ledger tracking all document uploads, AI scrutiny jobs, officer decisions, and verification inquiries pursuant to IT Act 2000 Section 43A.',
    hi: 'IT Act 2000 धारा 43A के तहत सभी दस्तावेज़ अपलोड, AI संवीक्षा कार्य, अधिकारी निर्णयों का अपरिवर्तनीय क्रिप्टोग्राफ़िक लेजर।',
  },

  // Settings Page
  settings_tag: {
    en: 'SYSTEM DIAGNOSTICS & AI CONFIGURATION',
    hi: 'प्रणाली विन्यास एवं Python AI सेवा स्थिति (System Diagnostics)',
  },
  settings_title: {
    en: 'Platform Infrastructure, Microservice Endpoints & Security Policy',
    hi: 'प्लेटफॉर्म अवसंरचना, माइक्रोसेवा एंडपॉइंट्स एवं सुरक्षा नीति',
  },
  settings_desc: {
    en: 'Monitor live scrutiny engine connectivity, cryptographic audit integrity, and regulatory policy parameters.',
    hi: 'संवीक्षा इंजन कनेक्टिविटी, क्रिप्टोग्राफ़िक ऑडिट सत्यनिष्ठा एवं विनियामक नीति मापदंडों की निगरानी।',
  },

  // Footer
  footer_col_portals: {
    en: 'National Apex Portals',
    hi: 'राष्ट्रीय शीर्ष पोर्टल (National Portals)',
  },
  footer_col_framework: {
    en: 'Regulatory Framework',
    hi: 'विनियामक ढांचा (Regulatory Framework)',
  },
  footer_col_legal: {
    en: 'Statutory & Legal Policies',
    hi: 'वैधानिक एवं कानूनी नीतियां (Statutory Policies)',
  },
  footer_col_ops: {
    en: 'AI Scrutiny Operations',
    hi: 'AI संवीक्षा परिचालन (AI Operations)',
  },
  footer_copyright: {
    en: 'All Rights Reserved. Official Portal of All India Council for Technical Education, Ministry of Education, Government of India.',
    hi: 'सर्वाधिकार सुरक्षित। अखिल भारतीय तकनीकी शिक्षा परिषद, शिक्षा मंत्रालय, भारत सरकार का आधिकारिक पोर्टल।',
  },
  footer_disclaimer: {
    en: 'Disclaimer: AI document analysis findings, anomaly scores, and extracted fields are advisory regulatory screening aids. Final institutional approval or rejection is exclusively adjudicated by authorized AICTE Gazetted Officers pursuant to the Approval Process Handbook (APH 2026-27).',
    hi: 'अस्वीकरण (Disclaimer): AI दस्तावेज़ विश्लेषण, विसंगति स्कोर एवं निष्कर्षित डेटा केवल विनियामक स्क्रीनिंग सहायता हैं। अंतिम संस्थागत अनुमोदन अथवा अस्वीकृति केवल Approval Process Handbook (APH 2026-27) के तहत अधिकृत AICTE राजपत्रित अधिकारियों द्वारा निर्धारित की जाती है।',
  },
  footer_gigw_badge: {
    en: 'GIGW 2.0 Certified • WCAG 2.1 AA Compliant',
    hi: 'GIGW 2.0 प्रमाणित • WCAG 2.1 AA अनुरूप',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isHindi: boolean;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('aicte_lang');
    return saved === 'hi' ? 'hi' : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('aicte_lang', lang);
    document.documentElement.lang = lang;
    if (lang === 'en') {
      document.title = 'AICTE 90* — Institutional Scrutiny & Regulatory Compliance Portal';
    } else {
      document.title = 'अखिल भारतीय तकनीकी शिक्षा परिषद (AICTE 90*) — विनियामक संवीक्षा एवं अनुपालन पोर्टल';
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    if (language === 'en') {
      document.title = 'AICTE 90* — Institutional Scrutiny & Regulatory Compliance Portal';
    } else {
      document.title = 'अखिल भारतीय तकनीकी शिक्षा परिषद (AICTE 90*) — विनियामक संवीक्षा एवं अनुपालन पोर्टल';
    }
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    const item = translations[key];
    if (!item) return fallback || key;
    return language === 'hi' ? item.hi : item.en;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isHindi: language === 'hi',
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
