// Curated references drawn from the user's Zotero library.
// Metadata (authors, journal, year, DOI) extracted directly from Zotero so
// citations are accurate and match the library the educator already maintains.

export interface Reference {
  id: string
  authors: string // "First Author et al." style
  year: string
  title: string
  journal: string
  doi?: string
}

export const references: Record<string, Reference> = {
  thille2026: {
    id: 'thille2026',
    authors: 'Thille, Akoumianaki, Hernández',
    year: '2026',
    title: 'Patient-ventilator asynchrony: physiological causes and clinical aspects',
    journal: 'Intensive Care Medicine',
    doi: '10.1007/s00134-026-08312-w',
  },
  costa2025: {
    id: 'costa2025',
    authors: 'Costa, Cidade, Medeiros, Póvoa',
    year: '2025',
    title:
      'Optimizing Mechanical Ventilation: A Clinical and Practical Bedside Method for the Identification and Management of Patient–Ventilator Asynchronies',
    journal: 'Journal of Clinical Medicine',
    doi: '10.3390/jcm14010214',
  },
  dres2016: {
    id: 'dres2016',
    authors: 'Dres, Rittayamai, Brochard',
    year: '2016',
    title: 'Monitoring patient–ventilator asynchrony',
    journal: 'Current Opinion in Critical Care',
    doi: '10.1097/MCC.0000000000000307',
  },
  oto2021: {
    id: 'oto2021',
    authors: 'Oto, Annesi, Foley',
    year: '2021',
    title:
      'Patient–ventilator dyssynchrony in the intensive care unit: a practical approach to diagnosis and management',
    journal: 'Anaesthesia and Intensive Care',
    doi: '10.1177/0310057X20978981',
  },
  kyo2021: {
    id: 'kyo2021',
    authors: 'Kyo, Shimatani, Hosokawa et al.',
    year: '2021',
    title:
      'Patient–ventilator asynchrony, impact on clinical outcomes and effectiveness of interventions: a systematic review and meta-analysis',
    journal: 'Journal of Intensive Care',
    doi: '10.1186/s40560-021-00565-5',
  },
  deharo2019: {
    id: 'deharo2019',
    authors: 'de Haro, Ochagavia, López-Aguilar et al. (ASYNICU Group)',
    year: '2019',
    title:
      'Patient-ventilator asynchronies during mechanical ventilation: current knowledge and research priorities',
    journal: 'Intensive Care Medicine Experimental',
    doi: '10.1186/s40635-019-0234-5',
  },
  sottile2024: {
    id: 'sottile2024',
    authors: 'Sottile, Smith, Stroh, Albers, Moss',
    year: '2024',
    title:
      'Flow-Limited and Reverse-Triggered Ventilator Dyssynchrony Are Associated With Increased Tidal and Dynamic Transpulmonary Pressure',
    journal: 'Critical Care Medicine',
    doi: '10.1097/CCM.0000000000006180',
  },
  flynn2022: {
    id: 'flynn2022',
    authors: 'Flynn, Miranda, Mittel, Moitra',
    year: '2022',
    title: 'Stepwise Ventilator Waveform Assessment to Diagnose Pulmonary Pathophysiology',
    journal: 'Anesthesiology',
    doi: '10.1097/ALN.0000000000004220',
  },
  arnal2018: {
    id: 'arnal2018',
    authors: 'Arnal',
    year: '2018',
    title: 'Monitoring Mechanical Ventilation Using Ventilator Waveforms',
    journal: 'Springer',
    doi: '10.1007/978-3-319-58655-7',
  },
  turner2021: {
    id: 'turner2021',
    authors: 'Turner, Picton, Harrod, Bossy',
    year: '2021',
    title:
      'Using a breathing simulator to improve simulation-based education for noninvasive ventilation',
    journal: 'Breathe',
    doi: '10.1183/20734735.0285-2020',
  },
  pervaiz2023: {
    id: 'pervaiz2023',
    authors: 'Pervaiz, Daoud, Alchakaki et al.',
    year: '2023',
    title:
      'A Pilot Standardized Simulation-Based Mechanical Ventilation Curriculum for Critical Care Fellows',
    journal: 'Avicenna Journal of Medicine',
    doi: '10.1055/s-0043-1773792',
  },
  hayashi2022: {
    id: 'hayashi2022',
    authors: 'Hayashi, Sousa, Garcia et al.',
    year: '2022',
    title: 'Simulation-based Assessment to Measure Proficiency in Mechanical Ventilation among Residents',
    journal: 'ATS Scholar',
    doi: '10.34197/ats-scholar.2021-0130OC',
  },
  grasselli2023: {
    id: 'grasselli2023',
    authors: 'Grasselli, Calfee, Camporota et al. (ESICM Taskforce)',
    year: '2023',
    title:
      'ESICM guidelines on acute respiratory distress syndrome: definition, phenotyping and respiratory support strategies',
    journal: 'Intensive Care Medicine',
    doi: '10.1007/s00134-023-07050-7',
  },
  matthay2024: {
    id: 'matthay2024',
    authors: 'Matthay, Arabi, Arroliga et al.',
    year: '2024',
    title: 'A New Global Definition of Acute Respiratory Distress Syndrome',
    journal: 'American Journal of Respiratory and Critical Care Medicine',
    doi: '10.1164/rccm.202303-0558WS',
  },
  schmidt2017: {
    id: 'schmidt2017',
    authors: 'Schmidt, Girard, Kress et al.',
    year: '2017',
    title:
      'Official ATS/ACCP Clinical Practice Guideline: Liberation from Mechanical Ventilation in Critically Ill Adults',
    journal: 'American Journal of Respiratory and Critical Care Medicine',
    doi: '10.1164/rccm.201610-2076ST',
  },
  jung2020: {
    id: 'jung2020',
    authors: 'Jung, Vaschetto, Jaber',
    year: '2020',
    title: 'Ten tips to optimize weaning and extubation success in the critically ill',
    journal: 'Intensive Care Medicine',
    doi: '10.1007/s00134-020-06300-2',
  },
  sahetya2017: {
    id: 'sahetya2017',
    authors: 'Sahetya, Goligher, Brower',
    year: '2017',
    title: 'Setting Positive End-Expiratory Pressure in Acute Respiratory Distress Syndrome',
    journal: 'American Journal of Respiratory and Critical Care Medicine',
    doi: '10.1164/rccm.201610-2035CI',
  },
  grieco2026: {
    id: 'grieco2026',
    authors: 'Grieco, Coudroy, Jonkman et al.',
    year: '2026',
    title: 'PEEP and alveolar recruitment after 60 years of acute respiratory distress syndrome',
    journal: 'Intensive Care Medicine',
    doi: '10.1007/s00134-026-08511-5',
  },
  leppink2016: {
    id: 'leppink2016',
    authors: 'Leppink, Duvivier',
    year: '2016',
    title: 'Twelve tips for medical curriculum design from a cognitive load theory perspective',
    journal: 'Medical Teacher',
    doi: '10.3109/0142159X.2015.1132829',
  },
  tainter2017: {
    id: 'tainter2017',
    authors: 'Tainter, Wong, Cudemus-Deseda, Bittner',
    year: '2017',
    title: 'The "Flipped Classroom" Model for Teaching in the Intensive Care Unit',
    journal: 'Journal of Intensive Care Medicine',
    doi: '10.1177/0885066616632156',
  },
}

export function ref(id: string): Reference {
  const r = references[id]
  if (!r) throw new Error(`Unknown reference: ${id}`)
  return r
}
