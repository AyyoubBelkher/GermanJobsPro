"use client";

import React from "react";
import {
  FrenchCvData,
  formatFrenchHeaderName,
  getFrenchCvSectionOrder,
} from "@/lib/cv-fr";

interface FrenchCvPreviewProps {
  data: FrenchCvData;
}

export default function FrenchCvPreview({ data }: FrenchCvPreviewProps) {
  const isModern = data.template === "maroc-modern";
  const accent = data.accentColor || "#1e3a5f";
  const fullName = formatFrenchHeaderName(data.header.firstName, data.header.lastName);

  const contactItems = [
    data.header.city?.trim(),
    data.header.phone?.trim(),
    data.header.email?.trim(),
    data.header.mobility?.trim(),
    data.header.drivingLicense?.trim(),
    data.header.linkedin?.trim(),
  ].filter((item): item is string => Boolean(item && item.length > 0));

  const showPhoto =
    isModern &&
    Boolean(data.header.showPhoto) &&
    Boolean(data.header.photoDataUrl && data.header.photoDataUrl.trim().length > 0);

  const validExperiences = data.experiences.filter(
    (exp) =>
      exp.role.trim() ||
      exp.company.trim() ||
      exp.bullets.some((b) => b.trim().length > 0)
  );

  const validEducations = data.educations.filter(
    (edu) => edu.degree.trim() || edu.institution.trim() || edu.year.trim()
  );

  const validLanguages = data.languages.filter(
    (lang) => lang.language.trim() || lang.level.trim()
  );

  const hasSkills =
    data.skills.technicalSkills.length > 0 ||
    data.skills.softSkills.length > 0 ||
    data.skills.certifications.length > 0;

  const sectionOrder = getFrenchCvSectionOrder(data.educationFirst);

  const sectionHeadingStyle: React.CSSProperties = {
    color: isModern ? accent : "#0f172a",
    borderBottomColor: isModern ? accent : "#cbd5e1",
  };

  const renderExperiences = () => {
    if (validExperiences.length === 0) return null;
    return (
      <section key="experience" className="mb-4">
        <h2
          style={sectionHeadingStyle}
          className="text-[11px] font-bold uppercase tracking-wider border-b pb-1 mb-2"
        >
          Expériences Professionnelles
        </h2>
        <div className="space-y-2.5">
          {validExperiences.map((exp) => {
            const period = exp.current
              ? exp.startDate
                ? `${exp.startDate} – Présent`
                : "Présent"
              : [exp.startDate, exp.endDate].filter(Boolean).join(" – ");
            const cleanBullets = exp.bullets.map((b) => b.trim()).filter(Boolean);

            return (
              <div key={exp.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[12px] font-bold text-slate-900">
                    {exp.role || "Poste"}
                  </h3>
                  {period && (
                    <span
                      style={{ color: isModern ? accent : "#475569" }}
                      className="text-[10.5px] font-semibold shrink-0"
                    >
                      {period}
                    </span>
                  )}
                </div>
                {(exp.company || exp.city) && (
                  <p className="text-[11px] italic text-slate-600 mb-1">
                    {[exp.company, exp.city].filter(Boolean).join(" — ")}
                  </p>
                )}
                {cleanBullets.length > 0 && (
                  <ul className="space-y-0.5 pl-3">
                    {cleanBullets.map((bullet, idx) => (
                      <li
                        key={`${exp.id}-b-${idx}`}
                        className="text-[11px] text-slate-800 leading-snug flex items-start gap-1.5"
                      >
                        <span
                          style={{ color: isModern ? accent : "#0f172a" }}
                          className="font-bold select-none"
                        >
                          •
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderEducations = () => {
    if (validEducations.length === 0) return null;
    return (
      <section key="education" className="mb-4">
        <h2
          style={sectionHeadingStyle}
          className="text-[11px] font-bold uppercase tracking-wider border-b pb-1 mb-2"
        >
          Formation
        </h2>
        <div className="space-y-2">
          {validEducations.map((edu) => (
            <div key={edu.id}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[12px] font-bold text-slate-900">
                  {edu.degree || "Diplôme"}
                </h3>
                {edu.year && (
                  <span
                    style={{ color: isModern ? accent : "#475569" }}
                    className="text-[10.5px] font-semibold shrink-0"
                  >
                    {edu.year}
                  </span>
                )}
              </div>
              {(edu.institution || edu.city) && (
                <p className="text-[11px] italic text-slate-600">
                  {[edu.institution, edu.city].filter(Boolean).join(" — ")}
                </p>
              )}
              {edu.details?.trim() && (
                <p className="text-[10.5px] text-slate-700 mt-0.5">{edu.details.trim()}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const isEmpty =
    !data.header.firstName.trim() &&
    !data.header.lastName.trim() &&
    !data.header.jobTitle.trim() &&
    !data.summary.trim() &&
    validExperiences.length === 0 &&
    validEducations.length === 0;

  return (
    <div
      dir="ltr"
      lang="fr"
      className="cv-print-area bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 w-full max-w-[794px] mx-auto p-6 sm:p-9 min-h-[760px] font-sans text-left"
    >
      {/* Header */}
      <header
        style={{
          borderBottomColor: isModern ? accent : "#0f172a",
        }}
        className={`pb-3.5 mb-4 border-b-2 ${
          isModern ? "flex items-start justify-between gap-4" : ""
        }`}
      >
        <div className="flex-1 min-w-0">
          <h1
            style={{ color: isModern ? accent : "#0f172a" }}
            className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight"
          >
            {fullName}
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">
            {data.header.jobTitle?.trim() || "Titre du poste visé"}
          </p>
          {contactItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10.5px] text-slate-600">
              {contactItems.map((item, idx) => (
                <span key={`pv-c-${idx}`} className="inline-flex items-center">
                  {idx > 0 && <span className="mr-3 text-slate-300">|</span>}
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {showPhoto && (
          <div
            style={{ borderColor: accent }}
            className="w-16 h-20 rounded-md overflow-hidden border shrink-0 bg-slate-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.header.photoDataUrl}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </header>

      {isEmpty && (
        <div className="py-6 px-4 mb-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
          Commencez à remplir les champs à gauche (ou cliquez sur « Charger un exemple Maroc ») pour voir votre CV en direct.
        </div>
      )}

      {/* Profil Professionnel */}
      {data.summary?.trim() && (
        <section className="mb-4">
          <h2
            style={sectionHeadingStyle}
            className="text-[11px] font-bold uppercase tracking-wider border-b pb-1 mb-2"
          >
            Profil Professionnel
          </h2>
          <p className="text-[11px] text-slate-800 leading-relaxed whitespace-pre-line">
            {data.summary.trim()}
          </p>
        </section>
      )}

      {/* Formation & Expériences ordered by educationFirst */}
      {sectionOrder.map((key) =>
        key === "education" ? renderEducations() : renderExperiences()
      )}

      {/* Compétences */}
      {hasSkills && (
        <section className="mb-4">
          <h2
            style={sectionHeadingStyle}
            className="text-[11px] font-bold uppercase tracking-wider border-b pb-1 mb-2"
          >
            Compétences
          </h2>
          <div className="space-y-1 text-[11px] text-slate-800">
            {data.skills.technicalSkills.length > 0 && (
              <p>
                <span className="font-bold text-slate-900">Compétences techniques : </span>
                {data.skills.technicalSkills.join(" • ")}
              </p>
            )}
            {data.skills.softSkills.length > 0 && (
              <p>
                <span className="font-bold text-slate-900">Qualités personnelles : </span>
                {data.skills.softSkills.join(" • ")}
              </p>
            )}
            {data.skills.certifications.length > 0 && (
              <p>
                <span className="font-bold text-slate-900">Certifications : </span>
                {data.skills.certifications.join(" • ")}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Langues */}
      {validLanguages.length > 0 && (
        <section className="mb-4">
          <h2
            style={sectionHeadingStyle}
            className="text-[11px] font-bold uppercase tracking-wider border-b pb-1 mb-2"
          >
            Langues
          </h2>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-800">
            {validLanguages.map((lang) => (
              <span key={lang.id}>
                <span className="font-bold text-slate-900">{lang.language}</span>
                {lang.level ? ` (${lang.level})` : ""}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Centres d'intérêt & Vie associative */}
      {data.interests.length > 0 && (
        <section>
          <h2
            style={sectionHeadingStyle}
            className="text-[11px] font-bold uppercase tracking-wider border-b pb-1 mb-2"
          >
            Centres d&apos;intérêt &amp; Vie associative
          </h2>
          <p className="text-[11px] text-slate-800">{data.interests.join(" • ")}</p>
        </section>
      )}
    </div>
  );
}
