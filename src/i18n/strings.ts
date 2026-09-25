import type { Lang } from './types'

/**
 * UI chrome. Ventilator-panel terms (Tidal volume, PEEP, Cycle-off, Ppeak,
 * VC-AC, Pmus, ...) stay English in both languages on purpose: they are the
 * labels on the real machine. Only surrounding prose is translated.
 */
const en = {
  app: {
    tagline: 'Ventilator settings & patient–ventilator dyssynchrony',
    langLabel: 'Language',
  },
  nav: {
    learn: 'Learn',
    sandbox: 'Sandbox',
    dyssynchrony: 'Dyssynchrony',
    challenges: 'Challenges',
    session: 'Session',
    about: 'About',
  },
  vent: {
    panelTitle: 'Ventilator settings',
    mode: 'Mode',
    setRate: 'Set rate',
    sensitivity: 'Sensitivity',
    modeDesc: {
      'VC-AC': 'Volume Assist-Control — you set the tidal volume and flow; pressure is what results.',
      'PC-AC': 'Pressure Assist-Control — you set inspiratory pressure and time; volume is what results.',
      PSV: 'Pressure Support — every breath is patient-triggered and flow-cycled. Needs patient effort.',
      CPAP: 'Spontaneous/CPAP — constant airway pressure, no inspiratory boost. Needs patient effort.',
    },
    hint: {
      inspFlow: 'Low flow vs. a hungry patient → flow starvation.',
      flowPattern: 'Decelerating lowers Ppeak and lengthens Ti for the same Vt.',
      pauseTime: 'Holds the breath with no flow so a true Pplat can be read.',
      pInsp: 'Above PEEP. Drives tidal volume with compliance.',
      cycleOff: '% of peak flow at which inspiration ends.',
      sensitivity: 'Too insensitive → missed efforts. Too sensitive → auto-triggering.',
    },
  },
  patient: {
    panelTitle: 'Patient / lung',
    lungPhenotype: 'Lung phenotype',
    patientEffort: 'Patient effort',
    breathing: 'Breathing',
    passive: 'Passive',
    effortStrength: 'Effort strength',
    patientRate: 'Patient rate',
    coupling: 'Coupling',
    independent: 'Independent',
    reverse: 'Reverse',
    hint: {
      amplitude: 'Peak inspiratory muscle pressure (Pmus).',
      rate: 'Neural drive; mismatch with set rate drives asynchrony.',
      neuralTi: 'Long neural Ti vs short vent Ti → double triggering.',
    },
  },
  playback: {
    pause: 'Pause',
    play: 'Play',
    reset: 'Reset',
    showPmus: 'Show Pmus (effort)',
  },
  learn: {
    fundamentals: 'Fundamentals',
    tryThis: 'Try this',
    tryHint:
      'Press a “Try this” button in the lesson to load a scenario into the live waveforms, then explore with the Sandbox controls.',
  },
  dys: {
    mechanism: 'Mechanism',
    recognise: 'Recognise it',
    fix: 'Fix it',
    liveHint: 'The scenario is loaded live. Adjust the controls and watch the waveforms respond — then head to Challenges to be tested.',
    category: {
      trigger: 'Trigger asynchrony',
      flow: 'Flow asynchrony',
      cycle: 'Cycle asynchrony',
      reverse: 'Reverse triggering',
    },
  },
  challenge: {
    label: 'Challenge',
    briefLabel: 'Bedside brief:',
    briefText: 'This patient’s waveforms look wrong. Diagnose the problem, then adjust the ventilator to resolve it.',
    step1: 'Step 1 · What are you looking at?',
    step2: 'Step 2 · Resolve the asynchrony',
    correct: 'Correct — now resolve it using the controls.',
    notQuite: (title: string) => `Not quite. This is ${title.toLowerCase()}. Read the mechanism, then fix it.`,
    fixIt: 'Fix it →',
    resolved: 'Resolved',
    notResolved: 'Not resolved yet',
    notResolvedHint: 'Use the ventilator and patient controls to correct the problem. This panel updates live.',
    showHint: 'Show a hint',
  },
  session: {
    lobbyTitle: 'Run a session across two devices',
    lobbyIntro:
      'One person drives the patient, the other drives the ventilator. The instructor changes compliance, resistance, effort and the monitor; the learner sees only the waveforms, the telemetry and the vital signs, and has to work out what to do.',
    startInstructor: 'Start as instructor',
    joinLearner: 'Join as learner',
    codeLabel: 'Session code',
    join: 'Join',
    connecting: 'Connecting…',
    leave: 'Leave session',
    instructor: 'Instructor',
    learner: 'Learner',
    shareCode: 'Have the learner open the Session tab and enter this code',
    waitingLearner: 'Waiting for the learner to join…',
    learnerConnected: 'Learner connected',
    learnerAway: 'Learner not connected',
    instructorConnected: 'Instructor connected',
    instructorAway: 'Instructor not connected',
    monitorTitle: 'Monitor',
    vitalsTitle: 'Vital signs',
    ventSummaryTitle: 'Learner’s ventilator',
    instructorHint:
      'Change the patient and the monitor. The learner sees the consequences on their own waveforms — they never see these numbers.',
    learnerHint:
      'The instructor is changing this patient. Read the waveforms, the telemetry and the monitor, then set the ventilator.',
    phaseNote: 'Your tracing runs on the learner’s settings, so it matches in shape but not in timing. The telemetry above is measured on their machine.',
    abgTitle: 'Arterial blood gas',
    requestAbg: 'Request ABG',
    abgPending: 'ABG requested — waiting for the result…',
    abgNone: 'No blood gas yet. Ask for one whenever you want it.',
    abgRequested: 'Learner has asked for a gas',
    release: 'Release to learner',
    estimate: 'Estimate from MV',
    estimateHint:
      'Fills PaCO₂ from the learner’s minute ventilation and pH from Henderson–Hasselbalch. An estimate only — adjust it before releasing.',
    releasedAt: 'Released',
    errNotFound: 'No session with that code. Check it and try again.',
    errConnect: 'Could not connect. Check the internet connection and try again.',
    setupTitle: 'Session sync is not configured',
    setupText:
      'Linking two devices needs a Firebase Realtime Database. Set the four VITE_FIREBASE_* environment variables (see the Session section of the README) and reload. Everything else in the app works without it.',
  },
  refs: {
    defaultTitle: 'Evidence & further reading',
    fullLibrary: 'Full reference library (from Zotero)',
  },
  about: {
    title: 'About VentTeach',
    intro:
      'An interactive teaching tool for basic ventilator settings and patient–ventilator dyssynchrony, designed for medical students, nurses, and residents.',
    disclaimerTitle: '⚠️ Educational use only',
    disclaimer:
      'The waveforms are generated by a simplified single-compartment lung model for teaching. It reproduces the qualitative behaviour of real ventilator tracings but is not a validated clinical device and must not be used for patient care decisions.',
    howTitle: 'How it works',
    howText:
      'Every breath is computed in real time from the respiratory equation of motion, with adjustable compliance, resistance, and patient effort (Pmus). Because the physics is explicit, dyssynchronies are not drawn in by hand — they emerge from timing mismatches between the patient and the ventilator, exactly as they do at the bedside. That means you can not only see each asynchrony but change a setting and watch it resolve.',
    teachTitle: 'How to teach with it',
    teachItems: [
      'Learn — work through the six fundamentals; each has a "Try this" button that loads a scenario into the live waveforms.',
      'Sandbox — free play with every setting; ideal for demonstrating a concept live in a lecture or on rounds.',
      'Dyssynchrony — six annotated asynchronies with mechanism, recognition, and fixes you can apply live.',
      'Challenges — learners identify the asynchrony and then resolve it; the app checks their fix.',
      'Session — two devices joined by a code: you drive the patient and the monitor while a learner drives the ventilator and sees only what they would see at the bedside.',
    ],
    teachNote:
      'The design follows evidence for simulation-based ventilation education and flipped-classroom ICU teaching, and manages cognitive load by revealing controls progressively rather than all at once (see references below).',
    footer: 'Built as an open teaching resource. References curated from the educator’s Zotero library.',
    langNote:
      'Available in English and Thai. In the Thai text, ventilator and physiology terms are kept in English because they are the labels printed on the machine at the bedside.',
  },
}

export type UIStrings = typeof en

const th: UIStrings = {
  app: {
    tagline: 'การตั้งค่า ventilator และ patient–ventilator dyssynchrony',
    langLabel: 'ภาษา',
  },
  nav: {
    learn: 'บทเรียน',
    sandbox: 'ทดลอง',
    dyssynchrony: 'Dyssynchrony',
    challenges: 'แบบฝึกหัด',
    session: 'เซสชัน',
    about: 'เกี่ยวกับ',
  },
  vent: {
    panelTitle: 'การตั้งค่า ventilator',
    mode: 'Mode',
    setRate: 'Set rate',
    sensitivity: 'Sensitivity',
    modeDesc: {
      'VC-AC': 'Volume Assist-Control — คุณตั้ง tidal volume และ flow ส่วน pressure เป็นผลที่ตามมา',
      'PC-AC': 'Pressure Assist-Control — คุณตั้ง inspiratory pressure และ inspiratory time ส่วน volume เป็นผลที่ตามมา',
      PSV: 'Pressure Support — ทุก breath ถูก trigger โดยผู้ป่วยและ cycle ด้วย flow จำเป็นต้องมี effort จากผู้ป่วย',
      CPAP: 'Spontaneous/CPAP — ความดันในทางเดินหายใจคงที่ ไม่มีแรงช่วยในช่วง inspiration จำเป็นต้องมี effort จากผู้ป่วย',
    },
    hint: {
      inspFlow: 'Flow ต่ำเกินไปเมื่อเทียบกับความต้องการของผู้ป่วย → flow starvation',
      flowPattern: 'Decelerating ทำให้ Ppeak ต่ำลงและ Ti ยาวขึ้นที่ Vt เท่าเดิม',
      pauseTime: 'หยุดค้างโดยไม่มี flow เพื่อให้อ่านค่า Pplat ที่แท้จริงได้',
      pInsp: 'วัดเหนือ PEEP ทำงานร่วมกับ compliance ในการกำหนด tidal volume',
      cycleOff: '% ของ peak flow ที่ทำให้ inspiration สิ้นสุดลง',
      sensitivity: 'ไวน้อยเกินไป → พลาด effort ของผู้ป่วย ไวมากเกินไป → auto-triggering',
    },
  },
  patient: {
    panelTitle: 'ผู้ป่วย / ปอด',
    lungPhenotype: 'ลักษณะปอด',
    patientEffort: 'Patient effort',
    breathing: 'หายใจเอง',
    passive: 'Passive',
    effortStrength: 'ความแรงของ effort',
    patientRate: 'อัตราหายใจของผู้ป่วย',
    coupling: 'Coupling',
    independent: 'Independent',
    reverse: 'Reverse',
    hint: {
      amplitude: 'ความดันสูงสุดจากกล้ามเนื้อหายใจเข้า (Pmus)',
      rate: 'Neural drive ถ้าไม่ตรงกับ set rate จะทำให้เกิด asynchrony',
      neuralTi: 'Neural Ti ยาวกว่า inspiratory time ของเครื่อง → double triggering',
    },
  },
  playback: {
    pause: 'หยุด',
    play: 'เล่น',
    reset: 'เริ่มใหม่',
    showPmus: 'แสดง Pmus (effort)',
  },
  learn: {
    fundamentals: 'พื้นฐาน',
    tryThis: 'ลองดู',
    tryHint:
      'กดปุ่ม “ลองดู” ในบทเรียนเพื่อโหลดสถานการณ์นั้นเข้าสู่ waveform จริง แล้วปรับค่าต่อได้ด้วย controls ในหน้าทดลอง',
  },
  dys: {
    mechanism: 'กลไก',
    recognise: 'สังเกตอย่างไร',
    fix: 'แก้ไขอย่างไร',
    liveHint: 'สถานการณ์นี้กำลังทำงานอยู่จริง ลองปรับ controls แล้วดูว่า waveform เปลี่ยนอย่างไร จากนั้นไปทดสอบตัวเองที่หน้าแบบฝึกหัด',
    category: {
      trigger: 'Trigger asynchrony',
      flow: 'Flow asynchrony',
      cycle: 'Cycle asynchrony',
      reverse: 'Reverse triggering',
    },
  },
  challenge: {
    label: 'โจทย์',
    briefLabel: 'สรุปข้างเตียง:',
    briefText: 'Waveform ของผู้ป่วยรายนี้ดูผิดปกติ จงวินิจฉัยปัญหา แล้วปรับ ventilator เพื่อแก้ไข',
    step1: 'ขั้นที่ 1 · คุณกำลังดูอะไรอยู่?',
    step2: 'ขั้นที่ 2 · แก้ไข asynchrony นี้',
    correct: 'ถูกต้อง — ตอนนี้ลองแก้ไขด้วย controls',
    notQuite: (title: string) => `ยังไม่ใช่ ภาวะนี้คือ ${title} ลองอ่านกลไกก่อน แล้วจึงแก้ไข`,
    fixIt: 'ไปแก้ไข →',
    resolved: 'แก้ไขสำเร็จ',
    notResolved: 'ยังแก้ไขไม่สำเร็จ',
    notResolvedHint: 'ใช้ controls ของ ventilator และผู้ป่วยเพื่อแก้ปัญหา แผงนี้จะอัปเดตแบบเรียลไทม์',
    showHint: 'ดูคำใบ้',
  },
  session: {
    lobbyTitle: 'เปิดเซสชันร่วมกันสองเครื่อง',
    lobbyIntro:
      'คนหนึ่งเป็นผู้คุมผู้ป่วย อีกคนเป็นผู้ตั้งเครื่อง ผู้สอนปรับ compliance, resistance, effort และ vital signs ส่วนผู้เรียนเห็นเพียง waveform, ค่าที่วัดได้ และ vital signs แล้วต้องคิดเองว่าจะทำอะไรต่อ',
    startInstructor: 'เริ่มในบทบาทผู้สอน',
    joinLearner: 'เข้าร่วมในบทบาทผู้เรียน',
    codeLabel: 'รหัสเซสชัน',
    join: 'เข้าร่วม',
    connecting: 'กำลังเชื่อมต่อ…',
    leave: 'ออกจากเซสชัน',
    instructor: 'ผู้สอน',
    learner: 'ผู้เรียน',
    shareCode: 'ให้ผู้เรียนเปิดแท็บเซสชันแล้วกรอกรหัสนี้',
    waitingLearner: 'รอผู้เรียนเข้าร่วม…',
    learnerConnected: 'ผู้เรียนเชื่อมต่อแล้ว',
    learnerAway: 'ผู้เรียนยังไม่ได้เชื่อมต่อ',
    instructorConnected: 'ผู้สอนเชื่อมต่อแล้ว',
    instructorAway: 'ผู้สอนยังไม่ได้เชื่อมต่อ',
    monitorTitle: 'Monitor',
    vitalsTitle: 'Vital signs',
    ventSummaryTitle: 'การตั้งเครื่องของผู้เรียน',
    instructorHint:
      'ปรับผู้ป่วยและ vital signs ได้ตามต้องการ ผู้เรียนจะเห็นผลที่เกิดขึ้นบน waveform ของตนเอง แต่จะไม่เห็นตัวเลขเหล่านี้',
    learnerHint:
      'ผู้สอนกำลังปรับผู้ป่วยรายนี้ ให้อ่าน waveform ค่าที่วัดได้ และ vital signs แล้วจึงตั้งค่า ventilator',
    phaseNote: 'Waveform ของคุณใช้ค่าที่ผู้เรียนตั้งไว้ รูปร่างจึงตรงกันแต่จังหวะเวลาไม่ตรงกัน ค่าที่วัดได้ด้านบนมาจากเครื่องของผู้เรียนจริง',
    abgTitle: 'Arterial blood gas',
    requestAbg: 'ขอผล ABG',
    abgPending: 'ขอผล ABG แล้ว — กำลังรอผล…',
    abgNone: 'ยังไม่มีผลเลือด ขอได้เมื่อต้องการ',
    abgRequested: 'ผู้เรียนขอผลเลือดแล้ว',
    release: 'ส่งผลให้ผู้เรียน',
    estimate: 'ประมาณจาก MV',
    estimateHint:
      'เติม PaCO₂ จาก minute ventilation ของผู้เรียน และคำนวณ pH ด้วย Henderson–Hasselbalch เป็นเพียงค่าประมาณ ควรปรับก่อนส่งผล',
    releasedAt: 'ส่งผลเมื่อ',
    errNotFound: 'ไม่พบเซสชันที่ใช้รหัสนี้ กรุณาตรวจสอบแล้วลองอีกครั้ง',
    errConnect: 'เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง',
    setupTitle: 'ยังไม่ได้ตั้งค่าการเชื่อมต่อเซสชัน',
    setupText:
      'การเชื่อมสองเครื่องต้องใช้ Firebase Realtime Database กรุณาตั้งค่า environment variables ทั้งสี่ตัว (VITE_FIREBASE_*) ตามที่อธิบายไว้ในส่วน Session ของ README แล้วโหลดหน้าใหม่ ส่วนอื่นของแอปใช้งานได้ปกติโดยไม่ต้องตั้งค่านี้',
  },
  refs: {
    defaultTitle: 'หลักฐานอ้างอิงและอ่านเพิ่มเติม',
    fullLibrary: 'รายการอ้างอิงทั้งหมด (จาก Zotero)',
  },
  about: {
    title: 'เกี่ยวกับ VentTeach',
    intro:
      'เครื่องมือสอนแบบโต้ตอบเรื่องการตั้งค่า ventilator พื้นฐาน และ patient–ventilator dyssynchrony ออกแบบสำหรับนิสิตแพทย์ พยาบาล และแพทย์ประจำบ้าน',
    disclaimerTitle: '⚠️ ใช้เพื่อการศึกษาเท่านั้น',
    disclaimer:
      'Waveform ทั้งหมดสร้างจากแบบจำลองปอดแบบ single-compartment อย่างง่ายเพื่อการสอน แม้จะให้พฤติกรรมเชิงคุณภาพเหมือน waveform จากเครื่องจริง แต่ไม่ใช่เครื่องมือทางคลินิกที่ผ่านการตรวจสอบ และต้องไม่นำไปใช้ตัดสินใจในการดูแลผู้ป่วย',
    howTitle: 'ทำงานอย่างไร',
    howText:
      'ทุก breath ถูกคำนวณแบบเรียลไทม์จาก equation of motion ของระบบหายใจ โดยปรับ compliance, resistance และ effort ของผู้ป่วย (Pmus) ได้ เนื่องจากใช้ฟิสิกส์จริง dyssynchrony จึงไม่ได้ถูกวาดขึ้นมา แต่เกิดขึ้นเองจากความไม่สอดคล้องของจังหวะระหว่างผู้ป่วยกับเครื่อง เหมือนที่เกิดข้างเตียงจริง คุณจึงไม่เพียงเห็น asynchrony แต่ยังปรับค่าแล้วเฝ้าดูมันหายไปได้',
    teachTitle: 'ใช้สอนอย่างไร',
    teachItems: [
      'บทเรียน — เรียนพื้นฐานทั้งหกบท แต่ละบทมีปุ่ม “ลองดู” ที่โหลดสถานการณ์เข้าสู่ waveform จริง',
      'ทดลอง — ปรับได้ทุกค่าอย่างอิสระ เหมาะกับการสาธิตแนวคิดสดในห้องบรรยายหรือขณะ round',
      'Dyssynchrony — asynchrony หกแบบพร้อมกลไก วิธีสังเกต และวิธีแก้ที่ลงมือปรับได้ทันที',
      'แบบฝึกหัด — ผู้เรียนวินิจฉัย asynchrony แล้วแก้ไข โดยแอปจะตรวจคำตอบให้',
      'เซสชัน — เชื่อมสองเครื่องด้วยรหัส ผู้สอนคุมผู้ป่วยและ vital signs ส่วนผู้เรียนตั้งเครื่องและเห็นเฉพาะสิ่งที่จะเห็นได้จริงข้างเตียง',
    ],
    teachNote:
      'การออกแบบอิงหลักฐานด้านการสอน ventilation ด้วย simulation และการสอน ICU แบบ flipped classroom พร้อมจัดการ cognitive load ด้วยการค่อย ๆ เปิด controls แทนที่จะแสดงทั้งหมดพร้อมกัน (ดูรายการอ้างอิงด้านล่าง)',
    footer: 'สร้างขึ้นเป็นสื่อการสอนแบบเปิด รายการอ้างอิงคัดเลือกจากคลัง Zotero ของผู้สอน',
    langNote:
      'มีทั้งภาษาอังกฤษและภาษาไทย ในฉบับภาษาไทย ศัพท์ทาง ventilator และสรีรวิทยาคงไว้เป็นภาษาอังกฤษ เพราะเป็นคำที่ปรากฏบนหน้าจอเครื่องจริงข้างเตียง',
  },
}

export const strings: Record<Lang, UIStrings> = { en, th }
