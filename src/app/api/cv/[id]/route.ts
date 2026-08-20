import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserSession } from "@/lib/user-session";
import { cvSchema } from "@/lib/validations/cv";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/cv/[id]
 * Fetches the full CV with all nested relations for the authenticated user.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("user_session")?.value;
    const authResult = await verifyUserSession(token);

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const cv = await prisma.cv.findFirst({
      where: {
        id,
        userId: authResult.user.id,
      },
      include: {
        personalInfo: true,
        experiences: { orderBy: { order: "asc" } },
        educations: { orderBy: { order: "asc" } },
        skills: { orderBy: { order: "asc" } },
        languages: { orderBy: { order: "asc" } },
        certifications: { orderBy: { order: "asc" } },
        projects: { orderBy: { order: "asc" } },
      },
    });

    if (!cv) {
      return NextResponse.json(
        { success: false, error: "CV not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        cv,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[GET /api/cv/[id] Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cv/[id]
 * Validates payload and updates top-level CV fields and nested collections atomically.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("user_session")?.value;
    const authResult = await verifyUserSession(token);

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const existingCv = await prisma.cv.findFirst({
      where: {
        id,
        userId: authResult.user.id,
      },
    });

    if (!existingCv) {
      return NextResponse.json(
        { success: false, error: "CV not found" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    const parseResult = cvSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    const updatedCv = await prisma.$transaction(async (tx) => {
      // 1. Update top-level CV metadata
      await tx.cv.update({
        where: { id },
        data: {
          title: data.title,
          language: data.language,
          isDraft: data.isDraft,
        },
      });

      // 2. Update / Upsert personal info
      if (data.personalInfo) {
        await tx.cvPersonalInfo.upsert({
          where: { cvId: id },
          create: {
            cvId: id,
            fullName: data.personalInfo.fullName,
            email: data.personalInfo.email,
            phone: data.personalInfo.phone || null,
            address: data.personalInfo.address || null,
            photoUrl: data.personalInfo.photoUrl || null,
            birthDate: data.personalInfo.birthDate || null,
            birthPlace: data.personalInfo.birthPlace || null,
            nationality: data.personalInfo.nationality || null,
            targetJobTitle: data.personalInfo.targetJobTitle || null,
            linkedinUrl: data.personalInfo.linkedinUrl || null,
            xingUrl: data.personalInfo.xingUrl || null,
            summary: data.personalInfo.summary || null,
          },
          update: {
            fullName: data.personalInfo.fullName,
            email: data.personalInfo.email,
            phone: data.personalInfo.phone || null,
            address: data.personalInfo.address || null,
            photoUrl: data.personalInfo.photoUrl || null,
            birthDate: data.personalInfo.birthDate || null,
            birthPlace: data.personalInfo.birthPlace || null,
            nationality: data.personalInfo.nationality || null,
            targetJobTitle: data.personalInfo.targetJobTitle || null,
            linkedinUrl: data.personalInfo.linkedinUrl || null,
            xingUrl: data.personalInfo.xingUrl || null,
            summary: data.personalInfo.summary || null,
          },
        });
      }

      // 3. Sync experiences
      await tx.cvExperience.deleteMany({ where: { cvId: id } });
      if (data.experiences && data.experiences.length > 0) {
        await tx.cvExperience.createMany({
          data: data.experiences.map((exp, idx) => ({
            cvId: id,
            company: exp.company,
            position: exp.position,
            city: exp.city || null,
            country: exp.country || "Germany",
            startDate: exp.startDate,
            endDate: exp.endDate || null,
            isCurrent: exp.isCurrent ?? false,
            description: exp.description || null,
            order: exp.order !== undefined ? exp.order : idx,
          })),
        });
      }

      // 4. Sync educations
      await tx.cvEducation.deleteMany({ where: { cvId: id } });
      if (data.educations && data.educations.length > 0) {
        await tx.cvEducation.createMany({
          data: data.educations.map((edu, idx) => ({
            cvId: id,
            institution: edu.institution,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy || null,
            city: edu.city || null,
            country: edu.country || null,
            startDate: edu.startDate,
            endDate: edu.endDate || null,
            isCurrent: edu.isCurrent ?? false,
            grade: edu.grade || null,
            description: edu.description || null,
            order: edu.order !== undefined ? edu.order : idx,
          })),
        });
      }

      // 5. Sync skills
      await tx.cvSkill.deleteMany({ where: { cvId: id } });
      if (data.skills && data.skills.length > 0) {
        await tx.cvSkill.createMany({
          data: data.skills.map((skill, idx) => ({
            cvId: id,
            name: skill.name,
            category: skill.category || null,
            level: skill.level || null,
            order: skill.order !== undefined ? skill.order : idx,
          })),
        });
      }

      // 6. Sync languages
      await tx.cvLanguage.deleteMany({ where: { cvId: id } });
      if (data.languages && data.languages.length > 0) {
        await tx.cvLanguage.createMany({
          data: data.languages.map((lang, idx) => ({
            cvId: id,
            language: lang.language,
            proficiency: lang.proficiency,
            order: lang.order !== undefined ? lang.order : idx,
          })),
        });
      }

      // 7. Sync certifications
      await tx.cvCertification.deleteMany({ where: { cvId: id } });
      if (data.certifications && data.certifications.length > 0) {
        await tx.cvCertification.createMany({
          data: data.certifications.map((cert, idx) => ({
            cvId: id,
            name: cert.name,
            issuer: cert.issuer,
            issueDate: cert.issueDate || null,
            expiryDate: cert.expiryDate || null,
            credentialUrl: cert.credentialUrl || null,
            order: cert.order !== undefined ? cert.order : idx,
          })),
        });
      }

      // 8. Sync projects
      await tx.cvProject.deleteMany({ where: { cvId: id } });
      if (data.projects && data.projects.length > 0) {
        await tx.cvProject.createMany({
          data: data.projects.map((proj, idx) => ({
            cvId: id,
            title: proj.title,
            role: proj.role || null,
            url: proj.url || null,
            description: proj.description || null,
            order: proj.order !== undefined ? proj.order : idx,
          })),
        });
      }

      // 9. Fetch and return fresh updated state
      return tx.cv.findUnique({
        where: { id },
        include: {
          personalInfo: true,
          experiences: { orderBy: { order: "asc" } },
          educations: { orderBy: { order: "asc" } },
          skills: { orderBy: { order: "asc" } },
          languages: { orderBy: { order: "asc" } },
          certifications: { orderBy: { order: "asc" } },
          projects: { orderBy: { order: "asc" } },
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "CV updated successfully",
        cv: updatedCv,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[PUT /api/cv/[id] Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cv/[id]
 * Deletes CV ensuring authenticated user ownership.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("user_session")?.value;
    const authResult = await verifyUserSession(token);

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const existingCv = await prisma.cv.findFirst({
      where: {
        id,
        userId: authResult.user.id,
      },
    });

    if (!existingCv) {
      return NextResponse.json(
        { success: false, error: "CV not found" },
        { status: 404 }
      );
    }

    await prisma.cv.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "CV deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[DELETE /api/cv/[id] Error]:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
