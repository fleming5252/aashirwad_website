/* ============================================================
   AASHIRWAD CHATBOT - chatbot.js
   Injects the chat window and wires it to the bottom-right frame
   animation (#chatbotWidget) so clicking the animation opens chat.
   Knowledge base: text/aashirwad_chatbot_knowledge_base.txt
   ============================================================ */
(function () {
  'use strict';

  /* CONFIG */
  var PROXY_URL    = 'assets/api/chat.php';
  var GROQ_MODEL   = 'openai/gpt-oss-120b';
  var CACHE_KEY    = 'ai_chat_history';
  var CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  var SESSION_KEY  = 'ai_chat_session';
  var COMPANY_NAME = 'Aashirwad Institute of Teachers';

  /* KNOWLEDGE BASE (static - zero API credits) */
  var KB = {
    company: {
      name: COMPANY_NAME,
      brand: 'Aashirwad EduVerse',
      established: 2009,
      tagline: 'Academy for Competitive Examinations, Research & Training',
      description: 'An educational institution headquartered in Vaikom, Kottayam, Kerala, covering competitive examinations, teacher eligibility training, civil service preparation, digital learning and skill development.',
      approach: ['Conceptual clarity','Systematic preparation','Regular assessment','Quality learning resources','Personalised mentoring','Continuous academic support'],
      stats: ['16+ years of transforming aspirations','23 first ranks in PSC examinations','15,000+ students guided','500+ ranks achieved','200+ expert classes','95% student satisfaction'],
      journey: [
        { year: 2009, text: 'Aashirwad established in Vaikom; Navodaya training initiated.' },
        { year: 2010, text: 'Pallikkathodu Centre established.' },
        { year: 2011, text: 'Ettumanoor Centre started; Merchant Navy / IMU-CET coaching introduced.' },
        { year: 2015, text: 'Structured Kerala PSC examination training introduced.' },
        { year: 2019, text: 'Thrippunithura Centre established.' },
        { year: 2024, text: 'Civil Service Nurture Programme (CSNP) introduced.' },
        { year: 2026, text: 'North Paravur Centre started.' }
      ],
      vision: 'To build a trusted, progressive and future-ready educational ecosystem that makes quality education, expert guidance and effective learning resources accessible to every learner.',
      mission: 'To empower learners, nurture potential and build successful futures through quality education, innovative learning, personalised guidance and an unwavering commitment to excellence.',
      objective: 'To identify potential, nurture talent and create pathways to academic and professional success.',
      philosophy: 'Education should go beyond completing a syllabus or preparing for an examination. Aashirwad aims to develop critical thinking, confidence, communication, discipline, problem-solving skills and a lifelong commitment to learning.',
      learningSupport: ['Expert coaching','Comprehensive study materials','Smart evaluations','Regular practice','Mock examinations','Live contests','Digital learning','Personal guidance'],
      strengths: ['Established educational institution since 2009','Competitive examination expertise','Structured training','Experienced / expert faculty','Conceptual clarity','Systematic preparation','Regular assessment','Personalised mentoring','Continuous academic support','Comprehensive study materials','Digital learning resources','Mock tests and practice','Live contests','Result-oriented preparation','Kerala PSC training','Teacher eligibility training','Civil service foundation training','Navodaya preparation','Blended online and offline learning','Aashirwad EduVerse digital platform','Aashirwad Rank Files'],
      profileStats: ['28 PSC first ranks in the last 10 years (Institutional Profile)','4 PSC first ranks in 2026, including a State Rank (Institutional Profile)'],
      ulsad: 'Ulsad Uthaman secured 1st rank in two consecutive PSC rank lists published on consecutive days.'
    },
    contact: {
      address: 'Aashirwad Institute of Teachers, Kacherikavala, Vaikom, Kottayam, Kerala - 686141, India',
      phone: '+91 85475 77007',
      whatsapp: '+91 85479 35616',
      email: 'info@aitacademyindia.com',
      hours: 'The website does not specify official office working hours. Please call to confirm.',
      maps: 'https://www.google.com/maps/place/Aashirwad+Institute+Of+Teachers./@9.7986126,76.4377363,12.76z/data=!4m6!3m5!1s0x3b08791202bf0249:0xef3dd46b957523ea!8m2!3d9.7554921!4d76.3953634!16s%2Fg%2F11c5s47wt6',
      facebook: 'https://www.facebook.com/AITkerala/',
      instagram: 'https://www.instagram.com/aashirwadinstituteofteachers/?hl=en',
      youtube: 'https://www.youtube.com/@aashirwadinstituteofteachers'
    },
    centres: [
      { id: 'vaikom',        name: 'Vaikom',          district: 'Kottayam',   role: 'Head Office', year: '2009' },
      { id: 'pallikkathodu', name: 'Pallikkathodu',   district: 'Kottayam',   role: 'Centre', year: '2010' },
      { id: 'ettumanoor',    name: 'Ettumanoor',      district: 'Kottayam',   role: 'Centre', year: '2011' },
      { id: 'thrippunithura',name: 'Thrippunithura',  district: 'Ernakulam',  role: 'Centre', year: '2019' },
      { id: 'north-paravur', name: 'North Paravur',   district: 'Ernakulam',  role: 'Centre', year: '2026' }
    ],
    offlineNote: 'Aashirwad provides comprehensive offline classroom training in addition to its digital learning platform — a blended approach combining the EduVerse app with structured offline training, academic guidance and direct mentoring.',
    centreCaveat: 'The supplied website does not provide individual phone numbers, office hours, exact street addresses, course-by-course availability or batch schedules for each centre. Do not invent these details. Programme availability may vary by centre — please confirm with Aashirwad.',
    examAreas: [
      { group: 'Competitive Examination Training', items: 'Kerala PSC · Merchant Navy IMU All India CET / IMU-CET · Jawahar Navodaya Vidyalaya Selection Test (JNVST)' },
      { group: 'Teacher Eligibility & Recruitment', items: 'KTET Category I & II · CTET · LPST / UPST · HST · Subject-specific training' },
      { group: 'School Admission & Scholarship Exams', items: 'JNVST · NMMS · LSS · USS' },
      { group: 'Civil Service Foundation', items: 'Civil Service Nurture Programme (CSNP) · Foundation training for Classes 8 to Plus Two' },
      { group: 'Typewriting Training', items: 'Lower Grade · Higher Grade' },
      { group: 'Tuition Programmes', items: 'LKG to Plus Two' },
      { group: 'Language Training', items: 'German · Arabic · Malayalam · Sanskrit · Japanese · Hindi · English' },
      { group: 'Sports, Martial Arts & Wellness', items: 'Chess · Roller Skating · Kung Fu · Karate · Yoga · Meditation' }
    ],
    examAreasNote: 'The dedicated Courses page focuses on nine online/course-card programmes. Other training areas are part of the institution\'s wider profile — availability varies by centre, so please confirm with Aashirwad.',
    csnp: {
      title: 'Civil Service Nurture Programme (CSNP)',
      year: 2024,
      purpose: 'One of Aashirwad\'s flagship initiatives — to nurture young aspirants from the school level and guide them progressively towards Civil Services.',
      focus: ['Knowledge development','Analytical thinking','Communication skills','Current affairs awareness','Confidence','Leadership qualities','Foundation for future competitive examination success'],
      classes: 'Foundation training for students from Classes 8 to Plus Two.'
    },
    publications: {
      title: 'Aashirwad Rank File & Publications',
      body: 'Aashirwad publishes subject-specific Rank Files and structured study materials to support systematic preparation for competitive examinations. The About page describes Aashirwad Rank File and Aashirwad EduVerse as initiatives that integrate technology with conventional learning.',
      examples: ['Aashirwad PSC English Rank File','Aashirwad PSC Mathematics Rank File'],
      digital: ['Rank files','Study materials','Current affairs','Multimedia resources','Interactive learning tools'],
      purpose: 'To allow learners to continue their preparation beyond the traditional classroom.'
    },
    privacy: {
      dated: 'September 5, 2026',
      collects: ['Name','Email address','Mobile phone number','Account/login information','Course or learning activity information','Information submitted through forms, messages or support requests'],
      technical: ['Device type and operating system','Browser/application information','IP address','Pages, courses or features accessed','Date and time of activity','Diagnostic and technical information'],
      purposes: ['Account management','Course access','Course purchases','Customer support','Communications','Improving services','Security','Fraud prevention','Legal/regulatory compliance'],
      shares: ['Payment processing','Hosting','Data storage','Technical support','Communication','Analytics/performance monitoring','Security and fraud prevention'],
      noSell: 'Aashirwad does not sell or rent personal information to third parties. Payment card, banking or other sensitive payment credentials are not collected or stored unless explicitly stated otherwise.',
      url: 'https://aitacademyindia.com/privacypolicy.html'
    },
    links: {
      website: 'https://aitacademyindia.com/',
      about: 'https://aitacademyindia.com/about.html',
      courses: 'https://aitacademyindia.com/courses.html',
      app: 'https://aitacademyindia.com/app.html',
      contact: 'https://aitacademyindia.com/contact.html',
      privacy: 'https://aitacademyindia.com/privacypolicy.html',
      play: 'https://play.google.com/store/apps/details?id=dev.fle.ashirwad&hl=en_IN',
      ios: 'https://apps.apple.com/in/app/aashirwad-eduverse/id1501952592'
    },
    courses: [
      { id: 'women-police',    icon: '👮‍♀️', title: 'Women Police',
        desc: 'Specialized coaching for Women Police constable examinations with physical training and mock interviews.',
        price: '₹2,999', original: '₹4,999', discount: '40% OFF', rating: '4.8', students: '1.2k+' },
      { id: 'police-constable',icon: '👮‍♂️', title: 'Police Constable',
        desc: 'Complete preparation for Kerala Police Constable examinations including written, physical and viva preparation.',
        price: '₹3,499', original: '₹5,499', discount: '36% OFF', rating: '4.7', students: '2.1k+' },
      { id: 'lgs',             icon: '📝', title: 'LGS (Lower Grade)',
        desc: 'Thorough coaching for Lower Grade Servants examinations with focus on the Kerala PSC syllabus.',
        price: '₹2,499', original: '₹3,999', discount: '37% OFF', rating: '4.6', students: '3.4k+' },
      { id: 'ldc',             icon: '🗂️', title: 'LDC Clerk',
        desc: 'Expert-led coaching for Lower Division Clerk examinations with comprehensive study materials.',
        price: '₹3,999', original: '₹6,499', discount: '38% OFF', rating: '4.9', students: '5.6k+' },
      { id: 'degree-level',    icon: '🎓', title: 'Degree Level',
        desc: 'Degree-level PSC examination preparation covering all subjects with expert faculty guidance.',
        price: '₹4,499', original: '₹7,499', discount: '40% OFF', rating: '4.8', students: '4.2k+' },
      { id: 'secretariat',     icon: '🏛️', title: 'Secretariat Assistant',
        desc: 'Specialized coaching for Secretariat Assistant examinations with focus on Kerala PSC standards.',
        price: '₹5,999', original: '₹8,999', discount: '33% OFF', rating: '4.5', students: '1.8k+' },
      { id: 'ktet',            icon: '📘', title: 'KTET',
        desc: 'Success-guaranteed KTET coaching with mock tests, expert faculty and comprehensive study materials.',
        price: '₹3,999', original: '₹6,999', discount: '43% OFF', rating: '4.9', students: '6.3k+' },
      { id: 'ctet',            icon: '📗', title: 'CTET',
        desc: 'Central Teacher Eligibility Test preparation with all subjects covered by expert educators.',
        price: '₹4,499', original: '₹7,499', discount: '40% OFF', rating: '4.7', students: '2.9k+' },
      { id: 'civil-service',   icon: '🇮🇳', title: 'Civil Service Foundation',
        desc: 'Foundation course for Civil Services with comprehensive coverage of the Prelims and Mains syllabus.',
        price: '₹12,999', original: '₹19,999', discount: '35% OFF', rating: '4.6', students: '1.5k+' }
    ],
    programs: [
      { title: 'Competitive Examination Training', items: 'Kerala PSC · Merchant Navy IMU-CET · JNVST' },
      { title: 'Teacher Eligibility & Recruitment', items: 'KTET Category I & II · CTET · LPST / UPST · HST · Subject-specific training' },
      { title: 'School Admission & Scholarship Exams', items: 'JNVST · NMMS · LSS · USS' },
      { title: 'Civil Service Foundation', items: 'Civil Service Nurture Programme (CSNP) · Foundation training for Classes 8 to Plus Two' },
      { title: 'Typewriting Training', items: 'Lower Grade · Higher Grade' },
      { title: 'Tuition Programmes', items: 'LKG to Plus Two' },
      { title: 'Language Training', items: 'German · Arabic · Malayalam · Sanskrit · Japanese · Hindi · English' },
      { title: 'Sports, Martial Arts & Wellness', items: 'Chess · Roller Skating · Kung Fu · Karate · Yoga · Meditation' }
    ],
    app: {
      name: 'Aashirwad EduVerse',
      desc: 'A mobile learning application designed for Kerala PSC and competitive examination preparation - available on Android and iOS.',
      modes: [
        { title: 'Reading Mode',  desc: 'Distraction-free digital reading environments curated by subject experts.' },
        { title: 'Writing Mode',  desc: 'Writing and practice exercises to support memory retrieval and long-term retention.' },
        { title: 'Audio Mode',    desc: 'Professionally explained audio lessons for learning while travelling or exercising.' },
        { title: 'Video Mode',    desc: 'Video lessons that simplify complex theories and syllabus topics.' }
      ],
      features: [
        'Syllabus Tree (module-wise subjects, topics, subtopics + revision tests)',
        'Keyword Search across chapters',
        'Smart Exam Modes & Live Contests',
        'Educational Game Zone with quizzes and streaks',
        'Daily Current Affairs & Editorial Insights',
        'Progress Tracking',
        'Offline Study Materials',
        'Real-time Notifications',
        'Rank Files access'
      ],
      journey: 'Choose Your Exam → Category → Subject → Topic → Sub Topic → Content → Four Learning Modes',
      webJourney: 'Study → Practice → Revise → Test → Analyze → Succeed',
      freeTrial: '2-day free trial of premium features (Reading, Writing, Audio, Video)',
      rewards: 'Users can compete in live contests, earn reward points on leaderboards, and redeem those points on premium courses and study materials within the app.',
      play: 'https://play.google.com/store/apps/details?id=dev.fle.ashirwad&hl=en_IN',
      ios: 'https://apps.apple.com/in/app/aashirwad-eduverse/id1501952592'
    },
    guarantee: {
      title: 'KTET Success Guarantee',
      body: 'Eligible candidates who do not qualify after completing the prescribed training may attend the next training session free of charge, subject to the applicable programme terms and conditions. This is not an unconditional money-back or qualification guarantee.'
    },
    faq: [
      { q: 'What is Aashirwad Institute of Teachers?',
        a: 'Aashirwad Institute of Teachers is an educational institution established in 2009 in Vaikom, Kottayam, Kerala. It provides competitive examination training, teacher eligibility training, civil service preparation, digital learning and other educational programmes. Alternate brand names are Aashirwad EduVerse and Aashirwad.' },
      { q: 'When was Aashirwad established?',
        a: 'Aashirwad Institute of Teachers was established in 2009. Navodaya training was initiated the same year in Vaikom.' },
      { q: 'Where is Aashirwad located?',
        a: 'The head office is at Kacherikavala, Vaikom, Kottayam, Kerala 686141. Other centres: Pallikkathodu, Ettumanoor, Thrippunithura and North Paravur.' },
      { q: 'What is Aashirwad EduVerse?',
        a: 'Aashirwad EduVerse is the digital learning platform and mobile application of Aashirwad, designed to support Kerala PSC and competitive examination preparation.' },
      { q: 'Which exams does Aashirwad provide coaching for?',
        a: 'Aashirwad provides training for Kerala PSC, KTET, CTET, Police examinations, LDC, LGS, Degree Level PSC, Secretariat Assistant, Civil Services and other competitive examinations. The institutional profile also lists Navodaya, Merchant Navy/IMU-CET, SSC and school-level scholarship examinations.' },
      { q: 'Do you provide Kerala PSC coaching?',
        a: 'Yes. Kerala PSC is one of Aashirwad\'s main competitive examination training areas. The current course page lists LDC, LGS, Degree Level, Secretariat Assistant and other PSC-related programmes.' },
      { q: 'Do you provide Police Constable coaching?',
        a: 'Yes. The Police Constable course includes preparation for written, physical and viva components.' },
      { q: 'Do you provide Women Police coaching?',
        a: 'Yes. The Women Police programme includes physical training and mock interview preparation.' },
      { q: 'Do you provide KTET coaching?',
        a: 'Yes. Aashirwad provides KTET coaching with mock tests, expert faculty and comprehensive study materials. The website also describes a KTET Success Guarantee subject to eligibility and programme terms.' },
      { q: 'Do you provide CTET coaching?',
        a: 'Yes. CTET preparation is offered through expert educators, covering all subjects.' },
      { q: 'Do you provide Civil Services coaching?',
        a: 'Yes. Aashirwad provides a Civil Service Foundation course and the Civil Service Nurture Programme (CSNP).' },
      { q: 'What is the Civil Service Nurture Programme?',
        a: 'CSNP is a foundation programme designed to nurture young aspirants from the school level (Classes 8 to Plus Two) and progressively develop knowledge, analytical thinking, communication, current affairs awareness, confidence and leadership skills. It was introduced in 2024.' },
      { q: 'Do you provide Navodaya coaching?',
        a: 'Yes. Navodaya Entrance / JNVST preparwellation is part of Aashirwad\'s institutional training areas. The institution also highlights a strong and consistent record in Navodaya admissions, including a rare achievement where three children from the same family secured Navodaya admission through the Selection Test.' },
      { q: 'Do you provide scholarship exam coaching?',
        a: 'The institutional profile lists NMMS, LSS and USS among school admission and scholarship examination training areas.' },
      { q: 'Do you provide offline classroom coaching?',
        a: 'Yes. Aashirwad provides comprehensive offline training in addition to its digital learning platform.' },
      { q: 'Is Aashirwad EduVerse only an online learning platform?',
        a: 'No. Aashirwad combines digital learning through EduVerse with offline classroom training - a blended learning approach.' },
      { q: 'Is the Aashirwad EduVerse app available on Android?',
        a: 'Yes. The app is available on Android through Google Play.' },
      { q: 'Is the Aashirwad EduVerse app available on iPhone/iOS?',
        a: 'Yes. The app is available on the Apple App Store.' },
      { q: 'Does the app have a free trial?',
        a: 'Yes. The website states that EduVerse provides a 2-day free trial for premium features.' },
      { q: 'What are the four learning modes in EduVerse?',
        a: 'Reading, Writing, Audio and Video.' },
      { q: 'What is the Syllabus Tree?',
        a: 'It organizes learning content module-wise into subjects, topics, subtopics and chapters. It also supports personal digital short notes and built-in revision tests.' },
      { q: 'Does the app provide mock tests?',
        a: 'Yes. The app provides unlimited practice exams, mock exams, test series and previous year question papers.' },
      { q: 'Does the app have live contests?',
        a: 'Yes. Users can participate in real-time live contests and compete on leaderboards, earning reward points that can be redeemed on premium courses and materials.' },
      { q: 'Does the app provide current affairs?',
        a: 'Yes. It provides daily curated current affairs, visual aids and editorial insights on major national and global events.' },
      { q: 'How can I contact Aashirwad?',
        a: 'Call +91 85475 77007, WhatsApp +91 85479 35616, email info@aitacademyindia.com, or use the contact page.' },
      { q: 'What are Aashirwad\'s official social media accounts?',
        a: 'Facebook: https://www.facebook.com/AITkerala/ - Instagram: https://www.instagram.com/aashirwadinstituteofteachers/?hl=en - YouTube: https://www.youtube.com/@aashirwadinstituteofteachers' },
      { q: 'Does Aashirwad have a North Paravur centre?',
        a: 'Yes. The Institutional Profile states that the North Paravur Centre started in 2026 and extends Aashirwad\'s academic activities into North Paravur and neighbouring areas.' },
      { q: 'What are Aashirwad\'s other centres?',
        a: 'The supplied Institutional Profile lists Vaikom (Head Office), Pallikkathodu, Ettumanoor, Thrippunithura and North Paravur.' },
      { q: 'What is Aashirwad\'s vision?',
        a: 'To build a trusted, progressive and future-ready educational ecosystem that makes quality education, expert guidance and effective learning resources accessible to every learner.' },
      { q: 'What is Aashirwad\'s mission?',
        a: 'To empower learners, nurture potential and build successful futures through quality education, innovative learning, personalised guidance and an unwavering commitment to excellence.' },
      { q: 'Does Aashirwad have a KTET success guarantee?',
        a: 'Yes. Eligible candidates who do not qualify after completing the prescribed training may attend the next training session free of charge, subject to applicable programme terms and conditions.' },
      { q: 'Do you have offline centres?',
        a: 'Yes. Aashirwad provides comprehensive offline classroom training in addition to its digital learning platform. The Institutional Profile lists five centres: Vaikom (Head Office, Kottayam), Pallikkathodu (Kottayam), Ettumanoor (Kottayam), Thrippunithura (Ernakulam) and North Paravur (Ernakulam, started 2026).' },
      { q: 'What is the Aashirwad Rank File?',
        a: 'Aashirwad Rank File is one of the institution\'s educational initiatives. Aashirwad publishes subject-specific Rank Files (for example, PSC English and PSC Mathematics) and structured study materials. The digital learning ecosystem includes rank files, study materials, current affairs, multimedia resources and interactive learning tools.' },
      { q: 'What is the privacy policy?',
        a: 'The Privacy Policy (dated September 5, 2026) explains how Aashirwad collects, uses, stores and protects user information. Aashirwad does not sell or rent personal information to third parties. For details, visit https://aitacademyindia.com/privacypolicy.html' },
      { q: 'What are the official links?',
        a: 'Website: https://aitacademyindia.com/ - About: https://aitacademyindia.com/about.html - Courses: https://aitacademyindia.com/courses.html - App: https://aitacademyindia.com/app.html - Contact: https://aitacademyindia.com/contact.html - Privacy: https://aitacademyindia.com/privacypolicy.html - Google Play: https://play.google.com/store/apps/details?id=dev.fle.ashirwad - App Store: https://apps.apple.com/in/app/aashirwad-eduverse/id1501952592' },
      { q: 'What is the CSNP?',
        a: 'The Civil Service Nurture Programme (CSNP), introduced in 2024, is a flagship initiative to nurture young aspirants from the school level (Classes 8 to Plus Two) towards Civil Services. It focuses on knowledge development, analytical thinking, communication skills, current affairs awareness, confidence and leadership qualities.' },
      { q: 'What exams do you coach for?',
        a: 'Competitive exam training covers Kerala PSC, Merchant Navy IMU-CET and JNVST. Teacher eligibility covers KTET Category I & II, CTET, LPST/UPST and HST. School exams cover JNVST, NMMS, LSS and USS. The institutional profile also lists SSC and other competitive examinations. The Courses page lists nine course cards: Women Police, Police Constable, LGS, LDC Clerk, Degree Level, Secretariat Assistant, KTET, CTET and Civil Service Foundation.' }
    ]
  };

  /* SYSTEM PROMPT (short = fewer tokens). Intent only - answers come from the static KB handlers. */
  var SYSTEM_PROMPT =
    'You are the AI assistant for ' + COMPANY_NAME + ' (Aashirwad EduVerse), an educational institution in Kerala, India, established 2009.\n\n' +
    'INTENT CLASSIFIER - Respond ONLY with ONE of these exact labels (lowercase, no punctuation):\n' +
    'courses | programs | centres | offline | app | app_features | app_modes | contact | faq | company | achievements | journey | vision | guarantee | why_us | price | admission | language | social | csnp | publications | exam_areas | sports | privacy | links | approach | navodaya | job | off_topic | greeting | self | get_details | other\n\n' +
    'Rules:\n' +
    '- "courses" - any specific course (PSC, LDC, LGS, KTET, CTET, Police, Women Police, Secretariat, Civil Service, Degree Level) or fees/price of a course\n' +
    '- "programs" - broader training areas, exam types, language training, tuition, typewriting, sports/wellness\n' +
    '- "centres" - locations, branches, Vaikom, Pallikkathodu, Ettumanoor, Thrippunithura, North Paravur, address\n' +
    '- "app" - EduVerse app, mobile app, learning modes, syllabus tree, mock tests, live contests, free trial, download\n' +
    '- "contact" - phone, email, address, office hours, location, get in touch, WhatsApp, social media, call\n' +
    '- "faq" - general questions, how does it work, what is offered\n' +
    '- "company" - about the institution, history, vision, mission, values, faculty, approach\n' +
    '- "achievements" - results, ranks, PSC first ranks, Navodaya success, success rate, achievements\n' +
    '- "journey" - timeline, milestones, when established, history of centres\n' +
    '- "vision" - vision, mission, philosophy, goal\n' +
    '- "guarantee" - KTET guarantee, success guarantee, money back\n' +
    '- "why_us" - why choose you, what makes you different, are you reliable, best coaching\n' +
    '- "price" - fees, cost, charges, how much does it cost\n' +
    '- "admission" - how to enrol, admission process, batch, seat availability, deadline\n' +
    '- "language" - Malayalam, English, which languages\n' +
    '- "social" - social media accounts, Facebook, Instagram, YouTube\n' +
    '- "greeting" - hi, hello, hey, good morning/afternoon/evening, namaste\n' +
    '- "self" - who are you, what are you, what is your name, what\'s your name, whats your name, your name, who am i talking to, are you a bot, what can you do, tell me about yourself\n' +
    '- "job" - will I get a job, do I get a job after the course, job guarantee, placement, employment, selected for the post, salary after PSC course, will I be selected — these are outcome questions; NEVER promise a job, rank or exam success, route to the job handler\n' +
    '- "get_details" - need more details, learn more, enquire, send details, I am interested\n' +
    '- "centres" - offline centres, offline branches, centre locations, offline classes, offline training centres, Vaikom, Pallikkathodu, Ettumanoor, Thrippunithura, North Paravur, where are you located\n' +
    '- "offline" - offline classroom training, offline coaching, is training offline or online\n' +
    '- "exam_areas" - which exams do you coach for, competitive exam areas, SSC, Merchant Navy, NMMS, LSS, USS, LPST, UPST, HST, typewriting, tuition, language training\n' +
    '- "sports" - sports training, sports coaching, martial arts, wellness training, physical fitness, chess, roller skating, kung fu, karate, yoga, meditation\n' +
    '- "csnp" - Civil Service Nurture Programme, CSNP, foundation training classes 8 to plus two\n' +
    '- "publications" - Rank File, publications, study materials published by Aashirwad\n' +
    '- "privacy" - privacy policy, personal data, data collection, my data\n' +
    '- "links" - official links, website URL, Google Play, App Store, download link\n' +
    '- "approach" - academic approach, methodology, how do you teach, learning approach\n' +
    '- "app_features" - syllabus tree, mock tests, live contests, current affairs, game zone, reward points, leaderboard, progress tracking, offline study materials, notifications, quizzes\n' +
    '- "app_modes" - learning modes, reading mode, writing mode, audio mode, video mode\n' +
    '- "off_topic" - anything unrelated to education, coaching, Aashirwad or this website\n\n' +
    'IMPORTANT: Users may misspell words. Match on INTENT, not exact spelling.\n\n' +
    'Return exactly one label. Nothing else.';

  /* STATE */
  var isOpen = false, isLoading = false;
  var navStack = [];
  var _aiTurnAnchor = null;

  /* CACHE / SESSION */
  function loadCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return [];
      var d = JSON.parse(raw);
      if (Date.now() - d.created_at > CACHE_TTL_MS) { localStorage.removeItem(CACHE_KEY); return []; }
      return d.messages || [];
    } catch (e) { return []; }
  }
  function saveCache(messages) {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      var ts = raw ? (JSON.parse(raw).created_at || Date.now()) : Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify({ created_at: ts, messages: messages }));
    } catch (e) {}
  }
  function loadSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return [];
      var d = JSON.parse(raw);
      if (Date.now() - d.created_at > CACHE_TTL_MS) { localStorage.removeItem(SESSION_KEY); return []; }
      return d.events || [];
    } catch (e) { return []; }
  }
  function saveSession(events) {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      var ts = raw ? (JSON.parse(raw).created_at || Date.now()) : Date.now();
      localStorage.setItem(SESSION_KEY, JSON.stringify({ created_at: ts, events: events }));
    } catch (e) {}
  }
  function logEvent(type, payload) {
    var events = loadSession();
    events.push({ type: type, payload: payload || {} });
    saveSession(events);
  }

  function getGreeting() {
    var h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }
  function fmtTime() {
    try {
      return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      var d = new Date();
      return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    }
  }

  /* BUILD WINDOW MARKUP (injected - no per-page edits needed) */
  function injectStyles() {
    if (document.getElementById('aiChatbotStyles')) return;
    var link = document.createElement('link');
    link.id = 'aiChatbotStyles';
    link.rel = 'stylesheet';
    link.href = 'assets/css/chatbot.css?v=1.0.1';
    (document.head || document.documentElement).appendChild(link);
  }

  function injectWindow() {
    if (document.getElementById('aiChatWindow')) return;
    var html =
      '<div class="ai-chat-window" id="aiChatWindow" aria-hidden="true" role="dialog" aria-label="Aashirwad Chat Assistant">' +
        '<div class="ai-chat-header">' +
          '<div class="ai-chat-header-info">' +
            '<div class="ai-chat-avatar">' +
              '<svg viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<circle cx="21" cy="21" r="21" fill="url(#aiAvatarGrad)"/>' +
                '<path d="M12 29c0-5 4.03-9 9-9s9 4 9 9" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>' +
                '<circle cx="21" cy="16" r="4.5" fill="#fff"/>' +
                '<defs><linearGradient id="aiAvatarGrad" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse">' +
                '<stop offset="0%" stop-color="#D6B46D"/><stop offset="100%" stop-color="#C68A2D"/>' +
                '</linearGradient></defs>' +
              '</svg>' +
            '</div>' +
            '<div>' +
              '<div class="ai-chat-header-name">Aashirwad Assistant</div>' +
              '<div class="ai-chat-header-status"><span class="ai-status-dot"></span>AI online &middot; Ready to help</div>' +
            '</div>' +
          '</div>' +
          '<div class="ai-chat-header-actions">' +
            '<button class="ai-chat-new" id="aiChatNew" aria-label="New chat" title="Start new chat">' +
              '<svg viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
            '</button>' +
            '<button class="ai-chat-close" id="aiChatClose" aria-label="Close chat">' +
              '<svg viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="ai-chat-messages" id="aiChatMessages"></div>' +
        '<div class="ai-chat-footer">' +
          '<div class="ai-chat-input-row">' +
            '<textarea id="aiChatInput" class="ai-chat-input" placeholder="Ask me anything..." rows="1" aria-label="Message input"></textarea>' +
            '<button class="ai-chat-send" id="aiChatSend" aria-label="Send message">' +
              '<svg viewBox="0 0 20 20" fill="none"><path d="M17 10L3 3l3.5 7L3 17l14-7z" fill="currentColor"/></svg>' +
            '</button>' +
          '</div>' +
          '<div class="ai-chat-powered">Powered by Aashirwad AI &middot; <a href="contact.html">Contact us</a></div>' +
        '</div>' +
      '</div>';
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap.firstElementChild);
  }

  /* ELEMENTS */
  var win, msgsEl, input, sendBtn, closeBtn, newChatBtn;
  function cacheDom() {
    win        = document.getElementById('aiChatWindow');
    msgsEl     = document.getElementById('aiChatMessages');
    input      = document.getElementById('aiChatInput');
    sendBtn    = document.getElementById('aiChatSend');
    closeBtn   = document.getElementById('aiChatClose');
    newChatBtn = document.getElementById('aiChatNew');
  }

  /* The trigger is the existing frame-animation widget
     (assets/js/chatbot-widget.js, id="chatbotWidget") - injected async,
     so use event delegation and query it lazily. */
  function getTrigger() {
    return document.getElementById('chatbotWidget');
  }

  /* TOGGLE */
  function openChat() {
    if (!win) return;
    isOpen = true;
    var t = getTrigger();
    if (t) { t.classList.add('ai-open'); t.style.visibility = 'hidden'; }
    win.classList.add('ai-visible');
    win.setAttribute('aria-hidden', 'false');
    if (input) input.focus();
    if (msgsEl && msgsEl.children.length === 0) initChat();
  }
  function closeChat() {
    if (!win) return;
    isOpen = false;
    var t = getTrigger();
    if (t) { t.classList.remove('ai-open'); t.style.visibility = 'visible'; }
    win.classList.remove('ai-visible');
    win.setAttribute('aria-hidden', 'true');
  }

  /* INIT */
  function initChat() {
    var events = loadSession();
    if (events.length > 0) replaySession(events);
    else {
      appendBot(getGreeting() + '! 🙏 Welcome to <strong>Aashirwad Institute of Teachers</strong>.<br>I\'m your virtual assistant - here to help you explore courses, centres, the EduVerse app and more.<br><br>What may I help you with today?');
      logEvent('init', {});
      showMainMenu();
      logEvent('showMainMenu', {});
    }
  }

  function replaySession(events) {
    window._aiReplaying = true;
    events.forEach(function (ev) {
      switch (ev.type) {
        case 'init':
          appendBot(getGreeting() + '! 🙏 Welcome to <strong>Aashirwad Institute of Teachers</strong>.<br>I\'m your virtual assistant - here to help you explore courses, centres, the EduVerse app and more.<br><br>What may I help you with today?', false);
          break;
        case 'userMsg': appendUser(ev.payload.text, false); break;
        case 'botMsg':  appendBot(ev.payload.html, false); break;
        case 'showMainMenu':       showMainMenu(); break;
        case 'showCoursesMenu':    showCoursesMenu(); break;
        case 'showCourseDetail':
          var c = KB.courses.filter(function (x) { return x.id === ev.payload.id; })[0];
          if (c) showCourseDetail(c);
          break;
        case 'showPrograms':       showPrograms(); break;
        case 'showCentres':        showCentres(); break;
        case 'showApp':            showApp(); break;
        case 'showAppModes':       showAppFeatures(); break;
        case 'showContact':        showContact(); break;
        case 'showFAQ':            showFAQ(); break;
        case 'showFAQAnswer':
          appendBot(ev.payload.answer, false);
          appendBot('Do you have another question?', false);
          showFAQ();
          break;
        case 'showCompany':        showCompany(); break;
        case 'showAchievements':   showAchievements(); break;
        case 'showJourney':        showJourney(); break;
        case 'showVision':         showVision(); break;
        case 'showGuarantee':      showGuarantee(); break;
        case 'showWhyChooseUs':    showWhyChooseUs(); break;
        case 'showPrice':          showPrice(); break;
        case 'showAdmission':      showAdmission(); break;
        case 'showSelfIntro':      showSelfIntro(); break;
        case 'showGetDetails':     showGetDetails(); break;
        case 'showOffTopic':       showOffTopic(); break;
        case 'showContactFallback': showContactFallback(); break;
        case 'showOffline':          showOffline(); break;
        case 'showExamAreas':        showExamAreas(); break;
        case 'showCSNP':             showCSNP(); break;
        case 'showPublications':     showPublications(); break;
        case 'showPrivacy':          showPrivacy(); break;
        case 'showLinks':            showLinks(); break;
        case 'showApproach':         showApproach(); break;
        case 'showAppModes':         showAppModes(); break;
        case 'showNavodayaDetail':   showNavodayaDetail(); break;
        case 'showSportsTraining':    showSportsTraining(); break;
        case 'showJobReality':        showJobReality(); break;
        case 'showSocial':         showSocial(); break;
        case 'showLanguage':       showLanguage(); break;
        case 'thankYou':           appendBot(ev.payload.html, false); break;
        case 'greeting':
          appendBot(ev.payload.html, false);
          showMainMenu();
          break;
      }
    });
    window._aiReplaying = false;
  }

  function showMainMenu() {
    var chips = [
      { label: '📚 Our Courses',      action: function () { showCoursesMenu(); } },
      { label: '🏛️ Training Areas',   action: function () { handleTopic('programs'); } },
      { label: '📍 Centres',          action: function () { handleTopic('centres'); } },
      { label: '📱 EduVerse App',     action: function () { handleTopic('app'); } },
      { label: '🏆 Achievements',     action: function () { handleTopic('achievements'); } },
      { label: '📞 Contact Us',       action: function () { handleTopic('contact'); } },
      { label: '❓ FAQs',             action: function () { handleTopic('faq'); } },
      { label: '💬 Human Assistance', action: function () { window.location.href = 'https://wa.me/918547935616'; } },
      { label: '📞 Call Us',          action: function () { window.location.href = 'tel:+918547577007'; } }
    ];
    appendChips(chips, null);
  }

  /* MESSAGE RENDERING */
  function appendBot(html, save) {
    if (save === undefined) save = true;
    var shouldAutoScroll = isNearBottom();
    var el = document.createElement('div');
    el.className = 'ai-msg ai-msg-bot';
    el.innerHTML = '<div class="ai-msg-bubble">' + html + '</div><div class="ai-msg-time">' + fmtTime() + '</div>';
    msgsEl.appendChild(el);
    if (shouldAutoScroll) {
      if (window._aiNewTurn) {
        _aiTurnAnchor = el;
        window._aiNewTurn = false;
        scrollToElement(el);
      } else if (_aiTurnAnchor) {
        var anchorTop = _aiTurnAnchor.getBoundingClientRect().top;
        var containerTop = msgsEl.getBoundingClientRect().top;
        if (anchorTop < containerTop) scrollToElement(el);
      }
    }
    if (save && !window._aiReplaying) cacheMessage({ role: 'bot', content: html, time: fmtTime() });
    return el;
  }

  function appendUser(text, save) {
    if (save === undefined) save = true;
    var el = document.createElement('div');
    el.className = 'ai-msg ai-msg-user';
    el.innerHTML = '<div class="ai-msg-bubble">' + escapeHtml(text) + '</div><div class="ai-msg-time">' + fmtTime() + '</div>';
    msgsEl.appendChild(el);
    scrollIfNearBottom();
    if (save && !window._aiReplaying) cacheMessage({ role: 'user', content: text, time: fmtTime() });
    return el;
  }

  function appendChips(chips, backAction) {
    var group = document.createElement('div');
    group.className = 'ai-chip-group';
    chips.forEach(function (c) {
      var btn = document.createElement('button');
      btn.className = 'ai-chip';
      btn.textContent = c.label;
      btn.addEventListener('click', function () {
        group.remove();
        var userText = c.label.replace(/^[^\s]+\s/, '');
        appendUser(userText);
        window._aiNewTurn = true;
        if (!window._aiReplaying) logEvent('userMsg', { text: userText });
        c.action();
      });
      group.appendChild(btn);
    });
    if (backAction) {
      var back = document.createElement('button');
      back.className = 'ai-back-btn';
      back.innerHTML = '← Back';
      back.addEventListener('click', function () { group.remove(); backAction(); });
      group.appendChild(back);
    }
    msgsEl.appendChild(group);
    scrollIfNearBottom();
  }

  function appendInfoCard(icon, title, body, ctaLabel, ctaHref, backAction) {
    var shouldAutoScroll = isNearBottom();
    var card = document.createElement('div');
    card.className = 'ai-info-card';
    card.innerHTML = '<div class="ai-info-card-title"><span class="ai-icon">' + icon + '</span>' + title + '</div><div>' + body + '</div>';
    msgsEl.appendChild(card);
    if (ctaLabel && ctaHref) {
      var cta = document.createElement('a');
      cta.className = 'ai-cta-btn';
      cta.href = ctaHref;
      cta.innerHTML = ctaLabel + ' →';
      msgsEl.appendChild(cta);
    }
    if (backAction) {
      var back = document.createElement('button');
      back.className = 'ai-back-btn';
      back.innerHTML = '← Back';
      back.addEventListener('click', function () {
        back.remove(); card.remove();
        var c = msgsEl.querySelector('.ai-cta-btn'); if (c) c.remove();
        backAction();
      });
      msgsEl.appendChild(back);
    }
    if (shouldAutoScroll) scrollToElement(card);
  }

  function appendTyping() {
    var el = document.createElement('div');
    el.className = 'ai-typing';
    el.id = 'aiTyping';
    el.innerHTML = '<span></span><span></span><span></span>';
    msgsEl.appendChild(el);
    scrollIfNearBottom();
    return el;
  }
  function removeTyping() {
    var el = document.getElementById('aiTyping');
    if (el) el.remove();
  }

  /* TOPIC HANDLERS */
  function handleTopic(topic, backFn) {
    navStack.push(backFn || showMainMenu);
    switch (topic) {
      case 'programs':     showPrograms(); break;
      case 'centres':      showCentres(); break;
      case 'app':          showApp(); break;
      case 'contact':      showContact(); break;
      case 'faq':          showFAQ(); break;
      case 'company':      showCompany(); break;
      case 'achievements': showAchievements(); break;
      case 'journey':      showJourney(); break;
      case 'vision':       showVision(); break;
      case 'guarantee':    showGuarantee(); break;
      case 'why_us':       showWhyChooseUs(); break;
      case 'price':        showPrice(); break;
      case 'admission':    showAdmission(); break;
      case 'self':         showSelfIntro(); break;
      case 'get_details':  showGetDetails(); break;
      case 'off_topic':    showOffTopic(); break;
      case 'social':       showSocial(); break;
      case 'language':     showLanguage(); break;
      default:             showMainMenu(); break;
    }
  }

  /* COURSES MENU */
  function showCoursesMenu() {
    if (!window._aiReplaying) logEvent('showCoursesMenu', {});
    appendBot('Here are the <strong>9 courses</strong> currently listed on our website. Select one to learn more:');
    var chips = KB.courses.map(function (s) {
      return { label: s.icon + ' ' + s.title, action: function () { showCourseDetail(s); } };
    });
    chips.push({ label: '🏠 Main Menu', action: function () { appendBot('Back to main menu:'); showMainMenu(); } });
    appendChips(chips, null);
  }

  function showCourseDetail(s) {
    if (!window._aiReplaying) logEvent('showCourseDetail', { id: s.id });
    var body =
      s.desc + '<br><br>' +
      '<strong>💰 Fee:</strong> ' + s.price + ' <span style="text-decoration:line-through;color:var(--ai-muted);">' + s.original + '</span> <strong style="color:var(--ai-red);">' + s.discount + '</strong><br>' +
      '<strong>⭐ Rating:</strong> ' + s.rating + ' &nbsp;·&nbsp; <strong>👥 Students:</strong> ' + s.students + '<br>' +
      '<div style="margin-top:8px;font-size:11.5px;color:var(--ai-muted);">Prices, ratings and student counts are the values currently displayed on our website and may change. Please confirm with Aashirwad before enrolment.</div>';
    appendInfoCard(
      s.icon,
      s.title,
      body,
      'View Course Page',
      'courses.html',
      function () { appendBot('Explore more courses:'); showCoursesMenu(); }
    );
    appendEnquiryPrompt();
  }

  /* PROGRAMS / TRAINING AREAS */
  function showPrograms() {
    if (!window._aiReplaying) logEvent('showPrograms', {});
    var rows = KB.programs.map(function (p) {
      return '<div class="ai-contact-row"><span class="ai-contact-icon">📘</span><span><strong>' + p.title + '</strong><br>' + p.items + '</span></div>';
    }).join('');
    appendInfoCard(
      '🎓',
      'Aashirwad\'s Wider Training Areas',
      rows + '<br><div style="font-size:11.5px;color:var(--ai-muted);">The Courses page focuses on nine online/course-card programmes. Other areas are part of the institution\'s wider profile - availability varies by centre, so please confirm with Aashirwad.</div>',
      'See Course Cards',
      'courses.html',
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* CENTRES */
  function showCentres() {
    if (!window._aiReplaying) logEvent('showCentres', {});
    var rows = KB.centres.map(function (c) {
      return '<div class="ai-contact-row"><span class="ai-contact-icon">📍</span><span><strong>' + c.name + '</strong> — ' + c.district + ' District · ' + c.role + (c.year ? ' · Established ' + c.year : '') + '</span></div>';
    }).join('');
    appendInfoCard(
      '📍',
      'Our Centres',
      '<strong>Yes — Aashirwad provides offline classroom training</strong> across its centres, in addition to the EduVerse digital platform.<br><br>' +
      rows + '<br>' +
      '<strong>Offline Training:</strong> ' + KB.offlineNote + '<br><br>' +
      '<div style="font-size:11.5px;color:var(--ai-muted);">' + KB.centreCaveat + '</div>',
      'View on Google Maps',
      KB.contact.maps,
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* APP */
  function showApp() {
    if (!window._aiReplaying) logEvent('showApp', {});
    var modes = KB.app.modes.map(function (m) {
      return '<div class="ai-contact-row"><span class="ai-contact-icon">🎧</span><span><strong>' + m.title + '</strong><br>' + m.desc + '</span></div>';
    }).join('');
    appendInfoCard(
      '📱',
      KB.app.name,
      KB.app.desc + '<br><br>' +
      '<strong>Learning Journey:</strong> ' + KB.app.webJourney + '<br>' +
      '<strong>App Path:</strong> ' + KB.app.journey + '<br><br>' +
      '<strong>Four Learning Modes:</strong><br>' + modes + '<br>' +
      '<strong>Free Trial:</strong> ' + KB.app.freeTrial,
      'Download on Google Play',
      KB.app.play,
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
    var ios = document.createElement('a');
    ios.className = 'ai-cta-btn';
    ios.href = KB.app.ios;
    ios.style.marginTop = '6px';
    ios.innerHTML = 'Download on App Store →';
    msgsEl.appendChild(ios);

    var featuresBtn = document.createElement('button');
    featuresBtn.className = 'ai-back-btn';
    featuresBtn.innerHTML = '✨ See App Features';
    featuresBtn.addEventListener('click', function () {
      featuresBtn.remove();
      showAppFeatures();
    });
    msgsEl.appendChild(featuresBtn);
    scrollIfNearBottom();
  }

  function showAppFeatures() {
    if (!window._aiReplaying) logEvent('showAppModes', {});
    var list = KB.app.features.map(function (f) { return '• ' + f; }).join('<br>');
    appendInfoCard(
      '✨',
      'EduVerse App Features',
      list + '<br><br><strong>Rewards:</strong> ' + KB.app.rewards,
      'Open App Page',
      'app.html',
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* CONTACT */
  function showContact() {
    if (!window._aiReplaying) logEvent('showContact', {});
    var card = document.createElement('div');
    card.className = 'ai-info-card';
    card.innerHTML =
      '<div class="ai-info-card-title"><span class="ai-icon">📞</span>Contact Us</div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">📍</span><span>' + KB.contact.address + '</span></div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">📱</span><a href="tel:+918547577007">' + KB.contact.phone + '</a></div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">💬</span><a href="https://wa.me/918547935616">' + KB.contact.whatsapp + '</a></div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">✉️</span><a href="mailto:' + KB.contact.email + '">' + KB.contact.email + '</a></div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">🕐</span><span>' + KB.contact.hours + '</span></div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">🗺️</span><a href="' + KB.contact.maps + '" target="_blank" rel="noopener noreferrer">View on Google Maps</a></div>';
    msgsEl.appendChild(card);

    var ctaRow = document.createElement('div');
    ctaRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;';
    ctaRow.innerHTML =
      '<a class="ai-cta-btn" href="https://wa.me/918547935616">💬 WhatsApp Us</a>' +
      '<a class="ai-cta-btn" href="contact.html">📝 Contact Form</a>';
    msgsEl.appendChild(ctaRow);

    var back = document.createElement('button');
    back.className = 'ai-back-btn';
    back.innerHTML = '← Back';
    back.addEventListener('click', function () {
      card.remove(); ctaRow.remove(); back.remove();
      appendBot('What else can I help you with?');
      showMainMenu();
    });
    msgsEl.appendChild(back);
    scrollIfNearBottom();
  }

  /* FAQ */
  function showFAQ() {
    if (!window._aiReplaying) logEvent('showFAQ', {});
    appendBot('Here are our most frequently asked questions. Select one:');
    var chips = KB.faq.map(function (f) {
      return {
        label: f.q,
        action: function () {
          if (!window._aiReplaying) logEvent('showFAQAnswer', { answer: f.a });
          appendBot(f.a);
          appendBot('Do you have another question?');
          showFAQ();
        }
      };
    });
    chips.push({ label: '🏠 Main Menu', action: function () { appendBot('Back to main menu:'); showMainMenu(); } });
    appendChips(chips, null);
  }

  /* COMPANY */
  function showCompany() {
    if (!window._aiReplaying) logEvent('showCompany', {});
    var approach = KB.company.approach.map(function (a) { return '✅ ' + a; }).join('<br>');
    appendInfoCard(
      '🏫',
      COMPANY_NAME,
      '<strong>' + KB.company.tagline + '</strong><br><br>' +
      KB.company.description + '<br><br>' +
      '<strong>Established:</strong> ' + KB.company.established + ' · <strong>Brand:</strong> ' + KB.company.brand + '<br>' +
      '<strong>Head Office:</strong> Vaikom, Kottayam, Kerala<br><br>' +
      '<strong>Objective:</strong> ' + KB.company.objective + '<br><br>' +
      '<strong>Academic Approach:</strong><br>' + approach + '<br><br>' +
      KB.company.philosophy,
      'Learn More About Us',
      'about.html',
      function () { appendBot('What else would you like to know?'); showMainMenu(); }
    );
    appendEnquiryPrompt();
  }

  /* ACHIEVEMENTS */
  function showAchievements() {
    if (!window._aiReplaying) logEvent('showAchievements', {});
    var stats = KB.company.stats.map(function (s) { return '🏆 ' + s; }).join('<br>');
    appendInfoCard(
      '🏆',
      'Our Results & Achievements',
      '<strong>Website claims:</strong><br>' + stats + '<br><br>' +
      '<strong>Institutional Profile (North Paravur):</strong><br>' +
      KB.company.profileStats.map(function (p) { return '📋 ' + p; }).join('<br>') + '<br>' +
      '📋 ' + KB.company.ulsad + '<br><br>' +
      'Aashirwad describes a strong and consistent record in Jawahar Navodaya Vidyalaya admissions - including a rare achievement where three children from the same family secured Navodaya admission through the Selection Test.<br><br>' +
      '<div style="font-size:11.5px;color:var(--ai-muted);">Achievement figures come from different supplied materials and are shown with their source wording. For the institution\'s latest exact rank count, please refer to the current official website or contact Aashirwad directly.</div>',
      'See Rank Holders',
      'index.html#toppersSection',
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* JOURNEY */
  function showJourney() {
    if (!window._aiReplaying) logEvent('showJourney', {});
    var steps = KB.company.journey.map(function (j) {
      return '<div class="ai-contact-row"><span class="ai-contact-icon">' + j.year + '</span><span>' + j.text + '</span></div>';
    }).join('');
    appendInfoCard(
      '📜',
      'Our Institutional Journey',
      steps,
      'About Us',
      'about.html',
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* VISION & MISSION */
  function showVision() {
    if (!window._aiReplaying) logEvent('showVision', {});
    appendInfoCard(
      '🌟',
      'Vision & Mission',
      '<strong>Vision:</strong><br>' + KB.company.vision + '<br><br>' +
      '<strong>Mission:</strong><br>' + KB.company.mission + '<br><br>' +
      '<strong>Educational Philosophy:</strong><br>' + KB.company.philosophy,
      'Read More',
      'about.html',
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* KTET GUARANTEE */
  function showGuarantee() {
    if (!window._aiReplaying) logEvent('showGuarantee', {});
    appendInfoCard(
      '🛡️',
      KB.guarantee.title,
      KB.guarantee.body + '<br><br><div style="font-size:11.5px;color:var(--ai-muted);">This guarantee applies to eligible candidates who complete the prescribed training. It is not an unconditional money-back or qualification guarantee.</div>',
      'View About Page',
      'about.html',
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* WHY CHOOSE US */
  function showWhyChooseUs() {
    if (!window._aiReplaying) logEvent('showWhyChooseUs', {});
    appendInfoCard(
      '⭐',
      'Why Choose Aashirwad?',
      KB.company.strengths.map(function (st) { return '✅ ' + st; }).join('<br>') +
      '<br><br><div style="font-size:11.5px;color:var(--ai-muted);">Institutional strengths summarised from the supplied website and institutional materials.</div>',
      null, null, null
    );
    setTimeout(function () {
      appendBot('Ready to take the next step? Feel free to reach out!');
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;';
      row.innerHTML =
        '<a class="ai-cta-btn" href="contact.html">📝 Enquire Now</a>' +
        '<a class="ai-cta-btn" href="https://wa.me/918547935616">💬 WhatsApp Us</a>' +
        '<a class="ai-cta-btn" href="courses.html">📚 View Courses</a>';
      msgsEl.appendChild(row);
      var back = document.createElement('button');
      back.className = 'ai-back-btn';
      back.innerHTML = '← Back to Menu';
      back.addEventListener('click', function () { row.remove(); back.remove(); appendBot('What else can I help you with?'); showMainMenu(); });
      msgsEl.appendChild(back);
      scrollIfNearBottom();
    }, 400);
  }

  /* PRICE / FEES */
  function showPrice() {
    if (!window._aiReplaying) logEvent('showPrice', {});
    var rows = KB.courses.map(function (c) {
      return '<div class="ai-contact-row"><span class="ai-contact-icon">' + c.icon + '</span><span><strong>' + c.title + '</strong> — ' + c.price + ' <span style="text-decoration:line-through;color:var(--ai-muted);">' + c.original + '</span> (' + c.discount + ')</span></div>';
    }).join('');
    appendInfoCard(
      '💰',
      'Course Fees (as displayed on our website)',
      rows + '<br><div style="font-size:11.5px;color:var(--ai-muted);">These are the values currently displayed on the Courses page and may change. Please confirm the latest fees with Aashirwad before enrolment.</div>',
      'Visit Courses Page',
      'courses.html',
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* ADMISSION */
  function showAdmission() {
    if (!window._aiReplaying) logEvent('showAdmission', {});
    appendInfoCard(
      '📝',
      'Admissions & Enquiries',
      'The supplied website does not provide a universal admission procedure, fixed admission deadline, batch timetable or seat availability - these details can change.<br><br>' +
      '<strong>How to get in touch:</strong><br>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">📱</span><a href="tel:+918547577007">' + KB.contact.phone + '</a> — Call the helpline</div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">💬</span><a href="https://wa.me/918547935616">' + KB.contact.whatsapp + '</a> — WhatsApp</div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">✉️</span><a href="mailto:' + KB.contact.email + '">' + KB.contact.email + '</a></div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">📝</span>Use the website contact form for course-specific enquiries.</div>',
      'Contact Us',
      'contact.html',
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* SOCIAL */
  function showSocial() {
    if (!window._aiReplaying) logEvent('showSocial', {});
    appendInfoCard(
      '🔗',
      'Our Official Social Media',
      '<div class="ai-contact-row"><span class="ai-contact-icon">📘</span><a href="' + KB.contact.facebook + '" target="_blank" rel="noopener noreferrer">Facebook</a></div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">📸</span><a href="' + KB.contact.instagram + '" target="_blank" rel="noopener noreferrer">Instagram</a></div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">▶️</span><a href="' + KB.contact.youtube + '" target="_blank" rel="noopener noreferrer">YouTube</a></div>',
      null, null,
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* LANGUAGE */
  function showLanguage() {
    if (!window._aiReplaying) logEvent('showLanguage', {});
    appendInfoCard(
      '🗣️',
      'Languages',
      'The institution communicates in <strong>English</strong> and <strong>Malayalam</strong>.<br><br>' +
      'Aashirwad also offers language training programmes in: German · Arabic · Malayalam · Sanskrit · Japanese · Hindi · English.<br><br>' +
      'Availability of language training varies by centre - please contact Aashirwad to confirm.',
      'Contact Us',
      'contact.html',
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* OTHER / FALLBACK */
  function showOther() {
    appendBot('I\'d be happy to help! Let me connect you with the right information. Here\'s what I can assist with:');
    showMainMenu();
  }

  /* SELF INTRODUCTION */
  function showSelfIntro() {
    if (!window._aiReplaying) logEvent('showSelfIntro', {});
    appendInfoCard(
      '🤖',
      'Hi, I\'m the Aashirwad Assistant!',
      'I\'m a virtual assistant built specifically for <strong>' + COMPANY_NAME + '</strong> (Aashirwad EduVerse) - an educational institution established in 2009 in Vaikom, Kottayam, Kerala.<br><br>' +
      'I\'m here to help you with:<br>' +
      '📚 Exploring our courses and fees<br>' +
      '📍 Learning about our centres<br>' +
      '📱 The Aashirwad EduVerse app<br>' +
      '🏆 Our achievements and journey<br>' +
      '📞 Getting in touch with our team<br>' +
      '❓ Answering your questions instantly<br><br>' +
      'I\'m not just a chatbot - I\'m your first step toward your preparation! 🎯',
      null, null, null
    );
    setTimeout(function () {
      appendBot('What would you like to know about us?');
      showMainMenu();
    }, 400);
  }

  /* GET MORE DETAILS / ENQUIRE */
  function showGetDetails() {
    if (!window._aiReplaying) logEvent('showGetDetails', {});
    appendBot('Absolutely! Our team would love to share more details with you. Here\'s how you can reach us or send an enquiry:');
    var card = document.createElement('div');
    card.className = 'ai-info-card';
    card.innerHTML =
      '<div class="ai-info-card-title"><span class="ai-icon">📋</span>Request More Details</div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">📱</span><a href="tel:+918547577007">' + KB.contact.phone + '</a> — Helpline</div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">💬</span><a href="https://wa.me/918547935616">' + KB.contact.whatsapp + '</a> — WhatsApp</div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">✉️</span><a href="mailto:' + KB.contact.email + '">' + KB.contact.email + '</a></div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">📝</span><a href="contact.html">Use the website contact form</a></div>';
    msgsEl.appendChild(card);

    var btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;';
    btnRow.innerHTML =
      '<a class="ai-cta-btn" href="contact.html">📝 Send an Enquiry</a>' +
      '<a class="ai-cta-btn" href="https://wa.me/918547935616">💬 WhatsApp Us</a>';
    msgsEl.appendChild(btnRow);

    var back = document.createElement('button');
    back.className = 'ai-back-btn';
    back.innerHTML = '← Back to Menu';
    back.addEventListener('click', function () {
      card.remove(); btnRow.remove(); back.remove();
      appendBot('What else can I help you with?');
      showMainMenu();
    });
    msgsEl.appendChild(back);
    scrollIfNearBottom();
  }

  /* OFFLINE TRAINING + CENTRES */
  function showOffline() {
    if (!window._aiReplaying) logEvent('showOffline', {});
    appendBot('Yes! Aashirwad provides comprehensive <strong>offline classroom training</strong> in addition to its digital learning platform - a blended approach.');
    showCentres();
  }

  /* EXAM AREAS (wider institutional profile) */
  function showExamAreas() {
    if (!window._aiReplaying) logEvent('showExamAreas', {});
    var rows = KB.examAreas.map(function (e) {
      return '<div class="ai-contact-row"><span class="ai-contact-icon">🎯</span><span><strong>' + e.group + '</strong><br>' + e.items + '</span></div>';
    }).join('');
    var courseTitles = KB.courses.map(function (c) { return c.title; }).join(' · ');
    appendInfoCard(
      '🎯',
      'Competitive Examination & Training Areas',
      rows + '<br><br><strong>Course Cards on the Website:</strong><br>' + courseTitles + '<br><br>' +
      '<div style="font-size:11.5px;color:var(--ai-muted);">' + KB.examAreasNote + '</div>',
      'See Course Cards',
      'courses.html',
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* CSNP */
  function showCSNP() {
    if (!window._aiReplaying) logEvent('showCSNP', {});
    var focus = KB.csnp.focus.map(function (f) { return '✅ ' + f; }).join('<br>');
    appendInfoCard(
      '🇮🇳',
      KB.csnp.title,
      '<strong>Introduced:</strong> ' + KB.csnp.year + '<br><br>' +
      KB.csnp.purpose + '<br><br>' +
      '<strong>Programme Focus:</strong><br>' + focus + '<br><br>' +
      '<strong>Classes:</strong> ' + KB.csnp.classes,
      'Learn More',
      'about.html',
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* PUBLICATIONS / RANK FILE */
  function showPublications() {
    if (!window._aiReplaying) logEvent('showPublications', {});
    var examples = KB.publications.examples.map(function (e) { return '📚 ' + e; }).join('<br>');
    var digital = KB.publications.digital.map(function (d) { return '• ' + d; }).join('<br>');
    appendInfoCard(
      '📚',
      KB.publications.title,
      KB.publications.body + '<br><br>' +
      '<strong>Examples:</strong><br>' + examples + '<br><br>' +
      '<strong>Digital Learning Ecosystem:</strong><br>' + digital + '<br><br>' +
      '<strong>Purpose:</strong> ' + KB.publications.purpose,
      'Learn More',
      'about.html',
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* PRIVACY */
  function showPrivacy() {
    if (!window._aiReplaying) logEvent('showPrivacy', {});
    var collects = KB.privacy.collects.map(function (c) { return '• ' + c; }).join('<br>');
    var purposes = KB.privacy.purposes.map(function (p2) { return '• ' + p2; }).join('<br>');
    appendInfoCard(
      '🔒',
      'Privacy & Data Handling',
      'Privacy Policy dated: <strong>' + KB.privacy.dated + '</strong><br><br>' +
      '<strong>Information that may be collected:</strong><br>' + collects + '<br><br>' +
      '<strong>Purposes include:</strong><br>' + purposes + '<br><br>' +
      KB.privacy.noSell + '<br><br>' +
      '<div style="font-size:11.5px;color:var(--ai-muted);">For the full policy and any legal questions, please read the official Privacy Policy.</div>',
      'Read Full Privacy Policy',
      KB.privacy.url,
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* OFFICIAL LINKS */
  function showLinks() {
    if (!window._aiReplaying) logEvent('showLinks', {});
    var linkRows = [
      { label: '🌐 Official Website', url: KB.links.website },
      { label: '🏫 About Us',        url: KB.links.about },
      { label: '📚 Courses',          url: KB.links.courses },
      { label: '📱 EduVerse App',     url: KB.links.app },
      { label: '📞 Contact',          url: KB.links.contact },
      { label: '🔒 Privacy Policy',   url: KB.links.privacy },
      { label: '▶️ Google Play',      url: KB.links.play },
      { label: '🍎 App Store',        url: KB.links.ios }
    ].map(function (l) {
      return '<div class="ai-contact-row"><span class="ai-contact-icon">🔗</span><span><a href="' + l.url + '" target="_blank" rel="noopener noreferrer">' + l.label + '</a></span></div>';
    }).join('');
    appendInfoCard(
      '🔗',
      'Official Links',
      linkRows,
      null, null,
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* ACADEMIC APPROACH */
  function showApproach() {
    if (!window._aiReplaying) logEvent('showApproach', {});
    var approach = KB.company.approach.map(function (a) { return '✅ ' + a; }).join('<br>');
    var support = KB.company.learningSupport.map(function (l) { return '• ' + l; }).join('<br>');
    appendInfoCard(
      '🎓',
      'Our Academic Approach',
      KB.company.objective + '<br><br>' +
      '<strong>Academic Approach:</strong><br>' + approach + '<br><br>' +
      '<strong>Learning Approach Combines:</strong><br>' + support + '<br><br>' +
      KB.company.philosophy,
      'Learn More',
      'about.html',
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* APP LEARNING MODES */
  function showAppModes() {
    if (!window._aiReplaying) logEvent('showAppModes', {});
    var modes = KB.app.modes.map(function (m) {
      return '<div class="ai-contact-row"><span class="ai-contact-icon">🎧</span><span><strong>' + m.title + '</strong><br>' + m.desc + '</span></div>';
    }).join('');
    appendInfoCard(
      '🎧',
      'EduVerse Learning Modes',
      modes + '<br><br><strong>App Path:</strong> ' + KB.app.journey + '<br><br><strong>Free Trial:</strong> ' + KB.app.freeTrial,
      'Open App Page',
      'app.html',
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* NAVODAYA DETAIL */
  function showNavodayaDetail() {
    if (!window._aiReplaying) logEvent('showNavodayaDetail', {});
    appendInfoCard(
      '🏫',
      'Jawahar Navodaya Vidyalaya (JNVST)',
      'Navodaya Entrance / JNVST preparation is part of Aashirwad\'s institutional training areas.<br><br>' +
      'The institution describes a strong and consistent record in Jawahar Navodaya Vidyalaya admissions.<br><br>' +
      'The Institutional Profile highlights an unusual achievement: <strong>three children from the same family secured admission to Jawahar Navodaya Vidyalayas through the Navodaya Selection Test</strong> — identified as a rare achievement in the history of the examination.<br><br>' +
      '<div style="font-size:11.5px;color:var(--ai-muted);">Aashirwad does not publish a specific total number of Navodaya selections, so we do not state one here. For the latest figures, please contact Aashirwad.</div>',
      'Contact Us',
      'contact.html',
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* ── LOCAL INTENT ROUTER — every KB topic reachable without the API ── */
  function localIntent(lower) {
    /* Typo forgiveness - normalise common misspellings before matching.
       Reassigns the local `lower` copy only; the caller text is untouched. */
    lower = lower
      .replace(/cources?/g, 'courses')
      .replace(/corses?/g, 'courses')
      .replace(/eduverce/g, 'eduverse')
      .replace(/institue/g, 'institute')
      .replace(/centars?/g, 'centres')
      .replace(/admis+(ion|sions)/g, 'admission')
      .replace(/guaranted/g, 'guaranteed')
      .replace(/succes\b/g, 'success')
      .replace(/rankfile/g, 'rank file')
      .replace(/privacypolicy/g, 'privacy policy')
      .replace(/\bteh\b/g, 'the')
      .replace(/\byo?ur\b/g, 'your');

    /* Order matters: most specific patterns first */
    if (/\b(ktet\s+(guarantee|success)|success\s+guarantee|money\s+back|money-back|refund)\b/.test(lower)) return 'guarantee';
    if (/\b(fees?|cost|price|charges?|how\s+much|rate|payment|afford|expensive|cheap|budget)\b/.test(lower)) return 'price';
    if (/\b(csnp|civil\s+service\s+nurture|nurture\s+programme|nurture\s+program)\b/.test(lower)) return 'csnp';
    if (/\b(rank\s*files?|publications?|aashirwad\s+rank|english\s+rank\s+file|mathematics\s+rank\s+file|maths\s+rank\s+file)\b/.test(lower)) return 'publications';
    if (/\b(privacy|personal\s+data|data\s+(protection|policy|collection|handling)|gdpr|my\s+data|collect\s+(my|your)\s+data|data\s+sell)\b/.test(lower)) return 'privacy';
    if (/\b(official\s+(links?|website)|website\s+(url|link)|google\s+play\s+(link|url)|app\s+store\s+(link|url)|apple\s+app\s+store|download\s+(link|url)|important\s+links?)\b/.test(lower)) return 'links';
    if (/\b(approach|methodology|how\s+do\s+(you|aashirwad)\s+(teach|train)|teaching\s+(method|approach)|learning\s+approach|how\s+is\s+the\s+training|conceptual\s+clarity|systematic\s+preparation|academic\s+approach)\b/.test(lower)) return 'approach';
    if (/\b(learning\s+modes?|reading\s+mode|writing\s+mode|audio\s+mode|video\s+mode|four\s+learning\s+modes?)\b/.test(lower)) return 'app_modes';
    if (/\b(syllabus\s+tree|mock\s+(tests?|exams?)|live\s+(contests?|tests?|mock)|current\s+affairs|game\s+zone|reward\s+points?|leaderboard|progress\s+tracking|offline\s+study\s+materials?|realtime\s+notifications?|real-time\s+notifications?|keyword\s+search|quizzes|test\s+series|previous\s+year|app\s+features?|features?\s+of\s+the\s+app)\b/.test(lower)) return 'app_features';
    if (/\b(navodaya|jnv|jnvst|vidyalaya)\b/.test(lower)) return 'navodaya';
    if (/\b(offline\s+(centres?|centers?|branch|branches|institutes?)|centres?|centers?|branches|locations?|where\s+(all\s+)?(do|does|is|are)\s+you\s+(have|located|based)|which\s+(places|cities|districts|areas)|vaikom|pallikkathodu|ettumanoor|thrippunithura|north\s+paravur)\b/.test(lower)) return 'centres';
    if (/\b(offline\s+(classes|training|coaching|institute)|classroom\s+training|physical\s+(class|classes|institute)|offline\s+coaching)\b/.test(lower)) return 'offline';
    if (/\b(sports?|martial\s+arts?|wellness|physical\s+fitness|fitness\s+training|sports\s+training|sports\s+coaching|martial\s+arts?\s+training|wellness\s+training|physical\s+education|chess|roller\s+skating|kung\s+fu|karate|yoga|meditation|meditat)\b/.test(lower)) return 'sports';
    if (/\b(which\s+exams?|exams?\s+(do|does)\s+you\s+(coach|provide|offer|train)|exam\s+areas?|competitive\s+exams?|ssc\b|merchant\s+navy|imu[-\s]?cet|nmms|lss\b|uss\b|lpst|upst|hst\b|typewriting|tuition|chess|roller\s+skating|kung\s+fu|karate|yoga|meditation|language\s+training|german|arabic|sanskrit|japanese|sports?|martial\s+arts?|wellness)\b/.test(lower)) return 'exam_areas';
    if (/\b(vision|mission|philosophy|goal|objective|what\s+do\s+you\s+(aim|believe)|educational\s+philosophy)\b/.test(lower)) return 'vision';
    if (/\b(achievement|achievements|results?|ranks?|first\s+rank|success\s+rate|toppers?|record|15,?000|500\+|23\s+first|28\s+first|state\s+rank|ulsad|uthaman|16\+?\s*years|successful\s+students)\b/.test(lower)) return 'achievements';
    if (/\b(journey|history|timeline|milestones?|when\s+(was|were)\s+(aashirwad|it|this)\s+(established|founded|started)|since\s+(when|2009)|established\s+(in|on)|founded)\b/.test(lower)) return 'journey';
    if (/\b(why\s+(choose|aashirwad|you|should\s+i)|what\s+makes\s+(you|aashirwad)|best\s+(coaching|institute|academy|psc)|reliable|trust\s+you|difference|unique|strengths?|why\s+not\s+others|why\s+this)\b/.test(lower)) return 'why_us';
    if (/\b(admission|admissions?|enrol|enroll|how\s+to\s+(join|apply|enrol|register)|batch|seat|deadline|registration|apply\s+for|admission\s+process)\b/.test(lower)) return 'admission';
    if (/\b(languages?|malayalam|english|german|arabic|sanskrit|japanese|hindi|which\s+languages?|what\s+languages?|language\s+of\s+(instruction|teaching|medium))\b/.test(lower)) return 'language';
    if (/\b(social\s+media|facebook|instagram|youtube|follow\s+(you|us)|official\s+(facebook|instagram|youtube)|social\s+profiles?)\b/.test(lower)) return 'social';
    if (/\b(eduverse|mobile\s+app|android|iphone|ios|download\s+(the\s+)?app|the\s+app|app\s+details?)\b/.test(lower)) return 'app';
    if (/\b(job|jobs|employment|placement|placed|get\s+a\s+job|get\s+job|will\s+i\s+(get|be)\s+(a\s+)?(job|selected|chosen|posted)|selected\s+for|guarantee\s+(a\s+)?(job|success|selection)|salary|post\s+after|guaranteed\s+job|do\s+i\s+get\s+a\s+job)\b/.test(lower)) return 'job';
    if (/\b(do\s+you\s+(provide|offer|have|coach|train)|is\s+there|are\s+there)\s+(a\s+|any\s+|the\s+)?(ktet|ctet|psc|police|women\s+police|ldc|lgs|secretariat|civil\s+service|degree|navodaya|ssc|merchant\s+navy|typewriting|tuition)\b/.test(lower)) return 'courses';
    if (/\b(ktet|ctet|psc|police|women\s+police|ldc|lgs|secretariat|civil\s+service|degree\s+level)\s+(coaching|training|course|class|preparation|program)\b/.test(lower)) return 'courses';
    if (/\b(courses?|cources?|corses?|programmes?\s+offered|which\s+course|list\s+of\s+courses|course\s+(list|details|page)|course\s+cards?|courses\s+you\s+(provide|offer|have)|what\s+are\s+the\s+courses)\b/.test(lower)) return 'courses';
    if (/\b(training\s+areas?|programs?|programmes?|what\s+(do|does)\s+you\s+(teach|offer|provide|train)|subjects?|tuition\s+programmes?|typewriting\s+training)\b/.test(lower)) return 'programs';
    if (/\b(contact|phone|call|email|whatsapp|address|office\s+hours?|helpline|map|reach\s+(you|us)|get\s+in\s+touch|number|where\s+is\s+your\s+office|head\s+office|where\s+(is|are)\s+(aashirwad|you|this)\s+(located|based))\b/.test(lower)) return 'contact';
    if (/\b(about|institution|institute|who\s+(are|is)\s+aashirwad|overview|ecosystem)\b/.test(lower)) return 'company';
    if (/\b(faq|frequently|questions?|how\s+does\s+(it|this)\s+work)\b/.test(lower)) return 'faq';
    if (/\b(hi+|hello|hey|namaste|good morning|good afternoon|good evening)\b/.test(lower) && lower.length < 30) return 'greeting';
    return null;
  }

  /* ── SHARED INTENT ROUTER (used by local + AI paths) ── */
  function routeIntent(intent) {
    switch (intent) {
      case 'courses':
        appendBot('Great! Let me walk you through our courses:');
        logEvent('showCoursesMenu', {});
        showCoursesMenu();
        break;
      case 'programs':    logEvent('showPrograms', {});    showPrograms(); break;
      case 'centres':     logEvent('showCentres', {});     showCentres(); break;
      case 'offline':     logEvent('showOffline', {});     showOffline(); break;
      case 'exam_areas':  logEvent('showExamAreas', {});   showExamAreas(); break;
      case 'csnp':        logEvent('showCSNP', {});        showCSNP(); break;
      case 'publications':logEvent('showPublications', {});showPublications(); break;
      case 'privacy':     logEvent('showPrivacy', {});     showPrivacy(); break;
      case 'links':       logEvent('showLinks', {});       showLinks(); break;
      case 'approach':    logEvent('showApproach', {});    showApproach(); break;
      case 'app':         logEvent('showApp', {});         showApp(); break;
      case 'app_features':logEvent('showAppFeatures', {}); showAppFeatures(); break;
      case 'app_modes':   logEvent('showAppModes', {});    showAppModes(); break;
      case 'navodaya':    logEvent('showNavodayaDetail', {}); showNavodayaDetail(); break;
      case 'sports':      logEvent('showSportsTraining', {});  showSportsTraining(); break;
      case 'job':         logEvent('showJobReality', {});     showJobReality(); break;
      case 'contact':     logEvent('showContact', {});     showContact(); break;
      case 'social':      logEvent('showSocial', {});      showSocial(); break;
      case 'faq':         logEvent('showFAQ', {});         showFAQ(); break;
      case 'company':     logEvent('showCompany', {});     showCompany(); break;
      case 'achievements':logEvent('showAchievements', {});showAchievements(); break;
      case 'journey':     logEvent('showJourney', {});     showJourney(); break;
      case 'vision':      logEvent('showVision', {});      showVision(); break;
      case 'guarantee':   logEvent('showGuarantee', {});   showGuarantee(); break;
      case 'why_us':      logEvent('showWhyChooseUs', {}); showWhyChooseUs(); break;
      case 'price':       logEvent('showPrice', {});       showPrice(); break;
      case 'admission':   logEvent('showAdmission', {});   showAdmission(); break;
      case 'language':    logEvent('showLanguage', {});    showLanguage(); break;
      case 'greeting':
        var greetHtml = getGreeting() + '! 😊 Wonderful to have you here. I\'m your Aashirwad virtual assistant - ready to help you explore courses, centres, the EduVerse app, and anything about us. What can I do for you?';
        appendBot(greetHtml); logEvent('greeting', { html: greetHtml }); showMainMenu();
        break;
      case 'self':        logEvent('showSelfIntro', {});   showSelfIntro(); break;
      case 'get_details': logEvent('showGetDetails', {});  showGetDetails(); break;
      case 'off_topic':   logEvent('showOffTopic', {});    showOffTopic(); break;
      default:
        showContactFallback();
        appendBot('Here\'s what I can assist with:');
        showMainMenu();
        break;
    }
  }

  /* JOB / PLACEMENT OUTCOME — KB rule: never promise jobs, ranks or exam success */
  function showJobReality() {
    if (!window._aiReplaying) logEvent('showJobReality', {});
    appendInfoCard(
      '💼',
      'Jobs, Placement & Exam Success',
      'This is an important question, and I want to give you an honest answer rather than a sales pitch.<br><br>' +
      '<strong>What Aashirwad provides:</strong><br>' +
      '• Expert coaching and structured training for competitive examinations such as Kerala PSC, KTET, CTET, Police exams and Civil Services<br>' +
      '• Comprehensive study materials, mock tests, regular assessments and personalised mentoring<br>' +
      '• A proven institutional record — 23 PSC first ranks, 500+ ranks achieved and 15,000+ students guided (figures as displayed on our website)<br><br>' +
      '<strong>What no coaching institute can do:</strong><br>' +
      'Government and competitive examinations are selection-based, not course-completion-based. A candidate must clear the written examination, physical tests (where applicable) and interview conducted by the recruiting authority. <strong>No educational institution can guarantee a job, a rank or examination success</strong> — that depends on each candidate\'s preparation, performance and the competition in that particular exam cycle.<br><br>' +
      '<strong>What this means for you:</strong><br>Joining a PSC course at Aashirwad gives you the training, materials and guidance to prepare seriously — it does not guarantee employment. What it does guarantee is that you will not prepare alone.<br><br>' +
      '<div style="font-size:11.5px;color:var(--ai-muted);">As per our policy, Aashirwad does not promise admission, rank, job placement or examination success. Our role is to prepare you thoroughly for the examination process.</div>',
      'View PSC Courses',
      'courses.html',
      function () { appendBot('Would you like to know about the PSC courses, fees or how to get started?'); showMainMenu(); }
    );
  }

  /* SPORTS, MARTIAL ARTS & WELLNESS TRAINING */
  function showSportsTraining() {
    if (!window._aiReplaying) logEvent('showSportsTraining', {});
    var activities = [
      { name: 'Chess',         desc: 'Chess training to develop strategic thinking, concentration and analytical skills.' },
      { name: 'Roller Skating', desc: 'Roller skating training for balance, coordination and physical fitness.' },
      { name: 'Kung Fu',       desc: 'Kung Fu training combining martial arts discipline, self-defence and physical fitness.' },
      { name: 'Karate',        desc: 'Karate training focusing on discipline, self-defence, strength and confidence.' },
      { name: 'Yoga',          desc: 'Yoga training for flexibility, mental focus, stress relief and overall wellness.' },
      { name: 'Meditation',    desc: 'Meditation practice for mental clarity, concentration and inner calm.' }
    ];
    var rows = activities.map(function (a) {
      return '<div class="ai-contact-row"><span class="ai-contact-icon">🏅</span><span><strong>' + a.name + '</strong><br>' + a.desc + '</span></div>';
    }).join('');
    appendInfoCard(
      '🏅',
      'Sports, Martial Arts & Wellness Training',
      'Aashirwad provides training in the following sports, martial arts and wellness activities:<br><br>' + rows + '<br>' +
      '<div style="font-size:11.5px;color:var(--ai-muted);">Availability of these activities may vary by centre. Please confirm with Aashirwad for details at your nearest centre.</div>',
      'Contact Us',
      'contact.html',
      function () { appendBot('What else can I help you with?'); showMainMenu(); }
    );
  }

  /* CONTACT FALLBACK - used when the question is outside the knowledge base */
  function showContactFallback() {
    appendBot('For more details, please contact <strong>Aashirwad Institute of Teachers</strong> using the direct contact details provided below.');
    var card = document.createElement('div');
    card.className = 'ai-info-card';
    card.innerHTML =
      '<div class="ai-info-card-title"><span class="ai-icon">📞</span>Get in Touch</div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">📱</span><a href="tel:+918547577007">+91 85475 77007</a> — Helpline</div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">💬</span><a href="https://wa.me/918547935616">+91 85479 35616</a> — WhatsApp</div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">✉️</span><a href="mailto:info@aitacademyindia.com">info@aitacademyindia.com</a></div>' +
      '<div class="ai-contact-row"><span class="ai-contact-icon">📝</span><a href="contact.html">Use the website contact form</a></div>';
    msgsEl.appendChild(card);

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;';
    row.innerHTML =
      '<a class="ai-cta-btn" href="tel:+918547577007">📞 Call Helpline</a>' +
      '<a class="ai-cta-btn" href="https://wa.me/918547935616">💬 WhatsApp Us</a>' +
      '<a class="ai-cta-btn" href="contact.html">📝 Contact Form</a>';
    msgsEl.appendChild(row);
    scrollIfNearBottom();
  }

  /* OFF TOPIC */
  function showOffTopic() {
    if (!window._aiReplaying) logEvent('showOffTopic', {});
    appendBot('That detail is not part of my current knowledge base.');
    showContactFallback();
    appendBot('Here\'s what I can assist with:');
    showMainMenu();
  }

  /* ENQUIRY PROMPT */
  function appendEnquiryPrompt() {
    setTimeout(function () {
      appendBot('Would you like to take the next step? You can request details by filling our <strong>contact form</strong> - our team will get back to you promptly.');
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';
      row.innerHTML =
        '<a class="ai-cta-btn" href="contact.html">📝 Fill Enquiry Form</a>' +
        '<a class="ai-cta-btn" href="https://wa.me/918547935616">💬 WhatsApp Us</a>';
      msgsEl.appendChild(row);
      var moreBtn = document.createElement('button');
      moreBtn.className = 'ai-back-btn';
      moreBtn.innerHTML = '← Explore More';
      moreBtn.addEventListener('click', function () { row.remove(); moreBtn.remove(); appendBot('What else would you like to know?'); showMainMenu(); });
      msgsEl.appendChild(moreBtn);
      scrollIfNearBottom();
    }, 500);
  }

  /* AI INTENT DETECTION (minimal tokens) */
  function detectIntent(userText) {
    return fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 10,
        temperature: 0,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userText.trim().slice(0, 200) }
        ]
      })
    }).then(function (res) {
      if (!res.ok) throw new Error('API error');
      return res.json();
    }).then(function (data) {
      var raw = ((((data.choices && data.choices[0] && data.choices[0].message) || {}).content) || 'other').toLowerCase();
      var label = raw.replace(/[^a-z_]/g, '').trim();
      var valid = ['courses','programs','centres','offline','exam_areas','sports','csnp','publications','privacy','links','approach','app','app_features','app_modes','navodaya','job','contact','faq','company','achievements','journey','vision','guarantee','why_us','price','admission','language','social','off_topic','greeting','self','get_details','other'];
      var matched = null;
      for (var i = 0; i < valid.length; i++) {
        var v = valid[i];
        if (label === v || label.indexOf(v) === 0 || v.indexOf(label) === 0) { matched = v; break; }
      }
      return matched || 'other';
    }).catch(function () {
      return 'other';
    });
  }

  /* SEND HANDLER */
  function handleSend() {
    if (!input || isLoading) return;
    var text = input.value.trim();
    if (!text) return;

    input.value = '';
    autoResize();
    appendUser(text);
    window._aiNewTurn = true;

    var lower = text.toLowerCase();

    /* Local handlers - zero API cost */
    if (/\b(thank|thanks|thank you|ok|okay|bye|goodbye|see you|cheers)\b/.test(lower)) {
      var thanksHtml = 'You\'re most welcome! 🙏 It was a pleasure assisting you. Feel free to reach out anytime - we\'re always here to help. Have a wonderful day!';
      appendBot(thanksHtml);
      logEvent('thankYou', { html: thanksHtml });
      return;
    }
    if (/\b(who are you|what are you|what'?s?\s+your\s+name|your\s+name|are you a bot|introduce yourself|what can you do|tell me about yourself|tell me about you)\b/.test(lower)) {
      logEvent('userMsg', { text: text }); logEvent('showSelfIntro', {}); showSelfIntro(); return;
    }
    if (/\b(hi+|hello|hey|namaste|good morning|good afternoon|good evening)\b/.test(lower) && lower.length < 30) {
      var greetHtml = getGreeting() + '! 😊 Wonderful to have you here. I\'m your Aashirwad virtual assistant - ready to help you explore courses, centres, the EduVerse app, and anything about us. What can I do for you?';
      logEvent('userMsg', { text: text }); logEvent('greeting', { html: greetHtml });
      appendBot(greetHtml); showMainMenu(); return;
    }
    if (/\b(ktet guarantee|success guarantee|money back|money-back)\b/.test(lower)) {
      logEvent('userMsg', { text: text }); logEvent('showGuarantee', {}); showGuarantee(); return;
    }
    if (/\b(navodaya|jnv|jnvst|vidyalaya)\b/.test(lower)) {
      logEvent('userMsg', { text: text });
      logEvent('showNavodayaDetail', {});
      showNavodayaDetail(); return;
    }
    if (/\b(north paravur|paravur)\b/.test(lower)) {
      logEvent('userMsg', { text: text });
      appendBot('Yes. The Institutional Profile states that the <strong>North Paravur Centre started in 2026</strong> and extends Aashirwad\'s academic activities into North Paravur and neighbouring areas.<br><br>It is intended to provide structured training, academic guidance, competitive examination preparation, eligibility test preparation and scholarship examination preparation.<br><br>Here are all our centres:');
      showCentres(); return;
    }
    if (/\b(free trial|trial)\b/.test(lower)) {
      logEvent('userMsg', { text: text });
      appendBot('Yes! The Aashirwad EduVerse app provides a <strong>2-day free trial</strong> of premium features - including the Reading, Writing, Audio and Video learning modes.<br><br>Would you like to learn more about the app?');
      showApp(); return;
    }
    if (/\b(online|offline|both)\b/.test(lower) && /\b(coach|training|class|study|learn|app|eduverse)\b/.test(lower)) {
      logEvent('userMsg', { text: text });
      if (/\b(centres?|centers?|branches|locations?|where)\b/.test(lower)) {
        logEvent('showCentres', {}); showCentres(); return;
      }
      appendBot('Aashirwad combines both! The institution offers:<br><br>📱 <strong>Digital learning</strong> through the Aashirwad EduVerse app<br>🏫 <strong>Offline classroom training</strong> with structured academic guidance and direct mentoring.<br><br>It\'s a blended learning approach - not online-only.<br><br>Would you like to know more about the app or our centres?');
      showMainMenu(); return;
    }


    /* Course fee / price questions - local, zero API cost */
    if (/\b(fees?|cost|price|charges?|how much|rate|payment|afford|expensive|cheap|budget)\b/.test(lower)) {
      logEvent('userMsg', { text: text });
      /* If a specific course is named, show that course's card (includes its fee) */
      var courseFeeMap = [
        { id: 'women-police',     re: /women\s*police/ },
        { id: 'police-constable', re: /police\s*constable|constable/ },
        { id: 'lgs',              re: /\blgs\b|lower\s*grade/ },
        { id: 'ldc',              re: /\bldc\b|lower\s*division|clerk/ },
        { id: 'degree-level',     re: /degree\s*level|\bdegree\b/ },
        { id: 'secretariat',      re: /secretariat/ },
        { id: 'ktet',             re: /\bktet\b/ },
        { id: 'ctet',             re: /\bctet\b/ },
        { id: 'civil-service',    re: /civil\s*service/ }
      ];
      var feeMatch = null;
      for (var fi = 0; fi < courseFeeMap.length; fi++) {
        if (courseFeeMap[fi].re.test(lower)) {
          feeMatch = KB.courses.filter(function (c) { return c.id === courseFeeMap[fi].id; })[0];
          break;
        }
      }
      if (feeMatch) {
        logEvent('showCourseDetail', { id: feeMatch.id });
        showCourseDetail(feeMatch);
      } else {
        logEvent('showPrice', {});
        showPrice();
      }
      return;
    }

    /* Local keyword router — covers every KB topic without the API */
    var li = localIntent(lower);
    if (li) {
      logEvent('userMsg', { text: text });
      routeIntent(li);
      return;
    }

    /* AI intent detection */
    logEvent('userMsg', { text: text });
    isLoading = true;
    sendBtn.disabled = true;
    appendTyping();

    detectIntent(text).then(function (intent) {
      removeTyping();
      isLoading = false;
      sendBtn.disabled = false;

      /* If the AI says unknown/off-topic, retry the local router before falling back */
      if (intent === 'other' || intent === 'off_topic') {
        var li2 = localIntent(lower);
        if (li2) { routeIntent(li2); return; }
      }
      routeIntent(intent);
    });
  }

  /* INPUT */
  function autoResize() {
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  }

  /* CACHE HELPERS */
  function cacheMessage(msg) {
    var msgs = loadCache();
    msgs.push(msg);
    saveCache(msgs.slice(-50));
  }

  /* UTILS */
  function isNearBottom(threshold) {
    if (threshold === undefined) threshold = 80;
    return msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight <= threshold;
  }
  function scrollToElement(el) {
    requestAnimationFrame(function () {
      var containerTop = msgsEl.getBoundingClientRect().top;
      var elTop = el.getBoundingClientRect().top;
      var offset = elTop - containerTop - 16;
      msgsEl.scrollTop = msgsEl.scrollTop + offset;
    });
  }
  function scrollIfNearBottom() {
    requestAnimationFrame(function () {
      var threshold = 80;
      var distanceFromBottom = msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight;
      if (distanceFromBottom <= threshold) {
        msgsEl.scrollTop = msgsEl.scrollHeight;
      }
    });
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* INIT ON DOM READY */
  function init() {
    injectStyles();
    injectWindow();
    cacheDom();
    if (!win) return;

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });
    input.addEventListener('input', autoResize);
    closeBtn.addEventListener('click', closeChat);
    newChatBtn.addEventListener('click', function () {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(SESSION_KEY);
      msgsEl.innerHTML = '';
      navStack = [];
      initChat();
    });

    /* Event delegation: the frame-animation widget may not exist yet
       (chatbot-widget.js loads async after the splash), so listen on
       document and check the target lazily. */
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('#chatbotWidget')) {
        if (isOpen) closeChat(); else openChat();
      }
    });
    document.addEventListener('keydown', function (e) {
      var trig = getTrigger();
      if (!trig) return;
      if (e.target !== trig) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isOpen) closeChat(); else openChat();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
