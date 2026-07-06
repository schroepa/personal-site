export interface CvExperience {
  period: string
  company: string
  role: string
  location: string
  achievements: string[]
}

export interface CvProject {
  number: string
  category: string
  title: string
  description: string
}

export interface CvCompetency {
  title: string
  description: string
}

export interface CvTechStackGroup {
  category: string
  items: string[]
}

export interface CvEducationEntry {
  title: string
  description: string
}

export interface CvLanguage {
  name: string
  level: number // 1-5
}

export interface CvData {
  name: string
  title: string
  metaLine: string
  contact: {
    city: string
    email: string
    website: string
    linkedin: string
    linkedinDisplay: string
  }
  languages: CvLanguage[]
  profile: string
  coreCompetencies: CvCompetency[]
  experience: CvExperience[]
  projects: CvProject[]
  techStack: CvTechStackGroup[]
  education: CvEducationEntry[]
  whyMe: string
}

export const cvData: CvData = {
  name: 'Patrick Schrödter',
  title: 'Senior Product Designer · Design Systems Expert · Design Engineer',
  metaLine: 'CV 2026 · Senior Product Designer',
  contact: {
    city: 'Berlin',
    email: 'schroepa1981@icloud.com',
    website: 'ptrckschrdtr.de',
    linkedin: 'https://www.linkedin.com/in/patrick-schr%C3%B6dter-085330119/',
    linkedinDisplay: 'linkedin.com/in/patrick-schroedter',
  },
  languages: [
    { name: 'Deutsch', level: 5 },
    { name: 'Englisch', level: 4 },
  ],
  profile:
    'Pragmatischer Product Design Lead mit über 15 Jahren Erfahrung an der Schnittstelle von Design und Engineering. Spezialisiert auf 0-to-1 Product Development, skalierbare Design-Systeme und AI-augmented Workflows. Als ehemaliger Systemadministrator entwickle ich Interfaces mit tiefem Verständnis für technische Machbarkeit und sauberen Code-Strukturen.',
  coreCompetencies: [
    {
      title: 'Design & Strategy',
      description: 'Product Design Lead, UI/UX, Rapid Prototyping, Brand Evolution, User Research.',
    },
    {
      title: 'Design Systems',
      description: 'Modulare Systeme als Single Source of Truth. shadcn/ui & Tailwind CSS in Production.',
    },
    {
      title: 'AI & Automation',
      description: 'Claude/Gemini CLI Integration, n8n Automation, Prompt Engineering für UI-Development.',
    },
    {
      title: 'Tech Stack',
      description: 'Figma (Expert), Git, HTML/CSS/JS, Proxmox, Docker, Laravel (Background).',
    },
  ],
  experience: [
    {
      period: '2025 — Heute',
      company: 'Freelance — SWT Stadtwerke Trier & Sander Gruppe',
      role: 'Product Design Lead · UI/UX & Digital Transformation',
      location: 'Berlin / Remote',
      achievements: [
        'Konzeption und Design eines interaktiven Solar-Beratungstools mit Live-Bedarfsermittlung und 10-Jahres-Planungssicherheit für Sales-Teams.',
        'Digitalisierung des B2B-Vertriebs: Ablösung von PowerPoint-Präsentationen durch ein dynamisches, Figma-basiertes Slide-System mit granularen Zugriffsrechten.',
        'Redesign der Corporate-Website auf modernem Astro-Frontend mit Grav-CMS-Anbindung.',
      ],
    },
    {
      period: '2022 — 2025',
      company: 'A Eins Digital Innovation',
      role: 'UX/UI Designer (Lead)',
      location: 'Wittlich',
      achievements: [
        'Konzeption und Design von Portazon — der ersten deutschsprachigen Super-App.',
        'Integration diverser Drittanbieter-Services in eine konsistente, holistische User Experience.',
        'Verantwortung für die visuelle Skalierbarkeit des gesamten digitalen Ökosystems.',
      ],
    },
    {
      period: '2019 — 2022',
      company: 'Oetker Digital',
      role: 'UX/UI Designer, Embedded in Dev-Team',
      location: 'Berlin',
      achievements: [
        'Explizites Staffing innerhalb eines Engineering-Teams zur Schließung der Lücke zwischen Design und Code.',
        'Validierung komplexer technischer Anforderungen durch funktionale Mockups.',
        'Optimierung des Handoff-Prozesses durch technische Dokumentation und Komponenten-Logik.',
      ],
    },
    {
      period: '2012 — 2019',
      company: 'DefShop',
      role: 'Senior UI/UX Designer (Lead)',
      location: 'Berlin',
      achievements: [
        'Gesamtverantwortung für drei umfangreiche Redesigns der E-Commerce-Plattform.',
        'Lead-Design für zwei native Apps (iOS & Android).',
        'Einführung und Pflege eines systemischen Design-Ansatzes zur Beschleunigung der Development-Zyklen.',
      ],
    },
  ],
  projects: [
    {
      number: '01',
      category: 'Design System',
      title: 'AI-First Design System',
      description:
        'Hybrides System auf Basis von shadcn/ui. Design-Tokens werden via KI-Workflows direkt in Tailwind-Code übersetzt — Figma und Repo bleiben synchron.',
    },
    {
      number: '02',
      category: 'Automation',
      title: 'Efficiency Hacking',
      description:
        'Asset-Management und Design-Audits automatisiert über n8n und Custom-LLM-Schnittstellen per CLI. Weniger Toil, mehr Craft.',
    },
    {
      number: '03',
      category: 'Digitalisierung',
      title: 'Project: Sales Automation',
      description:
        'Vom komplexen Excel-Sheet zum interaktiven Beratungs-Tool. UI-gestützte Solar-Planung für Endkunden.',
    },
    {
      number: '04',
      category: 'Ops',
      title: 'Homelab → Designstudio',
      description:
        'Eigener Proxmox/Docker-Stack als Sandbox für Agentic Workflows. Sysadmin-Hintergrund als designerische Superpower.',
    },
  ],
  techStack: [
    { category: 'Design', items: ['Figma Expert', 'Adobe Creative Suite', 'Affinity'] },
    { category: 'Code / Logik', items: ['HTML/CSS/JS', 'TailwindCSS', 'shadcn/ui', 'React Verständnis', 'Git', 'Astro'] },
    { category: 'AI / Ops', items: ['Claude CLI', 'Gemini CLI', 'n8n', 'Docker', 'Directus', 'Shopify', 'WordPress'] },
    { category: 'Methodik', items: ['Agile / Scrum', 'Lean Startup', '0-to-1 Product Ownership'] },
  ],
  education: [
    {
      title: 'Hintergrund',
      description:
        'Langjährige Erfahrung in Design & Webentwicklung. Hands-on nerdness als Basis für technische Empathie im Design.',
    },
    {
      title: 'Weiterbildung',
      description:
        'Kontinuierliche Forschung zu Generative Design & Agentic Workflows. Work in public, ship in public.',
    },
  ],
  whyMe:
    'Ich bin kein Pixel-Schieber. Ich baue Werkzeuge, Systeme und Produkte. Ich liebe die Geschwindigkeit von Startups und verstehe Design als Prozess der Optimierung — technologisch wie visuell. Als Designer in Founding-Teams bringe ich die Erfahrung mit, um Strukturen zu schaffen, und die Leidenschaft, um selbst im Code mit anzupacken.',
}
