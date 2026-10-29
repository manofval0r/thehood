import { describe, expect, it } from "vitest";
import {
  PUBLIC_NAV_GROUPS,
  activePublicGroup,
  activePublicItem,
} from "@/lib/navigation";

describe("public navigation groups", () => {
  it("contains the approved children in their approved order", () => {
    expect(
      PUBLIC_NAV_GROUPS.map((group) => ({
        label: group.label,
        children: group.children.map((child) => child.label),
      }))
    ).toEqual([
      {
        label: "Courses",
        children: ["All courses", "Timetable", "Assessments", "Registration"],
      },
      { label: "Study", children: ["Tools", "Resources"] },
      {
        label: "Campus",
        children: ["Bulletin", "Calendar", "Events", "Careers", "Contact"],
      },
    ]);
  });

  it.each([
    ["/", "Courses"],
    ["/courses/cyb-305", "Courses"],
    ["/view/cyb305-course-overview", "Courses"],
    ["/timetable", "Courses"],
    ["/assessments", "Courses"],
    ["/tools/ftk-imager", "Study"],
    ["/resources", "Study"],
    ["/bulletin", "Campus"],
    ["/timeline", "Campus"],
    ["/careers/soc-analyst", "Campus"],
    ["/contact", "Campus"],
  ])("maps %s to %s", (path, label) => {
    expect(activePublicGroup(path)?.label).toBe(label);
  });

  it("maps nested course and career routes to their overview child", () => {
    expect(activePublicItem("/courses/cyb-305")?.label).toBe("All courses");
    expect(activePublicItem("/view/cyb305-course-overview")?.label).toBe(
      "All courses"
    );
    expect(activePublicItem("/careers/soc-analyst")?.label).toBe("Careers");
  });
});
