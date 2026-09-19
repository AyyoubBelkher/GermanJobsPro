export interface NavDictionary {
  home: string;
  jobs: string;
  blog: string;
  germanA1: string;
  atsCheck: string;
  dossier: string;
  dashboard: string;
  pricingAndPro: string;
  newCv: string;
  signIn: string;
  signOut: string;
  createCv: string;
  createCvFree: string;
  mainDashboard: string;
  myResumes: string;
  completeDossier: string;
  upgradePro: string;
  languages: {
    ar: string;
    en: string;
    fr: string;
    de: string;
  };
}

export interface CommonDictionary {
  loading: string;
  saving: string;
  error: string;
  success: string;
  cancel: string;
  confirm: string;
  back: string;
  next: string;
  previous: string;
  search: string;
  copy: string;
  copied: string;
  all: string;
  close: string;
}

export interface AuthDictionary {
  signIn: string;
  signUp: string;
  signOut: string;
  email: string;
  password: string;
  forgotPassword: string;
  resetPassword: string;
  welcomeBack: string;
  noAccount: string;
  haveAccount: string;
}

export interface JobsDictionary {
  marketBadge: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  allLanguages: string;
  categories: {
    all: string;
    it: string;
    healthcare: string;
    ausbildung: string;
    engineering: string;
    general: string;
  };
  foundJobs: string;
  updating: string;
  pageOf: string;
  noJobsFound: string;
  noJobsDesc: string;
  resetFilters: string;
  viewDetailsAndApply: string;
  generateAnschreiben: string;
  auditAts: string;
  previous: string;
  next: string;
  dateToday: string;
  dateYesterday: string;
  dateDaysAgo: string;
  details: {
    applyTitle: string;
    applySubtitle: string;
    companyEmail: string;
    directApplyBadge: string;
    sendDirectEmail: string;
    openMailApp: string;
    gmailNotice: string;
    mailAppNotice: string;
    showTemplate: string;
    copyTemplate: string;
    openGmail: string;
    copiedSuccess: string;
    emailDraftToast: string;
    directEmailApply: string;
    quickAiApplyBanner: string;
    quickAiApplyDesc: string;
    draftCoverLetter: string;
    jobDescription: string;
    noDescription: string;
    requirements: string;
    successTipsTitle: string;
    tip1: string;
    tip2: string;
    tip3: string;
    aiToolsTitle: string;
    aiCoverLetterTitle: string;
    aiCoverLetterDesc: string;
    aiAtsTitle: string;
    aiAtsDesc: string;
    overviewTitle: string;
    company: string;
    city: string;
    jobType: string;
    languageLevel: string;
    salary: string;
    shareJob: string;
    linkCopied: string;
    subject: string;
    bodyText: string;
    templateModalTitle: string;
    fullTime: string;
    germany: string;
  };
}

export interface DashboardDictionary {
  title: string;
  overview: string;
  myResumes: string;
  coverLetters: string;
  atsAnalyzer: string;
  dossierStudio: string;
  pricing: string;
  credits: string;
  proMember: string;
  upgrade: string;
}

export interface FooterDictionary {
  brandDescription: string;
  quickLinks: string;
  home: string;
  jobsInGermany: string;
  careerBlog: string;
  din5008Builder: string;
  subscriptionsAndSupport: string;
  pricingAndPro: string;
  contactAndHelp: string;
  complianceAndLegal: string;
  termsOfService: string;
  privacyPolicy: string;
  refundPolicy: string;
  allRightsReserved: string;
  terms: string;
  privacy: string;
  refunds: string;
  tagline: string;
}

export interface Dictionary {
  nav: NavDictionary;
  common: CommonDictionary;
  auth: AuthDictionary;
  jobs: JobsDictionary;
  dashboard: DashboardDictionary;
  footer: FooterDictionary;
}
