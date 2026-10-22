export interface Resource {
  id: string;
  title: string;
  /** MIME family used for icons & preview handling. */
  type: "pdf" | "pptx" | "xlsx" | "doc" | "other";
  /** Path relative to public/. Segments are encoded at render time. */
  url: string;
  size?: string;
}

export interface CourseTimetable {
  day: string;
  time: string;
  venue: string;
  lecturer: string;
}

export interface CourseSession {
  day: string;
  /** "1:00pm - 4:00pm". */
  time: string;
  venue: string;
}

export interface Course {
  code: string;
  slug: string;
  title: string;
  units: number;
  lecturer: string;
  venue: string;
  day: string;
  time: string;
  program: string;
  level: string;
  timetable: CourseTimetable;
  /**
   * Further weekly meetings of the same course, for a course that meets more
   * than once a week.
   *
   * The primary day/time/venue above is the one the course is known by. These
   * are additional sessions and must be added here rather than on the
   * timetable page, because the timetable is derived from the manifest and the
   * countdown reads the same manifest. A session typed only into the timetable
   * page is a class the site believes does not happen.
   */
  extraSessions?: CourseSession[];
  resources: Resource[];
}

const base = "/courses";

export const COURSES: Course[] = [
  {
    code: "GST 312",
    slug: "gst-312",
    title: "Peace and Conflict Resolution",
    units: 2,
    lecturer: "Ikechukwu Alamezie",
    venue: "PG 2",
    day: "Tuesday",
    time: "3:00pm - 5:00pm",
    program: "COS/CYB",
    level: "300",
    timetable: {
      day: "Tuesday",
      time: "3:00pm - 5:00pm",
      venue: "PG 2",
      lecturer: "Ikechukwu Alamezie",
    },
    resources: [
      {
        id: "gst312-session-1",
        title: "Session 1 - Peace and Conflict Resolution",
        type: "pptx",
        url: `${base}/Peace and Conflict Resolution/Session 1- Peace and Conflict Resolution. (1).pptx`,
      },
    ],
  },
  {
    code: "NUT-MAN 315",
    slug: "nut-man-315",
    title: "Marketing Management",
    units: 2,
    lecturer: "Dr Ebes",
    venue: "PG 2",
    day: "Tuesday",
    time: "9:00am - 11:00am",
    program: "COS/CYB",
    level: "300",
    timetable: {
      day: "Tuesday",
      time: "9:00am - 11:00am",
      venue: "PG 2",
      lecturer: "Dr Ebes",
    },
    resources: [
      {
        id: "nutman315-intro",
        title: "Introduction to Marketing Management",
        type: "pptx",
        url: `${base}/Marketing Management/Intro_to_Marketing_Management.pptx`,
      },
      {
        id: "nutman315-group-assignment",
        title: "Group Assignment - Marketing Management",
        type: "pdf",
        url: `${base}/Marketing Management/Group Assignment_NUTMAN315_Marketing Management.pdf`,
      },
      {
        id: "nutman315-proctor",
        title: "Marketing Information Systems (Proctor, 1991)",
        type: "pdf",
        url: `${base}/Marketing Management/Proctor 1991 Marketing Information Systems.pdf`,
      },
    ],
  },
  {
    code: "NUT-CSC 301",
    slug: "nut-csc-301",
    title: "Digital Sovereignty: Governance, Technology and Implementation",
    units: 2,
    lecturer: "Prof Sinjay",
    venue: "PG 2",
    day: "Tuesday",
    time: "12:00pm - 2:00pm",
    program: "COS/CYB",
    level: "300",
    timetable: {
      day: "Tuesday",
      time: "12:00pm - 2:00pm",
      venue: "PG 2",
      lecturer: "Prof Sinjay",
    },
    resources: [],
  },
  {
    code: "CSC 309",
    slug: "csc-309",
    title: "Artificial Intelligence",
    units: 2,
    lecturer: "Charles Igah",
    venue: "Cybersecurity Lab",
    day: "Thursday",
    time: "3:00pm - 5:00pm",
    program: "COS/CYB",
    level: "300",
    timetable: {
      day: "Thursday",
      time: "3:00pm - 5:00pm",
      venue: "Cybersecurity Lab",
      lecturer: "Charles Igah",
    },
    resources: [
      {
        id: "csc309-course-outline",
        title: "CSC 309 Course Outline",
        type: "pdf",
        url: `${base}/Artificial Intelligence/CSC309_Course_Outline.pdf`,
      },
      {
        id: "csc309-foundations-of-ai",
        title: "Foundations of AI",
        type: "pdf",
        url: `${base}/Artificial Intelligence/CSC309_Foundations_of_AI.pdf`,
      },
    ],
  },
  {
    code: "NUT-CSC 312",
    slug: "nut-csc-312",
    title: "Data Structures",
    units: 3,
    lecturer: "Jeremiah Ocheni",
    venue: "Software Lab",
    day: "Wednesday",
    time: "9:00am - 12:00pm",
    program: "COS/CYB",
    level: "300",
    timetable: {
      day: "Wednesday",
      time: "9:00am - 12:00pm",
      venue: "Software Lab",
      lecturer: "Jeremiah Ocheni",
    },
    resources: [
      {
        id: "csc312-ds",
        title: "CSC301 Data Structures",
        type: "pptx",
        url: `${base}/Data Structures/CSC301 Data Structures.pptx`,
      },
      {
        id: "csc312-week1",
        title: "Week 1 - Data Management Foundations",
        type: "pptx",
        url: `${base}/Data Structures/DTS304_Week1_Data_Management_Foundations.pptx`,
      },
    ],
  },
  {
    code: "CYB 301",
    slug: "cyb-301",
    title: "Cryptography Techniques, Algorithms and Applications",
    units: 2,
    lecturer: "Dr Steve",
    venue: "Cybersecurity Lab",
    day: "Thursday",
    time: "12:30pm - 2:30pm",
    program: "Cybersecurity",
    level: "300",
    timetable: {
      day: "Thursday",
      time: "12:30pm - 2:30pm",
      venue: "Cybersecurity Lab",
      lecturer: "Dr Steve",
    },
    resources: [],
  },
  {
    code: "CYB 303",
    slug: "cyb-303",
    title: "Cybersecurity Risks Analysis, Challenges and Mitigation",
    units: 2,
    lecturer: "Dr Faki",
    venue: "Cybersecurity Lab",
    day: "Wednesday",
    time: "3:00pm - 5:00pm",
    program: "Cybersecurity",
    level: "300",
    // A second weekly meeting, Monday mornings in PG 2. Declared here so the
    // timetable and the countdown both know about it.
    extraSessions: [{ day: "Monday", time: "10:00am - 12:00pm", venue: "PG 2" }],
    timetable: {
      day: "Wednesday",
      time: "3:00pm - 5:00pm",
      venue: "Cybersecurity Lab",
      lecturer: "Dr Faki",
    },
    resources: [],
  },
  {
    code: "CYB 305",
    slug: "cyb-305",
    title: "Digital Forensics and Investigation Methods",
    units: 2,
    lecturer: "Dr Segun",
    venue: "Cybersecurity Lab",
    day: "Wednesday",
    time: "12:30pm - 2:30pm",
    program: "Cybersecurity",
    level: "300",
    timetable: {
      day: "Wednesday",
      time: "12:30pm - 2:30pm",
      venue: "Cybersecurity Lab",
      lecturer: "Dr Segun",
    },
    resources: [
      {
        id: "cyb305-course-overview",
        title: "CYB 305 Course Overview",
        type: "pdf",
        url: `${base}/Digital Forensics CYB305/CYB305_Course Overview.pdf`,
      },
      {
        id: "cyb305-week1-fundamentals",
        title: "Week 1 - Computer Forensics Fundamentals",
        type: "pdf",
        url: `${base}/Digital Forensics CYB305/Week 1_Computer Forensics Fundamentals.pdf`,
      },
      {
        id: "cyb305-readme",
        title: "Lab Evidence Manual - README_FIRST",
        type: "doc",
        url: `${base}/Digital Forensics CYB305/CYB305 Lab Evidence Manual/README_FIRST.txt`,
      },
      {
        id: "cyb305-preliminary",
        title: "Preliminary Report (DRAFT)",
        type: "doc",
        url: `${base}/Digital Forensics CYB305/CYB305 Lab Evidence Manual/CYB305-001_Preliminary_Report_DRAFT.txt`,
      },
      {
        id: "cyb305-sha256",
        title: "SHA256 Source Manifest",
        type: "doc",
        url: `${base}/Digital Forensics CYB305/CYB305 Lab Evidence Manual/SHA256_SOURCE_MANIFEST.csv`,
      },
      {
        id: "cyb305-student-template",
        title: "Student Report Template",
        type: "doc",
        url: `${base}/Digital Forensics CYB305/CYB305 Lab Evidence Manual/STUDENT_REPORT_TEMPLATE.txt`,
      },
      {
        id: "cyb305-inference-config",
        title: "Inference Provider Config (JSON)",
        type: "doc",
        url: `${base}/Digital Forensics CYB305/CYB305 Lab Evidence Manual/setting-up-inference-dahl-global-provider.json`,
      },
    ],
  },
  {
    code: "NUT-CSC 310",
    slug: "nut-csc-310",
    title: "Distributed System Security",
    units: 3,
    lecturer: "Pending",
    venue: "Cybersecurity Lab",
    day: "Thursday",
    time: "9:00am - 12:00pm",
    program: "Cybersecurity",
    level: "300",
    timetable: {
      day: "Thursday",
      time: "9:00am - 12:00pm",
      venue: "Cybersecurity Lab",
      lecturer: "Pending",
    },
    resources: [],
  },
  {
    code: "NUT-CYB 312",
    slug: "nut-cyb-312",
    title: "Secure Coding",
    units: 3,
    lecturer: "Dr Faki",
    venue: "Cybersecurity Lab",
    day: "Monday",
    time: "1:00pm - 4:00pm",
    program: "Cybersecurity",
    level: "300",
    timetable: {
      day: "Monday",
      time: "1:00pm - 4:00pm",
      venue: "Cybersecurity Lab",
      lecturer: "Dr Faki",
    },
    resources: [],
  },
];

/** Look up a course by slug (the URL-friendly course code). */
export function getCourse(slug: string) {
  return COURSES.find((c) => c.slug === slug);
}

/**
 * Encode each path segment so spaces and parentheses survive in a URL.
 *
 * An absolute URL is passed through. A file that staff uploaded is served
 * from Supabase Storage, and encoding that would turn the "https:" into
 * "https%3A" and break it.
 */
export function resourceUrl(url: string) {
  if (/^https?:\/\//.test(url)) return url;
  return url.split("/").map(encodeURIComponent).join("/");
}

export const TIMETABLE_PDF = "/docs/300L_Cyber-Security_Timetable (1).pdf";
export const REGISTRATION_PDF = "/docs/300 Level CyberSecurity Course Registration List .pdf";

/**
 * The shared Drive folder, with every course in it.
 *
 * The department keeps the course material on Google Drive, and this is
 * where it lives. The site's own copies are the ones that can be read in
 * the browser, so this is offered as the shared folder rather than as a
 * replacement for them: a student who wants the whole programme in one
 * place follows this, and a student who wants to read a file follows the
 * search.
 */
export const DRIVE_FOLDER =
  "https://drive.google.com/drive/folders/1LWs8PQH4gtgH44L06cGi3PVJpr7frIb5?usp=sharing";

export const ALL_RESOURCES = COURSES.flatMap((c) =>
  c.resources.map((r) => ({ ...r, course: c }))
);
