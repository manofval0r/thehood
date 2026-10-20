/**
 * What this course is actually for.
 *
 * Three things, kept apart because they answer different questions:
 *
 *   ROLES          the jobs. What the work is, and how you get into it.
 *   CERTIFICATIONS the paper. What each one proves, and what it costs.
 *   PLATFORMS      where to practise, and what each one is good for.
 *
 * The courses a role points at are real slugs from the manifest, so a role
 * cannot quietly point at a course that does not exist. `tools/check-career.js`
 * checks that, along with the certification and platform cross references.
 *
 * Costs are indicative bands, not quotes. Vendors move prices, academic
 * pricing differs by country, and a number written here would be out of date
 * within a term. The page says so where the numbers appear.
 */

/* ------------------------------------------------------------------ roles */

export interface Role {
  slug: string;
  title: string;
  /** One line. What this person is, in plain words. */
  summary: string;
  /** The pixel motif that says what kind of work this is. */
  motif:
    | "advisory"
    | "breach"
    | "search"
    | "tool"
    | "region"
    | "notebook"
    | "industry"
    | "research";
  /** What the job is on an ordinary day. */
  work: string;
  /** The way in, in order. */
  path: string[];
  /** Course slugs on this site that feed this role. */
  courses: string[];
  /** Certification ids that count towards it. */
  certs: string[];
  /** Practice platform ids that count towards it. */
  practice: string[];
  /** What actually gets you through the door. */
  signal: string;
}

export const ROLES: Role[] = [
  {
    slug: "soc-analyst",
    title: "SOC Analyst",
    summary: "The first person an alarm reaches.",
    motif: "advisory",
    work: "You sit in front of a queue of alerts from firewalls, endpoints and identity providers. The work is triage: decide which of the day's thousands of alerts is a real incident, get it to the right person, and write down what you decided. Most of a SOC analyst's skill is judgement about noise, and the notes they leave are what the investigation afterwards depends on.",
    path: [
      "Get the fundamentals right: networking, operating systems, and how Windows records what happened",
      "Build a home lab: a Windows machine and a Linux machine with a log collector on top",
      "Practise on blue-team labs before you apply, not after",
      "Apply for SOC, IT support and security operations roles rather than for 'cybersecurity' roles",
      "Move from Tier 1 to Tier 2 when you can say why an alert fired, not just that it did",
    ],
    courses: ["cyb-303", "cyb-305", "nut-csc-301"],
    certs: ["security-plus", "google-cybersecurity", "blue-team-1", "gcih"],
    practice: ["cyberdefenders", "letsdefend", "splunk-bots"],
    signal: "One investigation you can walk someone through, end to end, beats any list of tools on a CV.",
  },
  {
    slug: "penetration-tester",
    title: "Penetration Tester",
    summary: "Paid to break into things, with permission, on a schedule.",
    motif: "breach",
    work: "A penetration test is a scoped, agreed, time-boxed attack against a system the client owns. You scope it, enumerate, exploit, show the impact, and write a report the engineers can act on. The report is the deliverable. The exploit is half the job, and the half that is easier to talk about.",
    path: [
      "Get comfortable in a Linux shell and enough scripting to automate your own work",
      "Learn the web stack properly: HTTP, sessions, cookies, and where authorisation is actually checked",
      "Work the free labs first (PortSwigger, TryHackMe), then the paid ones",
      "Play in public CTFs and on the machines that are meant to be broken",
      "Take a practical exam. The market rewards hands-on proof far more than theory",
    ],
    courses: ["nut-cyb-312", "cyb-301", "cyb-303"],
    certs: ["ejpt", "pnpt", "cpts", "oscp", "ceh"],
    practice: ["portswigger", "hackthebox", "tryhackme", "vulnhub", "picoctf"],
    signal: "A home lab and a public write-up of one engagement is the cheapest proof of skill you can build.",
  },
  {
    slug: "dfir-analyst",
    title: "Forensics and Incident Response Analyst",
    summary: "Works out what actually happened, after it happened.",
    motif: "search",
    work: "When something has gone wrong, someone has to reconstruct it from what the machines left behind: disk images, memory dumps, logs, network captures. You preserve the evidence first, then build a timeline, identify the initial access and how far it went, and write it up so the organisation can respond and the record can stand up if it goes further.",
    path: [
      "Learn to preserve and image evidence before you learn to analyse it",
      "Get the formats right: NTFS, ext4, Windows event logs, registry hives, browser artefacts",
      "Practise on forensic images rather than on live machines",
      "Build the habit of writing timelines. The timeline is the actual deliverable",
      "Move into incident response, where the same skills are needed faster and under pressure",
    ],
    courses: ["cyb-305", "cyb-303", "nut-csc-310"],
    certs: ["gcih", "blue-team-2", "security-plus"],
    practice: ["digitalcorpora", "cyberdefenders", "malware-traffic-analysis"],
    signal: "A timeline you built from an image, written up for someone who was not there, is the proof.",
  },
  {
    slug: "security-engineer",
    title: "Security Engineer",
    summary: "Makes the security controls part of the build, not a gate at the end.",
    motif: "tool",
    work: "A security engineer sits inside the systems team. They put the controls in where they are cheap to apply, automate the checking so it is not a person's job, and treat an incident as a reason to change the system rather than as a reason to blame someone. Much of the work is writing code and pipelines.",
    path: [
      "Learn to script well. This job is more automation than it is certificates",
      "Understand the platform you are securing: identity, network, and how the build pipeline deploys",
      "Set up a pipeline that fails on the obvious mistakes before a human has to",
      "Write the runbook before you need it",
      "Take the certification your employer names, and only that one to begin with",
    ],
    courses: ["nut-csc-310", "nut-cyb-312", "cyb-303"],
    certs: ["security-plus", "cysa", "ccsp"],
    practice: ["ost2", "overthewire", "hackthebox"],
    signal: "A pipeline you built that has already stopped a bad merge is worth more than a page of certifications.",
  },
  {
    slug: "appsec-engineer",
    title: "Application Security Engineer",
    summary: "Finds the flaw in the code before someone else does.",
    motif: "notebook",
    work: "Application security is a close reading of how software is built and how it fails: broken authorisation, injection, unsafe deserialisation, secrets in the repository. The work spans code review, threat modelling with the developers, and getting the findings fixed rather than filed.",
    path: [
      "Learn one stack deeply enough to write it badly on purpose and understand why",
      "Read the language and framework security guides, which are free and better than most courses",
      "Practise on deliberately vulnerable applications, then on real bug reports",
      "Learn to write a finding that gets fixed: what breaks, how, and the smallest change that fixes it",
      "Move into secure development, where you stop finding bugs and start not shipping them",
    ],
    courses: ["nut-cyb-312", "cyb-301", "nut-csc-312"],
    certs: ["cysa", "ejpt", "security-plus"],
    practice: ["portswigger", "tryhackme", "ost2"],
    signal: "A single bug report you wrote that a team accepted and fixed is the strongest CV line in this field.",
  },
  {
    slug: "cloud-security-engineer",
    title: "Cloud Security Engineer",
    summary: "Secures the rented infrastructure, where the defaults are open.",
    motif: "region",
    work: "Cloud providers ship everything open and secure it by configuration, which means the security of a cloud estate is a large, specific, well-paid body of work: identity and access, network boundaries, key management, logging, and the evidence auditors ask for. A single wrong storage policy can expose a whole bucket.",
    path: [
      "Learn one cloud properly, including its IAM model, which is where most of the risk lives",
      "Understand what the provider logs, what it keeps, and for how long",
      "Break a lab account on purpose, then fix it, and write up what you found",
      "Get comfortable with infrastructure as code and policy as code",
      "Take the vendor certification for the platform you actually work on, not a generic one",
    ],
    courses: ["nut-csc-310", "cyb-301", "nut-csc-301"],
    certs: ["aws-security", "ccsp", "security-plus"],
    practice: ["hackthebox", "overthewire", "ost2"],
    signal: "A public cloud misconfiguration you found and explained is the credential that opens these interviews.",
  },
  {
    slug: "grc-analyst",
    title: "Governance, Risk and Compliance Analyst",
    summary: "Turns what the law and the client ask for into work that gets done.",
    motif: "industry",
    work: "GRC work is the part of security that is about evidence rather than exploits: what controls exist, who owns them, whether they work, and whether the answer can be produced for an auditor or a client. It is less technical than the other roles and much more in demand than students expect, especially where contracts and data protection are involved.",
    path: [
      "Learn one framework properly: ISO 27001 or NIST CSF, not five frameworks badly",
      "Understand what an audit actually asks for, because the evidence is the job",
      "Get the vocabulary of data protection right, since it comes up in every GRC conversation",
      "Write a policy that a busy department will actually follow",
      "Consider the certifications here early. This is the field where paper moves interviews",
    ],
    courses: ["nut-csc-301", "cyb-303", "gst-312"],
    certs: ["iso27001", "cissp", "security-plus"],
    practice: ["ost2"],
    signal: "A control matrix you built and got signed off is worth more here than any exploitation write-up.",
  },
  {
    slug: "threat-intel-analyst",
    title: "Threat Intelligence Analyst",
    summary: "Works out who is behind the activity, and what they want next.",
    motif: "research",
    work: "Threat intelligence turns raw indicators into decisions: which campaigns matter to your organisation, what an intrusion set is actually after, and what to change because of it. It is research work with a hard requirement to be right about facts and careful about claims.",
    path: [
      "Learn to read an incident report and pull the timeline out of it",
      "Follow a few reporting teams closely and learn their vocabulary",
      "Get good at writing: most of the job is a sentence somebody can act on",
      "Practise attribution reasoning on open-source cases, and learn where the confidence limits are",
      "Build the habit of stating what you do not know",
    ],
    courses: ["cyb-305", "cyb-303", "nut-csc-312"],
    certs: ["gcih", "blue-team-2", "security-plus"],
    practice: ["malware-traffic-analysis", "cyberdefenders", "overthewire"],
    signal: "Two or three well-sourced assessments of campaigns matter more than a wall of indicators.",
  },
];

/* -------------------------------------------------------- certifications */

export type CertLevel = "entry" | "mid" | "senior";

export interface Certification {
  id: string;
  name: string;
  vendor: string;
  /** What it actually proves, in plain words. */
  proves: string;
  /** Who it is for. */
  for: string;
  /** Indicative cost band. Not a quote. */
  cost: string;
  /** How to pay less for it. */
  cheaper: string;
  level: CertLevel;
}

export const CERTIFICATIONS: Certification[] = [
  {
    id: "security-plus",
    name: "Security+",
    vendor: "CompTIA",
    proves:
      "The shared vocabulary of the field: threats, vulnerabilities, risk, the basics of cryptography, and how security is managed. It is the certificate most job adverts actually name, and the one that survives a screening filter.",
    for:
      "Anyone starting out. It is the one that gets past the first cut, and it does not require you to have worked in security first.",
    cost: "Low hundreds of dollars for the exam voucher with academic pricing, more without one",
    cheaper:
      "Ask your department for academic exam pricing, and take the training and the voucher together. Both together are usually cheaper than the exam on its own.",
    level: "entry",
  },
  {
    id: "google-cybersecurity",
    name: "Google Cybersecurity Professional Certificate",
    vendor: "Coursera",
    proves:
      "A structured, beginner-friendly route through the field with hands-on labs in the browser, no prior experience assumed. Good for finding out whether this is the field for you before spending real money.",
    for:
      "People deciding between security and something else, and people who need a guided start rather than a syllabus.",
    cost: "A Coursera subscription, which is often lower in the first year and higher after",
    cheaper:
      "Audit the first module free, then subscribe only when you are actually going to finish the certificate. There are periodic free-unaudited windows.",
    level: "entry",
  },
  {
    id: "ejpt",
    name: "eJPT",
    vendor: "INE",
    proves:
      "A practical, entry-level penetration testing certification with no prerequisites. The exam is a real engagement against a target machine, so passing says something about your hands, not only your memory.",
    for:
      "People who want their first practical offensive credential without the price tag of the famous ones.",
    cost: "Low hundreds of dollars, usually as a course and exam bundle",
    cheaper:
      "It is deliberately priced below the better-known practical exams. Check the vendor's own site for coupon codes before paying list price.",
    level: "entry",
  },
  {
    id: "pnpt",
    name: "PNPT",
    vendor: "TCM Security",
    proves:
      "A practical exam with no prerequisites and a fraction of the price of the big names, covering the full kill chain rather than one narrow slice.",
    for:
      "Students who want hands-on proof at a price they can meet while still at school.",
    cost: "Mid hundreds of dollars for the course and exam together",
    cheaper:
      "The bundle is the only sensible way to buy it. The exam alone, without the course, is more expensive than the bundle and much less useful.",
    level: "entry",
  },
  {
    id: "cpts",
    name: "CPTS",
    vendor: "Hack The Box",
    proves:
      "A practical, employer-recognised offensive certification from a platform you probably already use. It includes a report submission, so it trains the writing as well as the attacking.",
    for:
      "People already comfortable on Hack The Box who want a certificate from the same ecosystem.",
    cost: "A few hundred dollars, normally bundled with the exam",
    cheaper:
      "Buy the exam with a lab subscription rather than a standalone exam, and practise on the free Starting Point machines first.",
    level: "mid",
  },
  {
    id: "oscp",
    name: "OSCP",
    vendor: "Offensive Security",
    proves:
      "The most recognised practical offensive certification. A full day against a machine, plus a report. Passing says you can work a box under pressure and write it up afterwards.",
    for:
      "People already working in offensive roles who need the name to move up or to clear a contract requirement.",
    cost: "Several hundred dollars for the course, which includes the exam voucher",
    cheaper:
      "Buy the course and voucher as a bundle rather than the exam on its own. The course is where the value is and it is priced to be bought together.",
    level: "senior",
  },
  {
    id: "ceh",
    name: "Certified Ethical Hacker",
    vendor: "EC-Council",
    proves:
      "The name most HR filters recognise. It is broad and heavy on theory and tooling, and lighter on proving that you can actually break in.",
    for:
      "People moving into consulting or into a corporate security team where the certificate appears on a job description.",
    cost: "Several hundred dollars, and the exam itself needs a voucher bought through an authorised partner",
    cheaper:
      "Train through an authorised partner so the course fee includes the exam. Buying the voucher separately costs more and leaves you without the course.",
    level: "mid",
  },
  {
    id: "cysa",
    name: "CySA+",
    vendor: "CompTIA",
    proves:
      "Application security: how software is built, how it breaks, and how you test it. Suits developers who want to move into security without leaving the engineering team.",
    for:
      "Developers and QA engineers moving towards security engineering or AppSec.",
    cost: "Comparable to Security+, and academic pricing applies the same way",
    cheaper:
      "Academic pricing again, and the same bundle logic: the practice tests are worth more than the voucher.",
    level: "mid",
  },
  {
    id: "blue-team-1",
    name: "Blue Team Level 1",
    vendor: "Blue Team Academy",
    proves:
      "Defensive fundamentals with practical labs, at a price a student can meet. Detection, logging, and the day-to-day work of noticing things.",
    for:
      "People moving into detection engineering or a SOC, and anyone who wants the defensive half of the field.",
    cost: "Low hundreds of dollars",
    cheaper:
      "Designed to be affordable, and there are periodic discounts on the vendor's own site.",
    level: "entry",
  },
  {
    id: "blue-team-2",
    name: "Blue Team Level 2",
    vendor: "Blue Team Academy",
    proves:
      "Heavier defensive work: building detections, working a logging pipeline, and operating as the blue team rather than joining one.",
    for:
      "People already in a SOC or a detection role who need to go deeper rather than wider.",
    cost: "Low to mid hundreds of dollars",
    cheaper:
      "Only worth taking once the Level 1 material is behind you. The labs assume it.",
    level: "mid",
  },
  {
    id: "gcih",
    name: "GCIH",
    vendor: "SANS",
    proves:
      "Incident handling and forensics, taught the way responders actually work. Heavy on the process of an investigation, which is the part most self-taught people get wrong.",
    for:
      "People in or heading towards incident response, and anyone doing DFIR work with a body of evidence to handle.",
    cost: "Around a thousand dollars for the course and exam together",
    cheaper:
      "The bundled course and exam is cheaper than the exam alone. The GIAC exam vouchers are also frequently resold through legitimate training resellers at a discount.",
    level: "mid",
  },
  {
    id: "aws-security",
    name: "Certified Cloud Security - Specialty",
    vendor: "AWS",
    proves:
      "Cloud security inside the largest cloud: identity, data protection, network controls, and the detective and logging services that make an incident visible.",
    for:
      "People who already work with AWS and need the credential that matches the platform.",
    cost: "Around a hundred dollars for the exam, higher in some regions, with training sold separately",
    cheaper:
      "The exam is the cheap part and the training is optional. Practise on a free account rather than paying for a course you do not need yet.",
    level: "mid",
  },
  {
    id: "ccsp",
    name: "Certified Cloud Security Professional",
    vendor: "(ISC)²",
    proves:
      "Governance and architecture for cloud, and the judgement to make a decision when the answer is a trade-off. It assumes you have already done the work it certifies.",
    for:
      "Senior engineers and architects who already run cloud estates.",
    cost: "Several hundred dollars, with an annual maintenance fee afterwards",
    cheaper:
      "Study from the objectives and the practice tests rather than buying a course. This is one where the syllabus does the work.",
    level: "senior",
  },
  {
    id: "cissp",
    name: "CISSP",
    vendor: "(ISC)²",
    proves:
      "The broad security leadership credential, across eight domains. It also asserts that you have been doing the job for five years, which is the part employers read first.",
    for:
      "Mid-career security professionals, and anyone whose contract or job title asks for it.",
    cost: "Several hundred dollars, plus annual maintenance and continuing education credits",
    cheaper:
      "Only take it once you can meet the experience requirement. Paying for the exam before you qualify is the most common waste of money in this list.",
    level: "senior",
  },
  {
    id: "iso27001",
    name: "ISO/IEC 27001 Lead Implementer",
    vendor: "Accredited training providers",
    proves:
      "How to run and audit an information security management system. There is no multiple-choice exam here: the certificate comes from the training body, and the course is the point.",
    for:
      "GRC, compliance and internal audit work, and for departments that need someone who can run the system.",
    cost: "A few hundred dollars for the training course, which is the certification",
    cheaper:
      "Choose a provider whose course includes the certificate. A cheaper course that does not include it leaves you with a certificate you have to buy separately.",
    level: "mid",
  },
];

/* ------------------------------------------------------------- platforms */

export type PlatformKind = "offensive" | "defensive" | "web" | "general";

export interface Platform {
  id: string;
  name: string;
  what: string;
  /** What it costs to use. */
  price: string;
  kind: PlatformKind;
  href: string;
}

export const PLATFORMS: Platform[] = [
  {
    id: "portswigger",
    name: "PortSwigger Web Security Academy",
    what:
      "Free labs written by the people who make the tools. The web half of security, at a standard nothing else matches for free.",
    price: "Free",
    kind: "web",
    href: "https://portswigger.net/web-security",
  },
  {
    id: "tryhackme",
    name: "TryHackMe",
    what:
      "Guided rooms that walk you through a task step by step, plus occasional free weekend access to the paid ones.",
    price: "Free tier, with a monthly subscription for the full library",
    kind: "general",
    href: "https://tryhackme.com",
  },
  {
    id: "hackthebox",
    name: "Hack The Box",
    what:
      "Machines and labs to break into, starting with free Starting Point machines and moving to the harder Active and Pro networks.",
    price: "Free machines, with a monthly subscription for the rest",
    kind: "offensive",
    href: "https://www.hackthebox.com",
  },
  {
    id: "picoctf",
    name: "picoCTF",
    what:
      "A free capture-the-flag built for school and beginner students, with a scope and a difficulty curve that assumes nothing.",
    price: "Free",
    kind: "general",
    href: "https://picoctf.org",
  },
  {
    id: "vulnhub",
    name: "VulnHub",
    what:
      "Community-built vulnerable machines to break into. No leaderboard, no points, just a machine and a question.",
    price: "Free",
    kind: "offensive",
    href: "https://www.vulnhub.com",
  },
  {
    id: "cyberdefenders",
    name: "CyberDefenders",
    what:
      "Blue-team and forensics challenges built on real images and real traffic, where the answer is what you find rather than a flag.",
    price: "Free",
    kind: "defensive",
    href: "https://cyberdefenders.org",
  },
  {
    id: "letsdefend",
    name: "LetsDefend",
    what:
      "A guided simulation of the first weeks on a SOC, with a queue of alerts to triage and a story that unfolds as you go.",
    price: "Free tier, with a paid tier for the deeper scenarios",
    kind: "defensive",
    href: "https://letsdefend.io",
  },
  {
    id: "splunk-bots",
    name: "Splunk BOTS",
    what:
      "Detection exercises run against a real Splunk instance, which is how most SOCs are actually set up.",
    price: "Free",
    kind: "defensive",
    href: "https://bots.splunk.com",
  },
  {
    id: "overthewire",
    name: "OverTheWire",
    what:
      "Wargames that teach the shell, the protocols and the Unix fundamentals by making you use them.",
    price: "Free",
    kind: "general",
    href: "https://overthewire.org",
  },
  {
    id: "digitalcorpora",
    name: "Digital Corpora",
    what:
      "Forensic images and disk snapshots to practise timeline building on, so you can work on evidence rather than on a live machine.",
    price: "Free",
    kind: "defensive",
    href: "https://www.digitalcorpora.org",
  },
  {
    id: "malware-traffic-analysis",
    name: "Malware Traffic Analysis",
    what:
      "Practical sessions on captured malware traffic: the exercises are old, which is the point, because the behaviour is familiar.",
    price: "Free",
    kind: "defensive",
    href: "https://www.malware-traffic-analysis.net",
  },
  {
    id: "ost2",
    name: "Open Security Training 2",
    what:
      "Long-form security courses with labs, free and open. The place to go when a topic needs more than a weekend.",
    price: "Free",
    kind: "general",
    href: "https://opensecuritytraining.org",
  },
];

/* ------------------------------------------------------------- lookups */

const certById = new Map(CERTIFICATIONS.map((c) => [c.id, c]));
const platformById = new Map(PLATFORMS.map((p) => [p.id, p]));
const roleBySlug = new Map(ROLES.map((r) => [r.slug, r]));

export function getRole(slug: string): Role | undefined {
  return roleBySlug.get(slug);
}

export function getCert(id: string): Certification | undefined {
  return certById.get(id);
}

export function getPlatform(id: string): Platform | undefined {
  return platformById.get(id);
}

/** Every certification that mentions a given role, by walking the roles. */
export function certsForRole(role: Role): Certification[] {
  return role.certs
    .map((id) => certById.get(id))
    .filter((c): c is Certification => Boolean(c));
}

export function platformsForRole(role: Role): Platform[] {
  return role.practice
    .map((id) => platformById.get(id))
    .filter((p): p is Platform => Boolean(p));
}

/** Which roles a certification is worth having for. */
export function rolesForCert(certId: string): Role[] {
  return ROLES.filter((r) => r.certs.includes(certId));
}
