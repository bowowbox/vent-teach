import type { SimSettings, VentSettings, LungParams, EffortParams } from '../engine/types'
import { defaultSettings } from '../engine/presets'
import type { LS } from '../i18n/types'

export interface Scenario {
  id: string
  /** The diagnostic term — kept in English in both languages. */
  title: string
  short: LS // one-line summary for cards
  category: 'trigger' | 'flow' | 'cycle' | 'reverse'
  settings: SimSettings
  // Teaching content
  mechanism: LS
  recognize: LS[] // bullet points: what to look for on the waveforms
  fix: LS[] // bullet points: how to resolve it
  refIds: string[]
  // Challenge check: given current live settings, is the asynchrony resolved?
  check: (s: SimSettings) => boolean
  successText: LS
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

export const scenarios: Scenario[] = [
  {
    id: 'ineffective',
    title: 'Ineffective triggering',
    short: {
      en: 'Patient efforts that fail to open the valve — usually from auto-PEEP.',
      th: 'Effort ของผู้ป่วยที่เปิด valve ไม่สำเร็จ — มักเกิดจาก auto-PEEP',
    },
    category: 'trigger',
    settings: make({
      vent: {
        mode: 'VC-AC',
        rate: 20,
        tidalVolume: 500,
        inspFlow: 40,
        triggerType: 'pressure',
        triggerSensitivity: 3,
        peep: 5,
      },
      lung: { compliance: 65, resistance: 18, resistanceExp: 28 },
      effort: { enabled: true, amplitude: 5, rate: 28, neuralTi: 0.8, riseFraction: 0.4, coupling: 'independent', reverseDelay: 0.3 },
    }),
    mechanism: {
      en: 'Dynamic hyperinflation (auto-PEEP) in obstructive lungs means the patient must first generate enough pressure to overcome the trapped gas before the ventilator senses an effort. A weak effort, a high (insensitive) trigger threshold, or a high set rate that shortens expiratory time all make this worse. The neural effort happens, but no breath is delivered.',
      th: 'Dynamic hyperinflation (auto-PEEP) ในปอดที่มีการอุดกั้น ทำให้ผู้ป่วยต้องสร้างความดันให้มากพอที่จะเอาชนะลมที่ค้างอยู่เสียก่อน เครื่องจึงจะรับรู้ effort ได้ ปัจจัยที่ทำให้แย่ลงคือ effort ที่อ่อนแรง, trigger threshold ที่ตั้งไว้สูง (ไม่ไว) หรือ set rate ที่สูงจนทำให้ expiratory time สั้นลง ผลคือมี neural effort เกิดขึ้นจริง แต่ไม่มี breath ถูกส่งออกมา',
    },
    recognize: [
      {
        en: 'Small negative deflection in the pressure trace with a simultaneous notch/bump in the expiratory flow — but no delivered breath follows.',
        th: 'มีรอยกดลงเล็ก ๆ ใน pressure trace พร้อมกับรอยหยัก/นูนใน expiratory flow ในเวลาเดียวกัน — แต่ไม่มี breath ตามมา',
      },
      {
        en: 'Patient (neural) rate is higher than the delivered ventilator rate.',
        th: 'อัตราหายใจของผู้ป่วย (neural rate) สูงกว่า rate ที่เครื่องส่งออกมาจริง',
      },
      {
        en: 'Auto-PEEP present: expiratory flow does not return to zero before the next breath.',
        th: 'มี auto-PEEP: expiratory flow ไม่กลับสู่ศูนย์ก่อน breath ถัดไป',
      },
      { en: 'Marked "!" on the pressure lane in the simulator.', th: 'มีเครื่องหมาย "!" บนแถบ pressure ในเครื่องจำลอง' },
    ],
    fix: [
      {
        en: 'Reduce auto-PEEP: lower the set rate and/or shorten inspiratory time to lengthen expiratory time.',
        th: 'ลด auto-PEEP: ลด set rate และ/หรือลด inspiratory time เพื่อให้ expiratory time ยาวขึ้น',
      },
      {
        en: 'Reduce resistance/obstruction where possible (bronchodilators, suction clinically).',
        th: 'ลด resistance/การอุดกั้นเท่าที่ทำได้ (ทางคลินิกคือให้ bronchodilator, ดูดเสมหะ)',
      },
      { en: 'Increase trigger sensitivity (lower the number).', th: 'เพิ่มความไวของ trigger (ปรับตัวเลขให้ต่ำลง)' },
      {
        en: 'Consider matched external PEEP to counterbalance auto-PEEP in flow-limited patients.',
        th: 'พิจารณาตั้ง external PEEP ให้สมดุลกับ auto-PEEP ในผู้ป่วยที่มี flow limitation',
      },
    ],
    refIds: ['thille2026', 'deharo2019', 'dres2016'],
    check: (s) =>
      s.vent.rate <= 14 && s.vent.triggerSensitivity <= 2 && s.vent.triggerType === 'pressure'
        ? true
        : s.vent.rate <= 12,
    successText: {
      en: 'Lengthening expiratory time (lower rate) reduces auto-PEEP so the patient can trigger, and a more sensitive trigger helps. Efforts now translate into breaths.',
      th: 'การยืด expiratory time (ลด rate) ช่วยลด auto-PEEP ผู้ป่วยจึง trigger ได้ และ trigger ที่ไวขึ้นก็ช่วยเสริม ตอนนี้ effort แต่ละครั้งกลายเป็น breath จริง',
    },
  },
  {
    id: 'double',
    title: 'Double triggering / breath stacking',
    short: {
      en: 'Two stacked breaths from one neural effort — neural Ti outlasts the vent breath.',
      th: 'สอง breath ซ้อนกันจาก neural effort ครั้งเดียว — neural Ti ยาวกว่า breath ของเครื่อง',
    },
    category: 'trigger',
    settings: make({
      vent: {
        mode: 'VC-AC',
        rate: 16,
        tidalVolume: 350,
        inspFlow: 70,
        triggerType: 'flow',
        triggerSensitivity: 2,
        peep: 5,
      },
      lung: { compliance: 40, resistance: 10, resistanceExp: 12 },
      effort: { enabled: true, amplitude: 12, rate: 22, neuralTi: 1.3, riseFraction: 0.35, coupling: 'independent', reverseDelay: 0.3 },
    }),
    mechanism: {
      en: "The patient's neural inspiration lasts longer than the ventilator's inspiratory time (common with a short, high-flow VC breath and a strong, air-hungry patient). The moment the first breath cycles off, the ongoing effort immediately re-triggers a second breath before exhalation — the two breaths stack, delivering a doubled tidal volume at high transpulmonary pressure.",
      th: 'Neural inspiration ของผู้ป่วยยาวกว่า inspiratory time ของเครื่อง (พบบ่อยเมื่อ breath แบบ VC สั้นและ flow สูง ร่วมกับผู้ป่วยที่แรงและหิวอากาศ) ทันทีที่ breath แรก cycle off ลง effort ที่ยังดำเนินอยู่จะ trigger breath ที่สองทันทีก่อนได้หายใจออก — สอง breath จึงซ้อนกัน ส่งผลให้ได้ tidal volume เป็นสองเท่าที่ transpulmonary pressure สูง',
    },
    recognize: [
      {
        en: 'Two breaths back-to-back with little or no expiration between them ("2x" marker).',
        th: 'สอง breath ติดกันโดยแทบไม่มีหรือไม่มี expiration คั่นเลย (มีเครื่องหมาย "2x")',
      },
      {
        en: 'The second breath stacks on residual volume → large combined tidal volume.',
        th: 'Breath ที่สองซ้อนบน volume ที่ยังค้างอยู่ → tidal volume รวมกันมีขนาดใหญ่',
      },
      {
        en: 'Common in ARDS patients with high respiratory drive on low tidal volumes.',
        th: 'พบบ่อยในผู้ป่วย ARDS ที่มี respiratory drive สูงขณะใช้ tidal volume ต่ำ',
      },
    ],
    fix: [
      {
        en: 'Lengthen the ventilator inspiratory time to match neural Ti (lower flow, or larger set Vt, or switch toward a pressure mode).',
        th: 'ยืด inspiratory time ของเครื่องให้ตรงกับ neural Ti (ลด flow, เพิ่ม set Vt หรือเปลี่ยนไปใช้ pressure mode)',
      },
      {
        en: 'Reduce respiratory drive: treat pain/anxiety, adequate sedation, correct acidosis/hypoxia.',
        th: 'ลด respiratory drive: รักษาความปวด/ความวิตกกังวล, ให้ sedation ที่เพียงพอ, แก้ acidosis/hypoxia',
      },
      {
        en: 'A slightly larger set tidal volume can abolish stacking (balance against lung-protective targets).',
        th: 'การเพิ่ม set tidal volume ขึ้นเล็กน้อยอาจหยุด stacking ได้ (ต้องชั่งกับเป้าหมาย lung-protective)',
      },
    ],
    refIds: ['thille2026', 'sottile2024', 'costa2025'],
    check: (s) =>
      (s.vent.mode === 'VC-AC' && s.vent.tidalVolume / (s.vent.inspFlow / 60) >= 1.1) ||
      (s.vent.mode === 'PC-AC' && s.vent.inspTime >= 1.1) ||
      s.effort.amplitude <= 6,
    successText: {
      en: 'Matching the ventilator inspiratory time to the neural effort (or reducing drive) stops the second stacked breath. One effort now yields one breath.',
      th: 'การปรับ inspiratory time ของเครื่องให้ตรงกับ neural effort (หรือการลด drive) หยุด breath ที่สองที่ซ้อนกันได้ ตอนนี้ effort หนึ่งครั้งได้ breath หนึ่งครั้ง',
    },
  },
  {
    id: 'flow-starvation',
    title: 'Flow starvation (flow asynchrony)',
    short: {
      en: 'Set flow too low for a hungry patient — pressure scoops downward mid-breath.',
      th: 'ตั้ง flow ต่ำเกินไปสำหรับผู้ป่วยที่หิวอากาศ — pressure เว้าลงกลาง breath',
    },
    category: 'flow',
    settings: make({
      vent: {
        mode: 'VC-AC',
        rate: 14,
        tidalVolume: 450,
        inspFlow: 30,
        triggerType: 'flow',
        triggerSensitivity: 2,
        peep: 5,
      },
      lung: { compliance: 50, resistance: 10, resistanceExp: 12 },
      effort: { enabled: true, amplitude: 12, rate: 18, neuralTi: 1.0, riseFraction: 0.4, coupling: 'independent', reverseDelay: 0.3 },
    }),
    mechanism: {
      en: 'In volume control the inspiratory flow is fixed. If the patient demands more flow than the ventilator delivers, their inspiratory effort pulls airway pressure down during the breath — the fixed-flow delivery cannot keep up with demand.',
      th: 'ใน volume control ค่า inspiratory flow ถูกกำหนดตายตัว หากผู้ป่วยต้องการ flow มากกว่าที่เครื่องส่งให้ inspiratory effort ของผู้ป่วยจะดึง airway pressure ให้ตกลงระหว่าง breath — เพราะการส่งลมแบบ flow คงที่ตามความต้องการไม่ทัน',
    },
    recognize: [
      {
        en: 'Concave ("scooped" or dished-out) downslope on the pressure waveform during inspiration.',
        th: 'Pressure waveform ในช่วง inspiration มีลักษณะเว้าลง (เหมือนถูกตักออก)',
      },
      {
        en: 'Worse with strong effort and low set flow; the pressure trace is pulled toward the Pmus curve (toggle "Show Pmus").',
        th: 'ยิ่ง effort แรงและ set flow ต่ำ ยิ่งชัด โดย pressure trace จะถูกดึงเข้าหาเส้น Pmus (ลองเปิด "แสดง Pmus")',
      },
      {
        en: 'Patient looks like they are "pulling" against the ventilator.',
        th: 'ผู้ป่วยดูเหมือนกำลัง "ดึง" สู้กับเครื่อง',
      },
    ],
    fix: [
      { en: 'Increase the set inspiratory flow to meet demand.', th: 'เพิ่ม set inspiratory flow ให้พอกับความต้องการ' },
      {
        en: 'Switch to a pressure-targeted mode (PC/PSV) where flow is delivered on demand.',
        th: 'เปลี่ยนไปใช้ mode ที่กำหนดด้วย pressure (PC/PSV) ซึ่งส่ง flow ตามความต้องการ',
      },
      {
        en: 'Reduce respiratory drive (analgesia/sedation, treat the underlying cause).',
        th: 'ลด respiratory drive (ให้ยาแก้ปวด/sedation, รักษาสาเหตุที่ซ่อนอยู่)',
      },
    ],
    refIds: ['costa2025', 'flynn2022', 'arnal2018'],
    check: (s) =>
      (s.vent.mode === 'VC-AC' && s.vent.inspFlow >= 60) ||
      s.vent.mode === 'PC-AC' ||
      s.vent.mode === 'PSV' ||
      s.effort.amplitude <= 6,
    successText: {
      en: 'Raising the set flow (or switching to a pressure mode where flow is delivered on demand) removes the scooped pressure — supply now meets the patient’s demand.',
      th: 'การเพิ่ม set flow (หรือเปลี่ยนไป pressure mode ที่ส่ง flow ตามความต้องการ) ทำให้ pressure ที่เว้าลงหายไป — ปริมาณลมที่ส่งให้ตรงกับความต้องการของผู้ป่วยแล้ว',
    },
  },
  {
    id: 'reverse',
    title: 'Reverse triggering',
    short: {
      en: 'A mandatory breath entrains the patient’s effort — muscle contraction follows the machine.',
      th: 'Mandatory breath ชักนำ effort ของผู้ป่วย — กล้ามเนื้อหดตัวตามหลังเครื่อง',
    },
    category: 'reverse',
    settings: make({
      vent: {
        mode: 'VC-AC',
        rate: 16,
        tidalVolume: 420,
        inspFlow: 50,
        triggerType: 'flow',
        triggerSensitivity: 2,
        peep: 6,
      },
      lung: { compliance: 35, resistance: 10, resistanceExp: 12 },
      effort: { enabled: true, amplitude: 8, rate: 16, neuralTi: 0.9, riseFraction: 0.4, coupling: 'reverse-trigger', reverseDelay: 0.35 },
    }),
    mechanism: {
      en: 'In sedated patients, a passive (machine-triggered) breath can reflexively entrain the diaphragm so that a patient effort begins shortly after each mandatory breath — the neural rhythm is driven by the ventilator, the reverse of normal triggering. It can generate extra volume (breath stacking) and injurious transpulmonary pressures.',
      th: 'ในผู้ป่วยที่ได้รับ sedation การส่ง breath แบบ passive (เครื่องเป็นผู้ trigger) สามารถชักนำ diaphragm ผ่าน reflex จน effort ของผู้ป่วยเริ่มขึ้นหลัง mandatory breath แต่ละครั้งเล็กน้อย — จังหวะ neural ถูกขับโดยเครื่อง ซึ่งกลับด้านกับการ trigger ตามปกติ ภาวะนี้ทำให้เกิด volume เกิน (breath stacking) และ transpulmonary pressure ที่ทำร้ายปอดได้',
    },
    recognize: [
      {
        en: 'A consistent effort deflection appearing at a fixed delay AFTER each mandatory breath begins.',
        th: 'เห็นรอยของ effort ปรากฏอย่างสม่ำเสมอที่ระยะเวลาคงที่ "หลัง" จาก mandatory breath แต่ละครั้งเริ่มขึ้น',
      },
      {
        en: 'Often 1:1 or entrained ratios (e.g., every breath, or every other breath).',
        th: 'มักเป็นอัตราส่วน 1:1 หรืออัตราที่ถูกชักนำอย่างเป็นจังหวะ (เช่น ทุก breath หรือทุก breath เว้น breath)',
      },
      { en: 'May cause a second stacked breath (reverse-triggered double).', th: 'อาจทำให้เกิด breath ที่สองซ้อนขึ้นมา (reverse-triggered double)' },
      { en: 'Toggle "Show Pmus" to see effort locked to the machine breath.', th: 'เปิด "แสดง Pmus" เพื่อดู effort ที่ถูกล็อกไว้กับ breath ของเครื่อง' },
    ],
    fix: [
      {
        en: 'Recognize it — it is easily mistaken for a comfortable patient or simple triggering.',
        th: 'ต้องรู้จักมันก่อน — เพราะมักถูกเข้าใจผิดว่าเป็นผู้ป่วยที่สบายดีหรือเป็นการ trigger ธรรมดา',
      },
      {
        en: 'Adjust sedation depth (both deeper and lighter planes have been described; assess effect).',
        th: 'ปรับระดับ sedation (มีรายงานทั้งการเพิ่มและลดระดับ ให้ประเมินผลที่เกิดขึ้นจริง)',
      },
      {
        en: 'Reduce controlled over-assistance; consider mode/settings that let the patient breathe more naturally.',
        th: 'ลดการช่วยหายใจแบบควบคุมที่มากเกินไป พิจารณา mode/การตั้งค่าที่ให้ผู้ป่วยหายใจได้เป็นธรรมชาติมากขึ้น',
      },
      { en: 'Watch for injurious stacked breaths and transpulmonary pressure.', th: 'เฝ้าระวัง breath ที่ซ้อนกันซึ่งทำร้ายปอด และเฝ้าดู transpulmonary pressure' },
    ],
    refIds: ['sottile2024', 'thille2026', 'deharo2019'],
    check: (s) => s.effort.coupling === 'independent' || !s.effort.enabled,
    successText: {
      en: 'Reverse triggering is primarily a recognition problem. Here, decoupling the effort from the machine breath (clinically: adjusting sedation/assist) breaks the entrainment.',
      th: 'Reverse triggering เป็นปัญหาของการ "สังเกตให้ออก" เป็นหลัก ในที่นี้ การแยก effort ออกจาก breath ของเครื่อง (ทางคลินิกคือการปรับ sedation/การช่วยหายใจ) ทำให้การชักนำจังหวะนั้นหมดไป',
    },
  },
  {
    id: 'autotrigger',
    title: 'Auto-triggering',
    short: {
      en: 'The ventilator triggers itself — sensitivity set too high, no real effort.',
      th: 'เครื่อง trigger ตัวเอง — ตั้ง sensitivity ไวเกินไป ทั้งที่ไม่มี effort จริง',
    },
    category: 'trigger',
    settings: make({
      vent: {
        mode: 'PC-AC',
        rate: 12,
        pInsp: 14,
        inspTime: 1.0,
        triggerType: 'pressure',
        triggerSensitivity: 0.5,
        peep: 5,
      },
      lung: { compliance: 55, resistance: 9, resistanceExp: 11 },
      effort: { enabled: false, amplitude: 6, rate: 16, neuralTi: 0.9, riseFraction: 0.4, coupling: 'independent', reverseDelay: 0.3 },
    }),
    mechanism: {
      en: 'When the trigger is set too sensitive, small non-effort signals — cardiac oscillations, circuit leaks, water in the tubing, or condensation — are misread as patient effort and deliver extra breaths. The delivered rate exceeds the set rate with no patient breathing.',
      th: 'เมื่อตั้ง trigger ให้ไวเกินไป สัญญาณเล็ก ๆ ที่ไม่ใช่ effort — เช่น cardiac oscillation, การรั่วของ circuit, น้ำในสาย หรือไอน้ำที่กลั่นตัว — จะถูกอ่านผิดว่าเป็น effort ของผู้ป่วย แล้วส่ง breath เกินออกมา ทำให้ rate ที่ส่งจริงสูงกว่า set rate ทั้งที่ผู้ป่วยไม่ได้หายใจเอง',
    },
    recognize: [
      {
        en: 'Total rate higher than the set rate, with the patient passive (no effort).',
        th: 'Total rate สูงกว่า set rate ทั้งที่ผู้ป่วยเป็น passive (ไม่มี effort)',
      },
      {
        en: 'Breaths appear at irregular or heart-rate-linked intervals ("A" marker).',
        th: 'Breath ปรากฏเป็นจังหวะไม่สม่ำเสมอ หรือสัมพันธ์กับอัตราการเต้นของหัวใจ (มีเครื่องหมาย "A")',
      },
      {
        en: 'Risk of respiratory alkalosis and misinterpreted "patient effort".',
        th: 'เสี่ยงต่อ respiratory alkalosis และการตีความผิดว่ามี "effort ของผู้ป่วย"',
      },
    ],
    fix: [
      { en: 'Make the trigger less sensitive (raise the number).', th: 'ปรับ trigger ให้ไวน้อยลง (เพิ่มตัวเลข)' },
      {
        en: 'Clinically: clear circuit condensate, fix leaks, check for cardiac oscillation.',
        th: 'ทางคลินิก: ไล่น้ำที่กลั่นตัวใน circuit, แก้จุดรั่ว, ตรวจหา cardiac oscillation',
      },
    ],
    refIds: ['dres2016', 'thille2026'],
    check: (s) => s.vent.triggerSensitivity >= 1.5,
    successText: {
      en: 'A less sensitive trigger ignores the cardiogenic oscillation, so the ventilator only cycles at its set rate.',
      th: 'Trigger ที่ไวน้อยลงจะไม่สนใจ cardiogenic oscillation เครื่องจึงส่ง breath ตาม set rate เท่านั้น',
    },
  },
  {
    id: 'delayed-cycle',
    title: 'Delayed cycling (COPD on PSV)',
    short: {
      en: 'Inspiration runs into expiration — cycle-off set too low in obstruction.',
      th: 'Inspiration ล้ำเข้าไปใน expiration — ตั้ง cycle-off ต่ำเกินไปในภาวะอุดกั้น',
    },
    category: 'cycle',
    settings: make({
      vent: {
        mode: 'PSV',
        pSupport: 14,
        cycleOff: 0.1,
        riseTime: 0.1,
        triggerType: 'flow',
        triggerSensitivity: 2,
        peep: 5,
      },
      lung: { compliance: 60, resistance: 18, resistanceExp: 26 },
      effort: { enabled: true, amplitude: 8, rate: 16, neuralTi: 0.8, riseFraction: 0.4, coupling: 'independent', reverseDelay: 0.3 },
    }),
    mechanism: {
      en: 'In pressure support, inspiration ends when flow decays to a set fraction of peak. In obstructive lungs flow decays slowly, so a low cycle-off threshold makes the ventilator keep pushing gas after the patient wants to exhale — machine inspiration outlasts neural inspiration, promoting hyperinflation and ineffective efforts.',
      th: 'ใน pressure support ช่วง inspiration จะสิ้นสุดเมื่อ flow ลดลงถึงสัดส่วนของ peak flow ที่ตั้งไว้ ในปอดที่มีการอุดกั้น flow ลดลงช้า การตั้ง cycle-off threshold ต่ำจึงทำให้เครื่องยังดันลมต่อไปทั้งที่ผู้ป่วยอยากหายใจออกแล้ว — inspiration ของเครื่องยาวเกิน neural inspiration ส่งเสริมให้เกิด hyperinflation และ ineffective effort',
    },
    recognize: [
      {
        en: 'Prolonged ventilator inspiration; the patient begins to exhale against the breath (a terminal pressure spike can appear).',
        th: 'Inspiration ของเครื่องยาวผิดปกติ ผู้ป่วยเริ่มหายใจออกสู้กับ breath (อาจเห็น pressure spike ที่ปลาย breath)',
      },
      {
        en: 'Short expiratory time → auto-PEEP and, downstream, ineffective triggering.',
        th: 'Expiratory time สั้นลง → เกิด auto-PEEP และตามมาด้วย ineffective triggering',
      },
    ],
    fix: [
      {
        en: 'Raise the expiratory cycle-off threshold (e.g., from 10% toward 40–50% of peak flow) to shorten inspiration.',
        th: 'เพิ่ม cycle-off threshold (เช่น จาก 10% ไปที่ 40–50% ของ peak flow) เพื่อให้ inspiration สั้นลง',
      },
      { en: 'Reduce pressure support if tidal volumes are large.', th: 'ลด pressure support หาก tidal volume มีขนาดใหญ่' },
    ],
    refIds: ['costa2025', 'oto2021', 'arnal2018'],
    check: (s) => s.vent.mode === 'PSV' && s.vent.cycleOff >= 0.35,
    successText: {
      en: 'A higher cycle-off threshold ends inspiration sooner, matching the patient’s shorter neural breath and giving more time to exhale.',
      th: 'Cycle-off threshold ที่สูงขึ้นทำให้ inspiration สิ้นสุดเร็วขึ้น ตรงกับ neural breath ที่สั้นกว่าของผู้ป่วย และเหลือเวลาให้หายใจออกมากขึ้น',
    },
  },
]

export function scenarioById(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id)
}
