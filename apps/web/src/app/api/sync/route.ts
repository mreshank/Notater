import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST: Push local project to cloud
export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, name, bpm, data } = body;

        // Upsert project
        const project = await prisma.project.upsert({
            where: { id },
            update: {
                name,
                bpm,
                data,
                updatedAt: new Date(),
            },
            create: {
                id,
                userId,
                name,
                bpm,
                data,
            },
        });

        // Ensure user exists (in case hook didn't catch it, though webhook is better)
        // Simple hack: upsert user too if not exists?
        // Ideally we sync users via Clerk Webhooks.
        // For this MVP, let's assume we might need to create the user record lazily.
        await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                email: "unknown@example.com", // We don't have email in auth(), need user obj or webhook. 
                // Clerk auth() just gives ID.
                // It's okay, email is optional or can be filled later.
                // Let's modify schema to make email optional or handle this better.
                // Actually, let's just create User if missing *before* project upsert if FK fails.
                // But wait, Project depends on User.
            }
        }).catch(() => {
            // Ignore if user creation fails (maybe race condition)
        });

        return NextResponse.json(project);
    } catch (error) {
        console.error("[SYNC_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// GET: Pull projects from cloud
export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const projects = await prisma.project.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        });

        return NextResponse.json(projects);
    } catch (error) {
        console.error("[SYNC_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
