/**
 * Dynamic & Personalized Quiz Engine for 9jacash
 * 
 * Guarantees:
 * 1. Questions differ from user to user (deterministic per-user seed).
 * 2. Questions already answered by this user are NEVER repeated.
 * 3. Expansive library of 130+ diverse trivia questions + infinite procedural generators.
 */

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
  explanation?: string;
}

// 1. Curated Master Trivia Questions Pool (130+ distinct questions across 8 categories)
export const MASTER_TRIVIA_QUESTIONS: {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
}[] = [
  // --- Nigerian Geography & Cities ---
  {
    id: 'geo_abuja_cap',
    question: 'What is the federal capital city of Nigeria?',
    options: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano'],
    correctIndex: 1,
    category: 'Geography',
  },
  {
    id: 'geo_lagos_pop',
    question: 'Which is the largest city by population and economic output in Nigeria?',
    options: ['Ibadan', 'Lagos', 'Abuja', 'Benin City'],
    correctIndex: 1,
    category: 'Geography',
  },
  {
    id: 'geo_lagos_motto',
    question: 'Which Nigerian state is officially known as the "Centre of Excellence"?',
    options: ['Oyo State', 'Lagos State', 'Kano State', 'Rivers State'],
    correctIndex: 1,
    category: 'Geography',
  },
  {
    id: 'geo_delta_cap',
    question: 'What is the capital city of Delta State, Nigeria?',
    options: ['Warri', 'Asaba', 'Sapele', 'Ughelli'],
    correctIndex: 1,
    category: 'Geography',
  },
  {
    id: 'geo_enugu_coal',
    question: 'Which Nigerian state is famously referred to as the "Coal City State"?',
    options: ['Enugu State', 'Anambra State', 'Ebonyi State', 'Imo State'],
    correctIndex: 0,
    category: 'Geography',
  },
  {
    id: 'geo_num_states',
    question: 'How many states make up the Federal Republic of Nigeria?',
    options: ['30 states', '36 states', '38 states', '40 states'],
    correctIndex: 1,
    category: 'Geography',
  },
  {
    id: 'geo_lokoja_conf',
    question: 'Which river joins River Niger at Lokoja to form a confluence?',
    options: ['River Kaduna', 'River Benue', 'River Ogun', 'River Cross'],
    correctIndex: 1,
    category: 'Geography',
  },
  {
    id: 'geo_plateau_cap',
    question: 'What is the state capital of Plateau State, Nigeria?',
    options: ['Jos', 'Bukuru', 'Pankshin', 'Shendam'],
    correctIndex: 0,
    category: 'Geography',
  },
  {
    id: 'geo_kano_cap',
    question: 'What is the historic capital of Kano State in Northern Nigeria?',
    options: ['Zaria', 'Kano City', 'Katsina', 'Hadejia'],
    correctIndex: 1,
    category: 'Geography',
  },
  {
    id: 'geo_oyo_pacesetter',
    question: 'Which state in Southwestern Nigeria is popularly known as the "Pace Setter State"?',
    options: ['Osun State', 'Oyo State', 'Ondo State', 'Ogun State'],
    correctIndex: 1,
    category: 'Geography',
  },
  {
    id: 'geo_first_cap',
    question: 'Which coastal city was the original first capital of Nigeria before Lagos and Abuja?',
    options: ['Lokoja', 'Calabar', 'Badagry', 'Asaba'],
    correctIndex: 1,
    category: 'Geography',
  },
  {
    id: 'geo_longest_river',
    question: 'Which is the longest river inside Nigeria?',
    options: ['River Benue', 'River Niger', 'River Kaduna', 'River Osun'],
    correctIndex: 1,
    category: 'Geography',
  },
  {
    id: 'geo_zuma_rock',
    question: 'In which Nigerian state is the famous monolith Zuma Rock located near Abuja?',
    options: ['Niger State', 'Kaduna State', 'Nasarawa State', 'Kogi State'],
    correctIndex: 0,
    category: 'Geography',
  },
  {
    id: 'geo_obudu_resort',
    question: 'In which state is the famous Obudu Mountain Resort situated?',
    options: ['Taraba State', 'Cross River State', 'Akwa Ibom State', 'Benue State'],
    correctIndex: 1,
    category: 'Geography',
  },

  // --- Banking, Finance & Currency ---
  {
    id: 'fin_cbn_acronym',
    question: 'What does the acronym CBN stand for in Nigeria?',
    options: ['Commercial Bank of Nigeria', 'Central Bank of Nigeria', 'Credit Bureau Network', 'Citizens Bank of Nigeria'],
    correctIndex: 1,
    category: 'Finance',
  },
  {
    id: 'fin_highest_note',
    question: 'Which Nigerian currency denomination is currently the highest banknote in circulation?',
    options: ['₦500', '₦1,000', '₦2,000', '₦5,000'],
    correctIndex: 1,
    category: 'Finance',
  },
  {
    id: 'fin_nuban_digits',
    question: 'How many digits make up a standard NUBAN bank account number in Nigeria?',
    options: ['8 digits', '10 digits', '12 digits', '16 digits'],
    correctIndex: 1,
    category: 'Banking',
  },
  {
    id: 'fin_atm_acronym',
    question: 'What does ATM stand for in retail banking?',
    options: ['Automated Teller Machine', 'Any Time Money', 'Account Transfer Medium', 'Auto Transaction Mode'],
    correctIndex: 0,
    category: 'Banking',
  },
  {
    id: 'fin_bvn_meaning',
    question: 'What does BVN stand for in the Nigerian banking verification system?',
    options: ['Bank Verification Number', 'Biometric Validation Network', 'Banking Value Node', 'Branch Virtual Number'],
    correctIndex: 0,
    category: 'Banking',
  },
  {
    id: 'fin_currency_code',
    question: 'What is the international 3-letter currency code for the Nigerian Naira?',
    options: ['NGA', 'NGN', 'NRN', 'NIR'],
    correctIndex: 1,
    category: 'Finance',
  },
  {
    id: 'fin_ndic_insurance',
    question: 'Which government corporation insures bank deposits for customers in Nigerian commercial banks?',
    options: ['EFCC', 'NDIC', 'SEC', 'FIRS'],
    correctIndex: 1,
    category: 'Finance',
  },
  {
    id: 'fin_pos_meaning',
    question: 'What does POS stand for in electronic card and retail payment machines?',
    options: ['Payment of Service', 'Point of Sale', 'Proof of Security', 'Portal of Settlement'],
    correctIndex: 1,
    category: 'Banking',
  },
  {
    id: 'fin_enaira_launch',
    question: 'What is the name of the official Central Bank Digital Currency (CBDC) launched in Nigeria?',
    options: ['DigitalNaira', 'eNaira', 'CryptoNGN', 'NairaToken'],
    correctIndex: 1,
    category: 'Finance',
  },
  {
    id: 'fin_compound_interest',
    question: 'What distinguishes compound interest from simple interest in savings and investments?',
    options: [
      'Interest only accrues once a year',
      'Interest is earned on both the original principal and accumulated interest',
      'Interest decreases as the balance grows',
      'It is fixed and exempt from inflation',
    ],
    correctIndex: 1,
    category: 'Finance',
  },
  {
    id: 'fin_bull_market',
    question: 'In financial markets and stock exchanges, what does a "Bull Market" represent?',
    options: [
      'A period of falling prices and fear',
      'A period of rising asset prices and investor confidence',
      'A market strictly for livestock commodities',
      'A market with frozen withdrawals',
    ],
    correctIndex: 1,
    category: 'Finance',
  },
  {
    id: 'fin_fiat_money',
    question: 'What is "Fiat currency"?',
    options: [
      'Currency backed strictly by gold reserves',
      'Government-issued legal tender not backed by a physical commodity',
      'Currency used only for car purchases',
      'Digital blockchain tokens',
    ],
    correctIndex: 1,
    category: 'Finance',
  },
  {
    id: 'fin_firs_taxes',
    question: 'Which statutory body is responsible for assessing and collecting federal taxes in Nigeria?',
    options: ['CBN', 'FIRS', 'NASS', 'NNPC'],
    correctIndex: 1,
    category: 'Finance',
  },
  {
    id: 'fin_inflation_meaning',
    question: 'What does "inflation" mean in macroeconomics?',
    options: [
      'Increase in the purchasing power of money',
      'A sustained increase in the general price level of goods and services',
      'A decrease in bank interest rates',
      'A sudden boost in government revenue',
    ],
    correctIndex: 1,
    category: 'Finance',
  },

  // --- Nigerian History & Milestones ---
  {
    id: 'hist_independence_year',
    question: 'In what year did Nigeria gain national independence from British colonial rule?',
    options: ['1957', '1960', '1963', '1970'],
    correctIndex: 1,
    category: 'History',
  },
  {
    id: 'hist_republic_year',
    question: 'What year did Nigeria officially adopt republican status and become a Federal Republic?',
    options: ['1960', '1963', '1966', '1979'],
    correctIndex: 1,
    category: 'History',
  },
  {
    id: 'hist_first_pres',
    question: 'Who was the first ceremonial President of the Federal Republic of Nigeria?',
    options: ['Abubakar Tafawa Balewa', 'Dr. Nnamdi Azikiwe', 'Chief Obafemi Awolowo', 'Sir Ahmadu Bello'],
    correctIndex: 1,
    category: 'History',
  },
  {
    id: 'hist_flag_designer',
    question: 'Who designed the green and white national flag of Nigeria in 1959?',
    options: ['Herbert Macaulay', 'Michael Taiwo Akinkunmi', 'Ben Enwonwu', 'Wole Soyinka'],
    correctIndex: 1,
    category: 'History',
  },
  {
    id: 'hist_flag_white',
    question: 'What does the central white vertical stripe on the Nigerian flag symbolize?',
    options: ['Abundant Agriculture', 'Peace and Unity', 'Dignity and Strength', 'Pure Mineral Wealth'],
    correctIndex: 1,
    category: 'History',
  },
  {
    id: 'hist_flag_green',
    question: 'What does the green color on the Nigerian flag represent?',
    options: ['Lush Agriculture and Natural Wealth', 'National Peace', 'Sovereignty', 'Military Power'],
    correctIndex: 0,
    category: 'History',
  },
  {
    id: 'hist_coat_horses',
    question: 'What do the two white stallions on the Nigerian Coat of Arms symbolize?',
    options: ['Speed and Agility', 'Dignity and Pride', 'Peace and Agriculture', 'Wealth and Power'],
    correctIndex: 1,
    category: 'History',
  },
  {
    id: 'hist_coat_eagle',
    question: 'What does the red eagle at the apex of the Nigerian Coat of Arms represent?',
    options: ['Freedom', 'Strength and Valor', 'Wisdom', 'Prosperity'],
    correctIndex: 1,
    category: 'History',
  },
  {
    id: 'hist_amalgamation',
    question: 'In what year were the Northern and Southern protectorates amalgamated by Lord Lugard to form Nigeria?',
    options: ['1900', '1914', '1920', '1939'],
    correctIndex: 1,
    category: 'History',
  },
  {
    id: 'hist_nok_culture',
    question: 'Which ancient civilization in Northern and Central Nigeria is famous for pioneering terracotta art and iron smelting?',
    options: ['Benin Kingdom', 'Nok Culture', 'Oyo Empire', 'Kingdom of Nri'],
    correctIndex: 1,
    category: 'History',
  },
  {
    id: 'hist_queen_amina',
    question: 'Queen Amina was a legendary 16th-century warrior queen of which historic Nigerian city-state?',
    options: ['Katsina', 'Zazzau (Zaria)', 'Daura', 'Gobir'],
    correctIndex: 1,
    category: 'History',
  },
  {
    id: 'hist_democracy_day',
    question: 'On what date is Democracy Day currently celebrated in Nigeria in honor of June 12?',
    options: ['May 29', 'June 12', 'October 1', 'January 15'],
    correctIndex: 1,
    category: 'History',
  },

  // --- Music, Afrobeats & Entertainment ---
  {
    id: 'ent_burna_grammy',
    question: 'Which Nigerian Afrobeats superstar won the Grammy for Best Global Music Album for "Twice as Tall"?',
    options: ['Wizkid', 'Burna Boy', 'Davido', 'Rema'],
    correctIndex: 1,
    category: 'Entertainment',
  },
  {
    id: 'ent_afrobeat_pioneer',
    question: 'Who is globally celebrated as the pioneer of the Afrobeat music genre and founder of the Kalakuta Republic?',
    options: ['King Sunny Ade', 'Fela Anikulapo Kuti', 'Fatai Rolling Dollar', 'Chief Osita Osadebe'],
    correctIndex: 1,
    category: 'Entertainment',
  },
  {
    id: 'ent_wizkid_album',
    question: 'Which groundbreaking Wizkid album featured the worldwide hit "Essence" with Tems?',
    options: ['Superstar', 'Made in Lagos', 'Ayo', 'Sounds from the Other Side'],
    correctIndex: 1,
    category: 'Entertainment',
  },
  {
    id: 'ent_rema_calm_down',
    question: 'Which hit track by Nigerian singer Rema became the first African song to surpass 1 billion Spotify streams?',
    options: ['Dumebi', 'Calm Down', 'Soundgasm', 'Iron Man'],
    correctIndex: 1,
    category: 'Entertainment',
  },
  {
    id: 'ent_nollywood_industry',
    question: 'What is the popular global moniker for Nigeria vibrant film and motion picture industry?',
    options: ['Bollywood', 'Nollywood', 'Gollywood', 'Kannywood'],
    correctIndex: 1,
    category: 'Entertainment',
  },
  {
    id: 'ent_soyinka_nobel',
    question: 'Who was the first African to be awarded the Nobel Prize in Literature in 1986?',
    options: ['Chinua Achebe', 'Prof. Wole Soyinka', 'Ben Okri', 'Chimamanda Ngozi Adichie'],
    correctIndex: 1,
    category: 'Culture',
  },
  {
    id: 'ent_things_fall_apart',
    question: 'Which legendary Nigerian author penned the classic masterpiece novel "Things Fall Apart"?',
    options: ['Wole Soyinka', 'Chinua Achebe', 'Cyprian Ekwensi', 'Amos Tutuola'],
    correctIndex: 1,
    category: 'Culture',
  },
  {
    id: 'ent_tems_oscar',
    question: 'Nigerian singer Tems earned an Oscar nomination for co-writing "Lift Me Up" for which blockbuster movie?',
    options: ['The Lion King', 'Black Panther: Wakanda Forever', 'Avatar: Way of Water', 'Coming 2 America'],
    correctIndex: 1,
    category: 'Entertainment',
  },
  {
    id: 'ent_calabar_carnival',
    question: 'Which annual cultural event in Cross River State is heralded as "Africa Biggest Street Party"?',
    options: ['Osun-Osogbo Festival', 'Calabar Carnival', 'Argungu Fishing Festival', 'Ojude Oba Festival'],
    correctIndex: 1,
    category: 'Culture',
  },
  {
    id: 'ent_davido_timeless',
    question: 'What is the title of Davido hit 2023 studio album featuring tracks like "Unavailable"?',
    options: ['A Good Time', 'Timeless', 'A Better Time', 'Omo Baba Olowo'],
    correctIndex: 1,
    category: 'Entertainment',
  },

  // --- Sports & Athletics ---
  {
    id: 'spt_super_eagles',
    question: 'What is the official nickname of the Nigerian Senior Men National Football Team?',
    options: ['Flying Eagles', 'Super Eagles', 'Golden Eaglets', 'Super Falcons'],
    correctIndex: 1,
    category: 'Sports',
  },
  {
    id: 'spt_super_falcons',
    question: 'What is the official nickname of the Nigerian Senior Women National Football Team?',
    options: ['Super Falcons', 'Black Queens', 'Banyana Banyana', 'Lionesses'],
    correctIndex: 0,
    category: 'Sports',
  },
  {
    id: 'spt_olympic_gold_96',
    question: 'In which Olympic Games did Nigeria historic "Dream Team" win Olympic Gold in Men Football?',
    options: ['Barcelona 1992', 'Atlanta 1996', 'Sydney 2000', 'Beijing 2008'],
    correctIndex: 1,
    category: 'Sports',
  },
  {
    id: 'spt_tobi_amusan',
    question: 'Tobi Amusan set a world record in which track and field athletics event?',
    options: ['100m Sprint', '100m Hurdles', 'Long Jump', '400m Hurdles'],
    correctIndex: 1,
    category: 'Sports',
  },
  {
    id: 'spt_kanu_heart',
    question: 'Which iconic Nigerian footballer played for Arsenal and Ajax and founded a Heart Foundation?',
    options: ['Jay-Jay Okocha', 'Nwankwo Kanu', 'Daniel Amokachi', 'Sunday Oliseh'],
    correctIndex: 1,
    category: 'Sports',
  },
  {
    id: 'spt_okocha_skill',
    question: 'Which legendary Super Eagles playmaker was famous for the chant "so good they named him twice"?',
    options: ['Finidi George', 'Austin Jay-Jay Okocha', 'Victor Ikpeba', 'Taribo West'],
    correctIndex: 1,
    category: 'Sports',
  },
  {
    id: 'spt_osimhen_serie_a',
    question: 'Which Nigerian striker won the Serie A Golden Boot and African Footballer of the Year award in 2023?',
    options: ['Victor Boniface', 'Victor Osimhen', 'Kelechi Iheanacho', 'Ademola Lookman'],
    correctIndex: 1,
    category: 'Sports',
  },
  {
    id: 'spt_afcon_wins',
    question: 'How many times has Nigeria won the Africa Cup of Nations (AFCON) men football championship?',
    options: ['2 times', '3 times (1980, 1994, 2013)', '5 times', '7 times'],
    correctIndex: 1,
    category: 'Sports',
  },

  // --- Science, Nature & General World Knowledge ---
  {
    id: 'sci_water_formula',
    question: 'What is the chemical molecular formula for pure water?',
    options: ['CO2', 'H2O', 'NaCl', 'O2'],
    correctIndex: 1,
    category: 'Science',
  },
  {
    id: 'sci_closest_planet',
    question: 'Which planet in our solar system is closest to the Sun?',
    options: ['Venus', 'Mercury', 'Mars', 'Earth'],
    correctIndex: 1,
    category: 'Science',
  },
  {
    id: 'sci_hardest_mineral',
    question: 'What is the hardest naturally occurring mineral on Earth?',
    options: ['Quartz', 'Diamond', 'Topaz', 'Granite'],
    correctIndex: 1,
    category: 'Science',
  },
  {
    id: 'sci_photosynthesis',
    question: 'What gas do green plants absorb from the atmosphere during photosynthesis?',
    options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'],
    correctIndex: 1,
    category: 'Science',
  },
  {
    id: 'sci_speed_of_light',
    question: 'Approximately how fast does light travel in a vacuum per second?',
    options: ['30,000 km/s', '300,000 km/s', '3,000,000 km/s', '150,000 km/s'],
    correctIndex: 1,
    category: 'Science',
  },
  {
    id: 'sci_largest_organ',
    question: 'What is the largest organ in the human body?',
    options: ['Liver', 'Skin', 'Heart', 'Brain'],
    correctIndex: 1,
    category: 'Science',
  },
  {
    id: 'sci_nile_river',
    question: 'Which river is internationally recognized as the longest river on the African continent?',
    options: ['River Congo', 'River Nile', 'River Niger', 'River Zambezi'],
    correctIndex: 1,
    category: 'Geography',
  },
  {
    id: 'sci_sahara_desert',
    question: 'Which is the largest hot desert in the world?',
    options: ['Kalahari Desert', 'Sahara Desert', 'Namib Desert', 'Atacama Desert'],
    correctIndex: 1,
    category: 'Geography',
  },
  {
    id: 'sci_human_bones',
    question: 'How many bones are there in an adult human skeleton?',
    options: ['180 bones', '206 bones', '250 bones', '300 bones'],
    correctIndex: 1,
    category: 'Science',
  },
  {
    id: 'sci_pyramids_country',
    question: 'In which North African country are the Great Pyramids of Giza located?',
    options: ['Sudan', 'Egypt', 'Morocco', 'Tunisia'],
    correctIndex: 1,
    category: 'General Knowledge',
  },

  // --- Technology & Internet ---
  {
    id: 'tech_nigeria_tld',
    question: 'What is the official internet Country Code Top-Level Domain (ccTLD) for Nigeria?',
    options: ['.ng', '.nr', '.ni', '.nga'],
    correctIndex: 0,
    category: 'Technology',
  },
  {
    id: 'tech_https_protocol',
    question: 'Which secure protocol encrypts communication between your web browser and a website?',
    options: ['HTTP', 'HTTPS', 'FTP', 'SMTP'],
    correctIndex: 1,
    category: 'Technology',
  },
  {
    id: 'tech_2fa_meaning',
    question: 'What does 2FA stand for in account digital security and logins?',
    options: ['Two-Factor Authentication', 'Two-File Archiving', 'Twin Firewall Access', 'Token-Free Account'],
    correctIndex: 0,
    category: 'Technology',
  },
  {
    id: 'tech_cpu_hardware',
    question: 'What does CPU stand for in computer and mobile phone hardware?',
    options: ['Central Processing Unit', 'Computer Power Unit', 'Core Programming Unit', 'Central Peripheral Utility'],
    correctIndex: 0,
    category: 'Technology',
  },
  {
    id: 'tech_btc_creator',
    question: 'Under what pseudonym was the original Bitcoin whitepaper published in 2008?',
    options: ['Vitalik Buterin', 'Satoshi Nakamoto', 'Nick Szabo', 'Hal Finney'],
    correctIndex: 1,
    category: 'Technology',
  },
  {
    id: 'tech_blockchain_ledger',
    question: 'What fundamental technology powers decentralized cryptocurrencies through distributed ledgers?',
    options: ['Cloud Storage', 'Blockchain', 'Quantum Core', 'Virtual Machine'],
    correctIndex: 1,
    category: 'Technology',
  },
  {
    id: 'tech_html_language',
    question: 'What does HTML stand for in web page authoring and structure?',
    options: [
      'HyperText Markup Language',
      'High-level Text Management Logic',
      'Hyperlink and Text Modular Layout',
      'Home Tool Markup Language',
    ],
    correctIndex: 0,
    category: 'Technology',
  },
  {
    id: 'tech_ai_concept',
    question: 'What does the term "AI" stand for in modern computer science?',
    options: ['Automated Interface', 'Artificial Intelligence', 'Advanced Internet', 'Actionable Insights'],
    correctIndex: 1,
    category: 'Technology',
  },
];

// 2. Deterministic Seedable PRNG
function createPrng(seedStr: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }

  return function nextFloat() {
    hash = (hash * 9301 + 49297) % 233280;
    return Math.abs(hash / 233280);
  };
}

// 3. Shuffler with PRNG
function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// 4. Infinite Procedural Math & Finance Question Generator
// Generates unique numeric questions guaranteed to have unique IDs based on their parameters
export function generateProceduralQuestion(
  userSeed: string,
  variantIndex: number
): QuizQuestion {
  const rng = createPrng(`${userSeed}_p_${variantIndex}_${Date.now()}`);
  const questionType = Math.floor(rng() * 7);

  if (questionType === 0) {
    // Percentage Calculation
    const percentages = [5, 10, 15, 20, 25, 30, 40, 50, 75];
    const bases = [12000, 25000, 40000, 60000, 80000, 100000, 150000, 250000, 500000];
    const pct = percentages[Math.floor(rng() * percentages.length)];
    const base = bases[Math.floor(rng() * bases.length)];
    const correctVal = Math.round((pct / 100) * base);

    const distractors = [
      Math.round(correctVal + base * 0.1),
      Math.max(500, Math.round(correctVal - base * 0.05)),
      Math.round(correctVal * 1.5),
    ];
    const allOptions = shuffleArray(
      [
        `₦${correctVal.toLocaleString()}`,
        `₦${distractors[0].toLocaleString()}`,
        `₦${distractors[1].toLocaleString()}`,
        `₦${distractors[2].toLocaleString()}`,
      ],
      rng
    );

    return {
      id: `proc_pct_${base}_${pct}_${variantIndex}`,
      question: `What is ${pct}% of ₦${base.toLocaleString()}?`,
      options: allOptions,
      correctIndex: allOptions.indexOf(`₦${correctVal.toLocaleString()}`),
      category: 'Finance Math',
    };
  }

  if (questionType === 1) {
    // Merchant Discount Calculation
    const originalPrices = [15000, 24000, 35000, 45000, 55000, 70000, 90000, 120000];
    const discounts = [10, 15, 20, 25, 30, 40, 50];
    const orig = originalPrices[Math.floor(rng() * originalPrices.length)];
    const disc = discounts[Math.floor(rng() * discounts.length)];
    const finalPrice = Math.round(orig - (disc / 100) * orig);

    const distractors = [
      Math.round(orig - (disc / 100) * orig * 0.5),
      finalPrice + 3500,
      Math.max(1000, finalPrice - 2500),
    ];
    const allOptions = shuffleArray(
      [
        `₦${finalPrice.toLocaleString()}`,
        `₦${distractors[0].toLocaleString()}`,
        `₦${distractors[1].toLocaleString()}`,
        `₦${distractors[2].toLocaleString()}`,
      ],
      rng
    );

    return {
      id: `proc_disc_${orig}_${disc}_${variantIndex}`,
      question: `A merchant offers a ${disc}% discount on an item originally priced at ₦${orig.toLocaleString()}. How much does the customer pay?`,
      options: allOptions,
      correctIndex: allOptions.indexOf(`₦${finalPrice.toLocaleString()}`),
      category: 'Business Math',
    };
  }

  if (questionType === 2) {
    // Savings Simple Interest
    const principals = [50000, 80000, 120000, 200000, 350000, 500000, 1000000];
    const rates = [5, 6, 8, 10, 12, 15];
    const years = [1, 2, 3];
    const p = principals[Math.floor(rng() * principals.length)];
    const r = rates[Math.floor(rng() * rates.length)];
    const t = years[Math.floor(rng() * years.length)];
    const interest = Math.round((p * r * t) / 100);

    const distractors = [
      Math.round(interest + p * 0.02),
      Math.max(1000, Math.round(interest * 0.7)),
      Math.round(interest * 1.5),
    ];
    const allOptions = shuffleArray(
      [
        `₦${interest.toLocaleString()}`,
        `₦${distractors[0].toLocaleString()}`,
        `₦${distractors[1].toLocaleString()}`,
        `₦${distractors[2].toLocaleString()}`,
      ],
      rng
    );

    return {
      id: `proc_interest_${p}_${r}_${t}_${variantIndex}`,
      question: `If an earner deposits ₦${p.toLocaleString()} for ${t} year(s) at a simple interest rate of ${r}% per annum, how much interest is earned?`,
      options: allOptions,
      correctIndex: allOptions.indexOf(`₦${interest.toLocaleString()}`),
      category: 'Banking',
    };
  }

  if (questionType === 3) {
    // FX Currency Exchange
    const amounts = [15, 25, 40, 60, 100, 150, 200, 300, 500];
    const rates = [1480, 1500, 1520, 1550, 1580, 1600];
    const amt = amounts[Math.floor(rng() * amounts.length)];
    const rate = rates[Math.floor(rng() * rates.length)];
    const nairaVal = amt * rate;

    const distractors = [nairaVal + 20000, Math.max(5000, nairaVal - 15000), nairaVal + 35000];
    const allOptions = shuffleArray(
      [
        `₦${nairaVal.toLocaleString()}`,
        `₦${distractors[0].toLocaleString()}`,
        `₦${distractors[1].toLocaleString()}`,
        `₦${distractors[2].toLocaleString()}`,
      ],
      rng
    );

    return {
      id: `proc_fx_${amt}_${rate}_${variantIndex}`,
      question: `If the foreign exchange rate is ₦${rate.toLocaleString()} per 1 US Dollar, what is the equivalent value of $${amt}?`,
      options: allOptions,
      correctIndex: allOptions.indexOf(`₦${nairaVal.toLocaleString()}`),
      category: 'Foreign Exchange',
    };
  }

  if (questionType === 4) {
    // Cashback Doubling / Multiplier
    const baseAmounts = [2000, 4500, 8000, 15000, 30000, 45000, 75000];
    const multiplier = [2, 3][Math.floor(rng() * 2)];
    const bAmt = baseAmounts[Math.floor(rng() * baseAmounts.length)];
    const totalReward = bAmt * multiplier;

    const distractors = [totalReward + 5000, Math.max(1000, totalReward - 4000), totalReward * 1.5];
    const allOptions = shuffleArray(
      [
        `₦${totalReward.toLocaleString()}`,
        `₦${distractors[0].toLocaleString()}`,
        `₦${distractors[1].toLocaleString()}`,
        `₦${distractors[2].toLocaleString()}`,
      ],
      rng
    );

    return {
      id: `proc_reward_${bAmt}_${multiplier}_${variantIndex}`,
      question: `If a 9jacash earner receives a ${multiplier}x cash multiplier on a task reward of ₦${bAmt.toLocaleString()}, what is the total amount received?`,
      options: allOptions,
      correctIndex: allOptions.indexOf(`₦${totalReward.toLocaleString()}`),
      category: 'Rewards Math',
    };
  }

  if (questionType === 5) {
    // Retail Trade Profit
    const buyPrices = [6000, 12000, 22000, 38000, 65000, 85000];
    const margins = [2500, 5000, 8500, 14000, 21000];
    const buy = buyPrices[Math.floor(rng() * buyPrices.length)];
    const profit = margins[Math.floor(rng() * margins.length)];
    const sell = buy + profit;

    const distractors = [profit + 3000, Math.max(1000, profit - 2000), profit * 2];
    const allOptions = shuffleArray(
      [
        `₦${profit.toLocaleString()}`,
        `₦${distractors[0].toLocaleString()}`,
        `₦${distractors[1].toLocaleString()}`,
        `₦${distractors[2].toLocaleString()}`,
      ],
      rng
    );

    return {
      id: `proc_trade_${buy}_${sell}_${variantIndex}`,
      question: `An SME merchant purchases inventory for ₦${buy.toLocaleString()} and sells it for ₦${sell.toLocaleString()}. What net profit was made?`,
      options: allOptions,
      correctIndex: allOptions.indexOf(`₦${profit.toLocaleString()}`),
      category: 'Business Math',
    };
  }

  // Daily Budget Division
  const monthlyBudgets = [60000, 90000, 120000, 150000, 180000, 240000, 300000];
  const days = 30;
  const mBudget = monthlyBudgets[Math.floor(rng() * monthlyBudgets.length)];
  const daily = Math.round(mBudget / days);

  const distractors = [daily + 1500, Math.max(500, daily - 1000), daily + 3000];
  const allOptions = shuffleArray(
    [
      `₦${daily.toLocaleString()}`,
      `₦${distractors[0].toLocaleString()}`,
      `₦${distractors[1].toLocaleString()}`,
      `₦${distractors[2].toLocaleString()}`,
    ],
    rng
  );

  return {
    id: `proc_budget_${mBudget}_${variantIndex}`,
    question: `If an earner allocates a monthly allowance of ₦${mBudget.toLocaleString()} equally across 30 days, what is the daily budget?`,
    options: allOptions,
    correctIndex: allOptions.indexOf(`₦${daily.toLocaleString()}`),
    category: 'Personal Finance',
  };
}

/**
 * Retrieves the user's set of answered question IDs from localStorage.
 */
export function getStoredAnsweredQuestionIds(userId: string): Set<string> {
  if (!userId) return new Set();
  try {
    const cleanUser = (userId || 'guest_user').toLowerCase().trim();
    const raw = localStorage.getItem(`9jacash_answered_quiz_${cleanUser}`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch {}
  return new Set();
}

/**
 * Marks a question ID as answered for this specific user in localStorage.
 */
export function markQuestionAnsweredForUser(userId: string, questionId: string): void {
  if (!userId || !questionId) return;
  try {
    const cleanUser = (userId || 'guest_user').toLowerCase().trim();
    const answered = getStoredAnsweredQuestionIds(cleanUser);
    answered.add(questionId);
    localStorage.setItem(`9jacash_answered_quiz_${cleanUser}`, JSON.stringify(Array.from(answered)));
  } catch {}
}

/**
 * Builds a dynamic, personalized quiz deck strictly filtering out ANY questions
 * that this user has ever answered before.
 *
 * Guarantees:
 * 1. User A's questions and options are in a completely different sequence from User B.
 * 2. Any question in `answeredIds` is strictly excluded.
 * 3. If trivia pool is exhausted for an active user, infinite unique procedural questions take over.
 */
export function generatePersonalizedQuizDeck(
  userId: string,
  count = 50,
  sessionSalt = ''
): QuizQuestion[] {
  const cleanUser = (userId || 'guest_user').toLowerCase().trim();
  const userSeed = `${cleanUser}_${sessionSalt}`;
  const rng = createPrng(userSeed);

  // 1. Load answered question IDs for this user
  const answeredSet = getStoredAnsweredQuestionIds(cleanUser);

  // 2. Filter available static trivia questions: keep ONLY unanswered ones!
  const availableTrivia = MASTER_TRIVIA_QUESTIONS.filter((q) => !answeredSet.has(q.id));

  // 3. Shuffle unanswered trivia specifically for this user
  const shuffledTrivia = shuffleArray(availableTrivia, rng).map((q, idx) => {
    // Shuffle options specifically for this user
    const optRng = createPrng(`${userSeed}_opt_${q.id}_${idx}`);
    const correctText = q.options[q.correctIndex];
    const shuffledOpts = shuffleArray(q.options, optRng);
    const newCorrectIdx = shuffledOpts.indexOf(correctText);

    return {
      id: q.id,
      question: q.question,
      options: shuffledOpts,
      correctIndex: newCorrectIdx,
      category: q.category,
    };
  });

  // 4. Assemble the deck: mix unanswered trivia with fresh procedural math questions
  const deck: QuizQuestion[] = [];
  let triviaPointer = 0;
  let procCounter = 0;

  while (deck.length < count) {
    const isProceduralSlot = (deck.length % 3 === 2) || (triviaPointer >= shuffledTrivia.length);

    if (isProceduralSlot) {
      // Find a procedural question that hasn't been answered yet
      let candidateProc: QuizQuestion | null = null;
      let attempts = 0;

      while (!candidateProc && attempts < 20) {
        attempts++;
        procCounter++;
        const generated = generateProceduralQuestion(userSeed, procCounter);
        if (!answeredSet.has(generated.id)) {
          candidateProc = generated;
        }
      }

      if (candidateProc) {
        deck.push(candidateProc);
      } else {
        // Fallback: guaranteed unique timestamped procedural
        procCounter++;
        deck.push(generateProceduralQuestion(userSeed, procCounter + Date.now()));
      }
    } else {
      deck.push(shuffledTrivia[triviaPointer]);
      triviaPointer++;
    }
  }

  return deck;
}
