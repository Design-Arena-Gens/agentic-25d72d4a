export type AgentInput = {
  language?: 'en' | 'af';
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
};

export type AgentOutput = {
  reply: string;
  language: 'en' | 'af';
  action?:
    | 'general_info'
    | 'list_services'
    | 'estimate_flow'
    | 'booking_flow'
    | 'status_lookup'
    | 'tips'
    | 'insurance_info';
  fieldsRequested?: string[];
  suggestions?: string[];
};

function detectLanguage(text: string, fallback: 'en' | 'af' = 'en'): 'en' | 'af' {
  const afHints = /(asseblief|dankie|bespreking|kar|motor|wer(k|kstatus)|hoe lank|watter|vers(ekering|ekerings)|skatting|verf|roes|spuit|paneel|klop|regmaak)/i;
  return afHints.test(text) ? 'af' : fallback;
}

function normalize(s: string) {
  return s.toLowerCase();
}

function replyText(en: string, af: string, lang: 'en' | 'af') {
  return lang === 'af' ? af : en;
}

const servicesList = {
  en: [
    'Collision repair and panel beating',
    'Professional spray painting and colour matching',
    'Dent removal (PDR where suitable)',
    'Chassis measuring and straightening',
    'Rust treatment and prevention',
    'Full and partial resprays',
    'Polishing and paint correction',
    'Insurance claims assistance',
  ],
  af: [
    'Botsingsherstel en paneelklopwerk',
    'Professionele spuitverf en kleurpassing',
    'Drukduik verwydering (PDR waar toepaslik)',
    'Chassis meting en reguitmaak',
    'Roesteremedi?ring en -voorkoming',
    'Volledige en gedeeltelike oorspuite',
    'Polering en verfkorreksie',
    'Versekeringseis ondersteuning',
  ],
};

const tipsList = {
  en: [
    'Avoid automated car washes for 2 weeks after a respray; hand wash only.',
    'Use pH-neutral shampoo and microfiber mitts to protect the finish.',
    'Apply a quality paint sealant after 30 days for added protection.',
    'Address chips and scratches promptly to prevent rust.',
  ],
  af: [
    'Vermy outo-wasplekke vir 2 weke n? ?n oorspuit; handwas net.',
    'Gebruik pH-neutrale sjampoe en mikrofiber-handskoene vir beskerming.',
    'Dien ?n kwaliteit verfse?lmiddel na 30 dae toe vir ekstra beskerming.',
    'Hanteer skyfies en krapmerke vinnig om roes te voorkom.',
  ],
};

function listToBullets(items: string[]) {
  return items.map((s) => `? ${s}`).join('\n');
}

export function runAgent(input: AgentInput): AgentOutput {
  const lastUser = [...input.messages].reverse().find((m) => m.role === 'user');
  const userText = normalize(lastUser?.content ?? '');
  const language = detectLanguage(userText, input.language ?? 'en');

  // Intent heuristics
  const isGreeting = /(hello|hi|morning|afternoon|howzit|hey|goeie dag|hallo)/i.test(userText);
  const isServices = /(services?|do you offer|what do you do|dienste|watter)/i.test(userText);
  const isEstimate = /(estimate|quote|price|cost|skat(ting)?|kwotasie)/i.test(userText);
  const isBooking = /(book|booking|schedule|bespre(k|king)|maak.*bespreking)/i.test(userText);
  const isStatus = /(status|progress|update|ref(erence)?|job|werkstatus|vordering)/i.test(userText);
  const isTips = /(tips?|care|maintenance|protect|se?l|versorg|wenke)/i.test(userText);
  const isInsurance = /(insurance|claim|assessor|verzeker|versekering|eis)/i.test(userText);
  const isTurnaround = /(how long|turnaround|timeline|hoe lank|tydlyn)/i.test(userText);
  const mentionsPhotos = /(photo|image|picture|foto|prent)/i.test(userText);

  if (isGreeting && !isServices && !isEstimate && !isBooking && !isStatus) {
    return {
      language,
      reply: replyText(
        "Welcome! We?re a trusted, family-run panelbeating and spray-painting centre. How can I help today?",
        "Welkom! Ons is ?n betroubare, familie-onderneming vir paneelklop en spuitverf. Hoe kan ek help vandag?",
        language
      ),
      action: 'general_info',
      suggestions:
        language === 'en'
          ? ['Get an estimate', 'List services', 'Book my car in']
          : ['Kry ?n skatting', 'Lys dienste', 'Maak ?n bespreking'],
    };
  }

  if (isServices) {
    return {
      language,
      reply: replyText(
        `We offer:\n${listToBullets(servicesList.en)}\n\nWould you like help with an estimate or booking?`,
        `Ons bied aan:\n${listToBullets(servicesList.af)}\n\nWil jy help h? met ?n skatting of bespreking?`,
        language
      ),
      action: 'list_services',
      suggestions:
        language === 'en'
          ? ['Get an estimate', 'Book my car in', 'Insurance claims help']
          : ['Kry ?n skatting', 'Maak ?n bespreking', 'Hulp met versekeringseis'],
    };
  }

  if (isEstimate || (mentionsPhotos && /(damage|dent|scratch|roes|duik)/i.test(userText))) {
    return {
      language,
      reply: replyText(
        'Happy to help with an estimate. Please share: car make/model, year, damage type/location, and photos if possible.',
        'Graag help ek met ?n skatting. Deel asseblief: kar maak/model, jaar, tipe/ligging van skade, en foto?s indien moontlik.',
        language
      ),
      action: 'estimate_flow',
      fieldsRequested: ['vehicleMakeModel', 'vehicleYear', 'damageType', 'damageLocation', 'photos'],
      suggestions:
        language === 'en'
          ? ['Book an inspection', 'Insurance claims help']
          : ['Boek ?n inspeksie', 'Hulp met versekeringseis'],
    };
  }

  if (isBooking) {
    return {
      language,
      reply: replyText(
        'Let?s book your car in. I?ll need: name, contact number, preferred date, car make/model, and a brief description of the issue.',
        'Kom ons maak ?n bespreking. Ek het nodig: naam, kontaknommer, voorkeurdatum, kar maak/model, en ?n kort beskrywing van die probleem.',
        language
      ),
      action: 'booking_flow',
      fieldsRequested: ['fullName', 'phone', 'preferredDate', 'vehicleMakeModel', 'notes'],
      suggestions:
        language === 'en' ? ['Share my details'] : ['Deel my besonderhede'],
    };
  }

  if (isStatus) {
    return {
      language,
      reply: replyText(
        'Please share your job reference number (e.g., DJ-12345) and the vehicle registration to check the status.',
        'Deel asseblief jou werkverwysingsnommer (bv. DJ-12345) en die registrasienommer om die status na te gaan.',
        language
      ),
      action: 'status_lookup',
      fieldsRequested: ['jobRef', 'vehicleReg'],
      suggestions: language === 'en' ? ['My reference is DJ-12345'] : ['My verwysing is DJ-12345'],
    };
  }

  if (isInsurance) {
    return {
      language,
      reply: replyText(
        'We work with major insurers and can assist with assessments and paperwork. I can help you prepare photos and details for a smooth claim.',
        'Ons werk met groot versekeraars en help met assesserings en papierwerk. Ek kan help om foto?s en besonderhede voor te berei vir ?n gladde eis.',
        language
      ),
      action: 'insurance_info',
      suggestions: language === 'en' ? ['Get an estimate'] : ['Kry ?n skatting'],
    };
  }

  if (isTurnaround) {
    return {
      language,
      reply: replyText(
        'Typical turnaround: small dents 1?2 days, moderate repairs 3?5 days, major collision work 1?2 weeks. Paint curing can add time.',
        'Gewone omkeertyd: klein duike 1?2 dae, matige herstelwerk 3?5 dae, groot botsingswerk 1?2 weke. Verfgenesing kan tyd byvoeg.',
        language
      ),
      action: 'general_info',
      suggestions: language === 'en' ? ['Book my car in'] : ['Maak ?n bespreking'],
    };
  }

  if (isTips) {
    return {
      language,
      reply: replyText(
        `After-care tips:\n${listToBullets(tipsList.en)}`,
        `N?-sorg wenke:\n${listToBullets(tipsList.af)}`,
        language
      ),
      action: 'tips',
      suggestions: language === 'en' ? ['List services'] : ['Lys dienste'],
    };
  }

  // Default helpful answer
  return {
    language,
    reply: replyText(
      "I can help with estimates, bookings, job updates, insurance assistance, and paint care tips. What would you like to do?",
      "Ek kan help met skattings, besprekings, werkopdaterings, versekeringhulp en verfsorg wenke. Waarmee kan ek help?",
      language
    ),
    action: 'general_info',
    suggestions: language === 'en' ? ['Get an estimate', 'Book my car in'] : ['Kry ?n skatting', 'Maak ?n bespreking'],
  };
}
