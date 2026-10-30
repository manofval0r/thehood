export interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
  /** Additional route families that belong to this destination. */
  prefixes?: string[];
  description?: string;
}

export interface NavGroup {
  id: "courses" | "study" | "campus";
  label: string;
  href: string;
  children: NavItem[];
}

/** One line that frames the group at the top of the mega menu. */
export const NAV_GROUP_TAGLINES: Record<NavGroup["id"], string> = {
  courses: "Every course, the week's times, and what is due.",
  study: "Software to install and reading beyond the slides.",
  campus: "What is happening now, next, and after graduation.",
};

/**
 * Cross-group shortcuts shown in the mega menu's quick rail. They point at
 * existing pages only, so the rail stays truthful even when a group has few
 * children of its own.
 */
export const NAV_GROUP_QUICK_LINKS: Record<
  NavGroup["id"],
  { href: string; label: string; hint: string }[]
> = {
  courses: [
    { href: "/bulletin", label: "Live bulletin", hint: "Changes as they land" },
    { href: "/tools", label: "Setup tools", hint: "Install before lab" },
  ],
  study: [
    { href: "/timetable", label: "This week", hint: "Times and venues" },
    { href: "/assessments", label: "Deadlines", hint: "Counting down" },
  ],
  campus: [
    { href: "/", label: "All courses", hint: "Files and folders" },
    { href: "/timetable", label: "Timetable", hint: "Subscribe from here" },
  ],
};

export const PUBLIC_NAV_GROUPS: NavGroup[] = [
  {
    id: "courses",
    label: "Courses",
    href: "/",
    children: [
      {
        href: "/",
        label: "All courses",
        exact: true,
        prefixes: ["/courses", "/view"],
        description: "Course files, folders, lecturers and class details",
      },
      {
        href: "/timetable",
        label: "Timetable",
        description: "Weekly times, venues and calendar subscriptions",
      },
      {
        href: "/assessments",
        label: "Assessments",
        description: "Tests, exams, assignments and countdowns",
      },
      {
        href: "/registration",
        label: "Registration",
        description: "The official registered-course list",
      },
    ],
  },
  {
    id: "study",
    label: "Study",
    href: "/tools",
    children: [
      {
        href: "/tools",
        label: "Tools",
        description: "Required software, setup steps and tutorials",
      },
      {
        href: "/resources",
        label: "Resources",
        description: "Papers, practice platforms and external reading",
      },
    ],
  },
  {
    id: "campus",
    label: "Campus",
    href: "/bulletin",
    children: [
      {
        href: "/bulletin",
        label: "Bulletin",
        prefixes: ["/#bulletin"],
        description: "Live classes, changes, notices and events",
      },
      {
        href: "/timeline",
        label: "Calendar",
        description: "The academic year, week by week",
      },
      {
        href: "/events",
        label: "Events",
        description: "Competitions and annual security events",
      },
      {
        href: "/careers",
        label: "Careers",
        description: "Roles, certifications and practice routes",
      },
      {
        href: "/contact",
        label: "Contact",
        description: "Department and lecturer contact information",
      },
    ],
  },
];

export function navItemMatches(item: NavItem, pathname: string): boolean {
  if (item.prefixes?.some((prefix) => pathname.startsWith(prefix))) return true;
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function activePublicItem(pathname: string): NavItem | null {
  for (const group of PUBLIC_NAV_GROUPS) {
    const child = group.children.find((item) => navItemMatches(item, pathname));
    if (child) return child;
  }
  return null;
}

export function activePublicGroup(pathname: string): NavGroup | null {
  return (
    PUBLIC_NAV_GROUPS.find((group) =>
      group.children.some((item) => navItemMatches(item, pathname))
    ) ?? null
  );
}
