import React from "react";
import { localizeSalary, splitSalaryBidiSegments } from "@/lib/jobUtils";

/**
 * Renders salary ranges with locale-appropriate period normalization and
 * LTR isolation on numeric/currency spans so bounds stay ordered in RTL.
 */
export default function BidiSalary({
  salary,
  locale = "ar",
}: {
  salary: string;
  locale?: string;
}) {
  const localizedSalary = localizeSalary(salary, locale);
  const segments = splitSalaryBidiSegments(localizedSalary);
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
