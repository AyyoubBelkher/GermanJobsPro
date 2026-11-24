import React from "react";
import { splitSalaryBidiSegments } from "@/lib/jobUtils";

/**
 * Renders salary ranges with LTR isolation on numeric/currency spans
 * so lower-to-upper bounds stay in proper order in RTL locales.
 */
export default function BidiSalary({ salary }: { salary: string }) {
  const segments = splitSalaryBidiSegments(salary);
  return (
    <>
      {segments.map((seg, idx) =>
        seg.isLtr ? (
          <span key={idx} dir="ltr" className="inline-block [unicode-bidi:isolate]">
            {seg.text}
          </span>
        ) : (
          <React.Fragment key={idx}>{seg.text}</React.Fragment>
        )
      )}
    </>
  );
}
