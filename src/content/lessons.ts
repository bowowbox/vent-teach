import type { SimSettings, VentSettings, LungParams, EffortParams } from '../engine/types'
import { defaultSettings } from '../engine/presets'
import type { LS } from '../i18n/types'

export type Block =
  | { t: 'p'; text: LS }
  | { t: 'h'; text: LS }
  | { t: 'list'; items: LS[] }
  | { t: 'callout'; tone: 'key' | 'safety' | 'tip'; text: LS }
  | { t: 'try'; label: LS; note: LS; settings: SimSettings }

export interface Lesson {
  id: string
  title: LS
  subtitle: LS
  blocks: Block[]
  refIds: string[]
}

function make(base: {
  vent?: Partial<VentSettings>
  lung?: Partial<LungParams>
  effort?: Partial<EffortParams>
}): SimSettings {
  return {
    vent: { ...defaultSettings.vent, ...(base.vent ?? {}) },
    lung: { ...defaultSettings.lung, ...(base.lung ?? {}) },
    effort: { ...defaultSettings.effort, ...(base.effort ?? {}) },
  }
}

export const lessons: Lesson[] = [
  {
    id: 'anatomy',
    title: { en: '1 · Anatomy of a breath', th: '1 · กายวิภาคของ breath หนึ่งครั้ง' },
    subtitle: {
      en: 'The three waveforms every ventilator shows you',
      th: 'Waveform สามเส้นที่ ventilator ทุกเครื่องแสดงให้คุณเห็น',
    },
    blocks: [
      {
        t: 'p',
        text: {
          en: 'Every mechanical breath can be read from three scalar waveforms plotted against time: pressure (in the airway), flow (gas moving in and out), and volume (what has entered the lungs). Learn to read these three and you can understand almost everything a ventilator is doing.',
          th: 'ทุก mechanical breath สามารถอ่านได้จาก scalar waveform สามเส้นที่ plot เทียบกับเวลา ได้แก่ pressure (ในทางเดินหายใจ), flow (อากาศที่ไหลเข้าและออก) และ volume (ปริมาตรที่เข้าสู่ปอด) หากอ่านสามเส้นนี้เป็น คุณจะเข้าใจเกือบทุกอย่างที่ ventilator กำลังทำอยู่',
        },
      },
      { t: 'h', text: { en: 'Pressure', th: 'Pressure' } },
      {
        t: 'p',
        text: {
          en: 'Airway pressure rises during inspiration and returns toward the set PEEP (baseline pressure) during expiration. In volume modes the shape of the pressure curve is a result of the patient’s lung mechanics; in pressure modes you set the pressure and it stays roughly square.',
          th: 'Airway pressure จะสูงขึ้นระหว่าง inspiration และลดกลับเข้าหา PEEP ที่ตั้งไว้ (ความดันพื้นฐาน) ระหว่าง expiration ใน volume mode รูปร่างของ pressure curve เป็นผลจาก lung mechanics ของผู้ป่วย ส่วนใน pressure mode คุณเป็นผู้ตั้งค่า pressure รูปคลื่นจึงค่อนข้างเป็นสี่เหลี่ยม',
        },
      },
      { t: 'h', text: { en: 'Flow', th: 'Flow' } },
      {
        t: 'p',
        text: {
          en: 'Flow is positive when gas moves into the patient (inspiration) and negative during expiration. Inspiratory flow shape differs by mode — a square wave in volume control, a decelerating ramp in pressure control. Expiratory flow is passive and decays back toward zero.',
          th: 'Flow เป็นบวกเมื่ออากาศไหลเข้าสู่ผู้ป่วย (inspiration) และเป็นลบระหว่าง expiration รูปร่างของ inspiratory flow ต่างกันตาม mode — เป็น square wave ใน volume control และเป็น decelerating ramp ใน pressure control ส่วน expiratory flow เกิดขึ้นแบบ passive และค่อย ๆ ลดลงเข้าหาศูนย์',
        },
      },
      { t: 'h', text: { en: 'Volume', th: 'Volume' } },
      {
        t: 'p',
        text: {
          en: 'Volume is the integral of flow — it climbs to the tidal volume during inspiration and falls back to baseline as the patient exhales. If it does NOT return to baseline before the next breath, gas is being trapped.',
          th: 'Volume คือ integral ของ flow — จะไต่ขึ้นจนถึง tidal volume ระหว่าง inspiration แล้วลดกลับสู่ baseline เมื่อผู้ป่วยหายใจออก หากมัน "ไม่" กลับสู่ baseline ก่อน breath ถัดไป แสดงว่ากำลังเกิด gas trapping',
        },
      },
      {
        t: 'callout',
        tone: 'key',
        text: {
          en: 'Watch the flow trace return (or fail to return) to zero before the next breath — it is the single most useful habit for spotting gas trapping and, later, dyssynchrony.',
          th: 'ให้เฝ้าดูว่า flow กลับ (หรือไม่กลับ) สู่ศูนย์ก่อน breath ถัดไป — นี่คือนิสัยเดียวที่มีประโยชน์ที่สุดในการจับ gas trapping และต่อมาคือ dyssynchrony',
        },
      },
      {
        t: 'try',
        label: { en: 'Show me a normal breath', th: 'ขอดู breath ปกติ' },
        note: {
          en: 'Normal lungs, volume control, passive patient. Watch all three waveforms cycle cleanly.',
          th: 'ปอดปกติ, volume control, ผู้ป่วย passive ลองดู waveform ทั้งสามเส้นทำงานครบรอบอย่างสะอาด',
        },
        settings: make({ vent: { mode: 'VC-AC', rate: 14, tidalVolume: 420, inspFlow: 50, peep: 5 } }),
      },
    ],
    refIds: ['arnal2018', 'flynn2022'],
  },
  {
    id: 'modes',
    title: { en: '2 · Modes: what the ventilator controls', th: '2 · Mode: ventilator ควบคุมอะไร' },
    subtitle: {
      en: 'Volume vs. pressure — and who does the work',
      th: 'Volume กับ pressure — และใครเป็นคนออกแรง',
    },
    blocks: [
      {
        t: 'p',
        text: {
          en: 'A ventilator can only guarantee one thing at a time. In volume control you set the tidal volume and the pressure is whatever the lungs require. In pressure control you set the pressure and the tidal volume is whatever the lungs allow. This trade-off is the single most important idea in choosing a mode.',
          th: 'Ventilator รับประกันได้เพียงอย่างเดียวในแต่ละครั้ง ใน volume control คุณตั้ง tidal volume แล้ว pressure จะเป็นเท่าที่ปอดต้องการ ส่วนใน pressure control คุณตั้ง pressure แล้ว tidal volume จะเป็นเท่าที่ปอดยอมให้ การแลกเปลี่ยนนี้คือแนวคิดสำคัญที่สุดในการเลือก mode',
        },
      },
      { t: 'h', text: { en: 'Volume Assist-Control (VC-AC)', th: 'Volume Assist-Control (VC-AC)' } },
      {
        t: 'list',
        items: [
          { en: 'You set: tidal volume, flow, rate, PEEP, FiO₂.', th: 'คุณตั้ง: tidal volume, flow, rate, PEEP, FiO₂' },
          {
            en: 'Guaranteed: tidal volume (and therefore minute ventilation).',
            th: 'สิ่งที่รับประกัน: tidal volume (จึงรวมถึง minute ventilation ด้วย)',
          },
          {
            en: 'Watch: pressure can climb if the lung stiffens — a rising plateau pressure is your warning.',
            th: 'สิ่งที่ต้องเฝ้าดู: pressure อาจไต่สูงขึ้นถ้าปอดแข็งขึ้น — plateau pressure ที่สูงขึ้นคือสัญญาณเตือน',
          },
        ],
      },
      { t: 'h', text: { en: 'Pressure Assist-Control (PC-AC)', th: 'Pressure Assist-Control (PC-AC)' } },
      {
        t: 'list',
        items: [
          {
            en: 'You set: inspiratory pressure, inspiratory time, rate, PEEP, FiO₂.',
            th: 'คุณตั้ง: inspiratory pressure, inspiratory time, rate, PEEP, FiO₂',
          },
          { en: 'Guaranteed: peak pressure (protective by design).', th: 'สิ่งที่รับประกัน: peak pressure (ปกป้องปอดโดยการออกแบบ)' },
          {
            en: 'Watch: tidal volume falls if the lung stiffens — hypoventilation can sneak up on you.',
            th: 'สิ่งที่ต้องเฝ้าดู: tidal volume ลดลงถ้าปอดแข็งขึ้น — เกิด hypoventilation โดยไม่รู้ตัวได้',
          },
        ],
      },
      { t: 'h', text: { en: 'Pressure Support (PSV)', th: 'Pressure Support (PSV)' } },
      {
        t: 'p',
        text: {
          en: 'A purely spontaneous mode: every breath is triggered by the patient and the ventilator adds a set pressure boost, cycling to exhalation when flow falls. Used for weaning and comfort — but it needs a patient with reliable respiratory drive.',
          th: 'เป็น mode ที่ผู้ป่วยหายใจเองล้วน ๆ ทุก breath ถูก trigger โดยผู้ป่วย และเครื่องเติม pressure ช่วยตามที่ตั้งไว้ แล้ว cycle เข้าสู่ expiration เมื่อ flow ลดลง ใช้สำหรับ weaning และเพิ่มความสบาย — แต่ต้องการผู้ป่วยที่มี respiratory drive สม่ำเสมอ',
        },
      },
      {
        t: 'callout',
        tone: 'tip',
        text: {
          en: 'In the simulator, switch a stiff (ARDS) lung between VC-AC and PC-AC without changing anything else, and watch what "gives" — the pressure in volume control, or the tidal volume in pressure control.',
          th: 'ในเครื่องจำลอง ลองสลับปอดแข็ง (ARDS) ระหว่าง VC-AC กับ PC-AC โดยไม่เปลี่ยนค่าอื่นเลย แล้วดูว่าอะไรคือสิ่งที่ "ยอมเปลี่ยน" — pressure ใน volume control หรือ tidal volume ใน pressure control',
        },
      },
      {
        t: 'try',
        label: { en: 'Volume control, stiff lung', th: 'Volume control กับปอดแข็ง' },
        note: {
          en: 'ARDS lung in VC-AC. Note the high plateau pressure — the price of a guaranteed volume.',
          th: 'ปอด ARDS ใน VC-AC สังเกต plateau pressure ที่สูง — ราคาที่ต้องจ่ายเพื่อรับประกัน volume',
        },
        settings: make({ vent: { mode: 'VC-AC', tidalVolume: 420, inspFlow: 50, peep: 10 }, lung: { compliance: 30, resistance: 10, resistanceExp: 12 } }),
      },
      {
        t: 'try',
        label: { en: 'Pressure control, same lung', th: 'Pressure control กับปอดเดิม' },
        note: {
          en: 'Same ARDS lung in PC-AC at 15 cmH₂O. Note the smaller tidal volume — the price of a capped pressure.',
          th: 'ปอด ARDS เดิมใน PC-AC ที่ 15 cmH₂O สังเกต tidal volume ที่เล็กลง — ราคาที่ต้องจ่ายเพื่อจำกัด pressure',
        },
        settings: make({ vent: { mode: 'PC-AC', pInsp: 15, inspTime: 1.0, peep: 10 }, lung: { compliance: 30, resistance: 10, resistanceExp: 12 } }),
      },
    ],
    refIds: ['arnal2018', 'grasselli2023'],
  },
  {
    id: 'oxygenation',
    title: { en: '3 · Oxygenation: PEEP & FiO₂', th: '3 · Oxygenation: PEEP และ FiO₂' },
    subtitle: { en: 'The two knobs that set the oxygen', th: 'สองปุ่มที่กำหนดออกซิเจน' },
    blocks: [
      {
        t: 'p',
        text: {
          en: 'Oxygenation is driven mainly by two settings: the fraction of inspired oxygen (FiO₂) and positive end-expiratory pressure (PEEP). FiO₂ enriches the gas; PEEP keeps alveoli open at the end of expiration so they can keep participating in gas exchange.',
          th: 'Oxygenation ถูกกำหนดโดยการตั้งค่าสองอย่างเป็นหลัก ได้แก่ สัดส่วนออกซิเจนในอากาศที่หายใจเข้า (FiO₂) และ positive end-expiratory pressure (PEEP) โดย FiO₂ เพิ่มความเข้มข้นของออกซิเจน ส่วน PEEP ทำให้ alveoli เปิดค้างไว้เมื่อสิ้นสุด expiration จึงยังแลกเปลี่ยนก๊าซได้ต่อไป',
        },
      },
      { t: 'h', text: { en: 'PEEP', th: 'PEEP' } },
      {
        t: 'list',
        items: [
          {
            en: 'Recruits and stabilises collapsed alveoli, raising the surface area for oxygen exchange.',
            th: 'Recruit และทำให้ alveoli ที่แฟบอยู่คงตัว เพิ่มพื้นที่ผิวสำหรับแลกเปลี่ยนออกซิเจน',
          },
          {
            en: 'Too little: alveoli collapse and reopen with each breath (injurious).',
            th: 'น้อยเกินไป: alveoli แฟบแล้วเปิดใหม่ทุก breath (ทำให้ปอดบาดเจ็บ)',
          },
          {
            en: 'Too much: over-distension, higher plateau pressure, and haemodynamic compromise.',
            th: 'มากเกินไป: เกิด over-distension, plateau pressure สูงขึ้น และรบกวนระบบไหลเวียนโลหิต',
          },
        ],
      },
      {
        t: 'callout',
        tone: 'key',
        text: {
          en: 'PEEP and FiO₂ are titrated together to reach an oxygenation target while keeping pressures safe — this is the essence of an ARDS ventilation strategy.',
          th: 'PEEP และ FiO₂ ถูกปรับไปด้วยกันเพื่อให้ถึงเป้าหมาย oxygenation โดยยังคุม pressure ให้ปลอดภัย — นี่คือแก่นของกลยุทธ์ ventilation ใน ARDS',
        },
      },
      {
        t: 'try',
        label: { en: 'Raise PEEP on a stiff lung', th: 'เพิ่ม PEEP ในปอดแข็ง' },
        note: {
          en: 'ARDS lung. Increase PEEP with the control and watch the baseline pressure rise — clinically this is where recruitment happens.',
          th: 'ปอด ARDS ลองเพิ่ม PEEP ด้วย control แล้วดู baseline pressure สูงขึ้น — ในทางคลินิกนี่คือจุดที่เกิด recruitment',
        },
        settings: make({ vent: { mode: 'VC-AC', tidalVolume: 400, peep: 10, fio2: 0.6 }, lung: { compliance: 28, resistance: 10, resistanceExp: 12 } }),
      },
    ],
    refIds: ['sahetya2017', 'grieco2026', 'grasselli2023'],
  },
  {
    id: 'ventilation',
    title: { en: '4 · Ventilation: tidal volume & rate', th: '4 · Ventilation: tidal volume และ rate' },
    subtitle: { en: 'Clearing CO₂ — minute ventilation', th: 'การขับ CO₂ — minute ventilation' },
    blocks: [
      {
        t: 'p',
        text: {
          en: 'Carbon dioxide clearance depends on minute ventilation = tidal volume × respiratory rate. Raise either and you blow off more CO₂; lower either and CO₂ rises. But tidal volume and rate are not interchangeable — how you reach a given minute ventilation matters for lung safety.',
          th: 'การขับคาร์บอนไดออกไซด์ขึ้นกับ minute ventilation = tidal volume × respiratory rate เพิ่มค่าใดค่าหนึ่งก็ขับ CO₂ ได้มากขึ้น ลดค่าใดค่าหนึ่ง CO₂ ก็สูงขึ้น แต่ tidal volume กับ rate ใช้แทนกันไม่ได้ — วิธีที่คุณไปถึง minute ventilation ค่าหนึ่ง ๆ มีผลต่อความปลอดภัยของปอด',
        },
      },
      {
        t: 'list',
        items: [
          {
            en: 'Bigger tidal volumes clear CO₂ efficiently but stretch the lung (volutrauma).',
            th: 'Tidal volume ที่ใหญ่ขึ้นขับ CO₂ ได้ดี แต่ยืดปอดมากขึ้น (volutrauma)',
          },
          {
            en: 'Faster rates clear CO₂ too, but shorten expiratory time and can cause gas trapping.',
            th: 'Rate ที่เร็วขึ้นก็ขับ CO₂ ได้เช่นกัน แต่ทำให้ expiratory time สั้นลงและเกิด gas trapping ได้',
          },
          {
            en: 'Read the measured minute ventilation and total rate in the telemetry bar as you experiment.',
            th: 'อ่านค่า minute ventilation และ total rate ที่วัดได้จากแถบ telemetry ขณะทดลอง',
          },
        ],
      },
      {
        t: 'callout',
        tone: 'safety',
        text: {
          en: 'In obstructive lungs, chasing CO₂ with a high rate backfires — short expiratory time traps gas and raises auto-PEEP. Sometimes the answer is a LOWER rate.',
          th: 'ในปอดที่มีการอุดกั้น การไล่ตาม CO₂ ด้วย rate สูงจะย้อนกลับมาทำร้ายผู้ป่วย — expiratory time ที่สั้นทำให้เกิด gas trapping และ auto-PEEP สูงขึ้น บางครั้งคำตอบคือ rate ที่ "ต่ำลง"',
        },
      },
      {
        t: 'try',
        label: { en: 'Push the rate on a COPD lung', th: 'ลองเร่ง rate ในปอด COPD' },
        note: {
          en: 'Obstructive lung at rate 24. Watch expiratory flow fail to reach zero — that is gas trapping / auto-PEEP.',
          th: 'ปอดอุดกั้นที่ rate 24 สังเกตว่า expiratory flow ไม่กลับถึงศูนย์ — นั่นคือ gas trapping / auto-PEEP',
        },
        settings: make({ vent: { mode: 'VC-AC', rate: 24, tidalVolume: 450, inspFlow: 50, peep: 5 }, lung: { compliance: 60, resistance: 18, resistanceExp: 28 } }),
      },
    ],
    refIds: ['arnal2018'],
  },
  {
    id: 'lung-protective',
    title: { en: '5 · Lung-protective ventilation', th: '5 · Lung-protective ventilation' },
    subtitle: { en: 'Plateau pressure & driving pressure', th: 'Plateau pressure และ driving pressure' },
    blocks: [
      {
        t: 'p',
        text: {
          en: 'The lung is injured not just by oxygen but by the mechanical stress of ventilation. Lung-protective ventilation limits that stress: low tidal volumes (around 6 mL/kg predicted body weight), a plateau pressure under about 30 cmH₂O, and attention to driving pressure (plateau minus PEEP).',
          th: 'ปอดบาดเจ็บได้ไม่เพียงจากออกซิเจน แต่จากความเครียดเชิงกลของการช่วยหายใจด้วย Lung-protective ventilation คือการจำกัดความเครียดนั้น ได้แก่ ใช้ tidal volume ต่ำ (ราว 6 mL/kg ของ predicted body weight), คุม plateau pressure ให้ต่ำกว่าประมาณ 30 cmH₂O และใส่ใจ driving pressure (plateau ลบด้วย PEEP)',
        },
      },
      { t: 'h', text: { en: 'Plateau pressure', th: 'Plateau pressure' } },
      {
        t: 'p',
        text: {
          en: 'Plateau pressure is the pressure held in the alveoli during an inspiratory pause, with no flow — it reflects the elastic stress on the lung, unlike peak pressure which also includes airway resistance. The simulator estimates it for each breath in the telemetry bar.',
          th: 'Plateau pressure คือความดันที่ค้างอยู่ใน alveoli ระหว่าง inspiratory pause ซึ่งไม่มี flow — สะท้อนความเครียดเชิงยืดหยุ่นของปอด ต่างจาก peak pressure ที่รวมผลของ airway resistance ไว้ด้วย เครื่องจำลองประมาณค่านี้ให้ทุก breath ในแถบ telemetry',
        },
      },
      { t: 'h', text: { en: 'Driving pressure', th: 'Driving pressure' } },
      {
        t: 'p',
        text: {
          en: 'Driving pressure (plateau − PEEP) is tidal volume normalised to the patient’s compliance, and tracks with outcome in ARDS. Keeping it low (≈ ≤ 15 cmH₂O) is a practical bedside target.',
          th: 'Driving pressure (plateau − PEEP) คือ tidal volume ที่ปรับมาตรฐานด้วย compliance ของผู้ป่วย และสัมพันธ์กับผลลัพธ์การรักษาใน ARDS การคุมให้ต่ำ (ประมาณ ≤ 15 cmH₂O) เป็นเป้าหมายที่ใช้ได้จริงข้างเตียง',
        },
      },
      {
        t: 'callout',
        tone: 'safety',
        text: {
          en: 'If the plateau pressure climbs above 30 cmH₂O, it turns red in the telemetry bar. Lower the tidal volume before you chase anything else.',
          th: 'หาก plateau pressure ไต่เกิน 30 cmH₂O ค่าจะเปลี่ยนเป็นสีแดงในแถบ telemetry ให้ลด tidal volume ก่อนจะไปไล่แก้อย่างอื่น',
        },
      },
      {
        t: 'try',
        label: { en: 'Injurious vs. protective', th: 'ตั้งค่าที่ทำร้ายปอด เทียบกับที่ปกป้องปอด' },
        note: {
          en: 'Severe ARDS with a large 550 mL tidal volume. Note the high plateau, then lower tidal volume toward 6 mL/kg and watch it fall.',
          th: 'ARDS รุนแรงที่ใช้ tidal volume ใหญ่ถึง 550 mL สังเกต plateau ที่สูง แล้วลด tidal volume ลงเข้าหา 6 mL/kg และดูค่ามันลดลง',
        },
        settings: make({ vent: { mode: 'VC-AC', tidalVolume: 550, inspFlow: 50, peep: 12, fio2: 0.7 }, lung: { compliance: 22, resistance: 12, resistanceExp: 14 } }),
      },
    ],
    refIds: ['grasselli2023', 'matthay2024', 'sahetya2017'],
  },
  {
    id: 'triggering',
    title: { en: '6 · Triggering & cycling', th: '6 · Triggering และ cycling' },
    subtitle: {
      en: 'How the patient and ventilator hand off — the bridge to dyssynchrony',
      th: 'ผู้ป่วยกับ ventilator ส่งไม้ต่อกันอย่างไร — สะพานสู่ dyssynchrony',
    },
    blocks: [
      {
        t: 'p',
        text: {
          en: 'Once a patient is breathing with the ventilator instead of being fully controlled, every breath involves a negotiation. The patient triggers the breath (starts it), the ventilator delivers the target, and then the breath is cycled off (ended). When the timing of these hand-offs matches the patient, breathing feels effortless. When it does not, you get dyssynchrony.',
          th: 'เมื่อผู้ป่วยเริ่มหายใจร่วมกับเครื่องแทนที่จะถูกควบคุมทั้งหมด ทุก breath จะกลายเป็นการต่อรอง ผู้ป่วย trigger breath (เริ่มต้น) เครื่องส่งลมตามเป้าหมาย แล้ว breath จึงถูก cycle off (สิ้นสุด) เมื่อจังหวะของการส่งไม้ต่อเหล่านี้ตรงกับผู้ป่วย การหายใจจะรู้สึกไม่ต้องออกแรง แต่เมื่อไม่ตรงกัน ก็เกิด dyssynchrony',
        },
      },
      { t: 'h', text: { en: 'Trigger', th: 'Trigger' } },
      {
        t: 'p',
        text: {
          en: 'The ventilator senses a patient effort as a small drop in pressure or a small flow, and delivers a breath. Set the sensitivity too high and it triggers on noise (auto-triggering); too low and it misses genuine efforts.',
          th: 'Ventilator ตรวจจับ effort ของผู้ป่วยจากความดันที่ตกลงเล็กน้อยหรือ flow เล็ก ๆ แล้วจึงส่ง breath หากตั้ง sensitivity ไวเกินไป เครื่องจะ trigger ตามสัญญาณรบกวน (auto-triggering) หากไวน้อยเกินไป ก็จะพลาด effort จริงของผู้ป่วย',
        },
      },
      { t: 'h', text: { en: 'Cycle', th: 'Cycle' } },
      {
        t: 'p',
        text: {
          en: 'The breath ends by volume (VC), by time (PC), or by flow decay (PSV). If the ventilator’s inspiration is longer or shorter than the patient’s own neural breath, they fight — the origin of cycling asynchronies.',
          th: 'Breath สิ้นสุดด้วย volume (VC), ด้วยเวลา (PC) หรือด้วยการลดลงของ flow (PSV) หาก inspiration ของเครื่องยาวหรือสั้นกว่า neural breath ของผู้ป่วยเอง ทั้งสองจะขัดกัน — เป็นต้นกำเนิดของ cycling asynchrony',
        },
      },
      {
        t: 'callout',
        tone: 'tip',
        text: {
          en: 'Turn on "Patient effort" in the sandbox and toggle "Show Pmus" to see the patient’s own drive alongside the machine. The next module puts this to work on real dyssynchronies.',
          th: 'เปิด "Patient effort" ในหน้าทดลอง แล้วสลับ "แสดง Pmus" เพื่อดู drive ของผู้ป่วยคู่ไปกับเครื่อง โมดูลถัดไปจะนำสิ่งนี้ไปใช้กับ dyssynchrony จริง',
        },
      },
      {
        t: 'try',
        label: { en: 'A comfortable assisted patient', th: 'ผู้ป่วยที่ได้รับการช่วยหายใจอย่างสบาย' },
        note: {
          en: 'Volume control with a matched patient effort — triggers are green and one effort yields one breath.',
          th: 'Volume control ที่ effort ของผู้ป่วยเข้ากันได้พอดี — trigger เป็นสีเขียว และ effort หนึ่งครั้งได้ breath หนึ่งครั้ง',
        },
        settings: make({
          vent: { mode: 'VC-AC', rate: 12, tidalVolume: 450, inspFlow: 55, triggerType: 'flow', triggerSensitivity: 2, peep: 5 },
          effort: { enabled: true, amplitude: 6, rate: 15, neuralTi: 0.9, riseFraction: 0.4, coupling: 'independent', reverseDelay: 0.3 },
        }),
      },
    ],
    refIds: ['thille2026', 'costa2025', 'dres2016'],
  },
]
