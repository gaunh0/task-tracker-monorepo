import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const app = express();
const prisma = new PrismaClient();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

const FE_TO_DB: Record<string, string> = {
    pending: "pending",
    "in-progress": "in_progress",
    completed: "completed",
};
const DB_TO_FE: Record<string, string> = {
    pending: "pending",
    in_progress: "in-progress",
    completed: "completed",
};

const createTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    project: z.string().min(1),
    deadline: z.string(),
    priority: z.enum(["high", "medium", "low"]).default("medium"),
    status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
    assignee: z.string().optional(),
});
const updateTaskSchema = createTaskSchema.partial();

app.get("/api/projects", async (_req, res) => {
    const projects = await prisma.project.findMany({ orderBy: { name: "asc" } });
    res.json(projects);
});

app.get("/api/tasks", async (req, res) => {
    const { search, project, status, priority } = req.query as any;
    const where: any = {};
    if (project) where.project = { name: project };
    if (status && FE_TO_DB[status]) where.status = FE_TO_DB[status];
    if (priority && ["high", "medium", "low"].includes(priority)) where.priority = priority;
    if (search) where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { assignee: { contains: search, mode: "insensitive" } },
    ];
    const tasks = await prisma.task.findMany({ where, include: { project: true }, orderBy: { createdAt: "desc" } });
    res.json(tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        project: t.project.name,
        deadline: t.deadline.toISOString().slice(0, 10),
        priority: t.priority,
        status: DB_TO_FE[t.status] || t.status,
        assignee: t.assignee,
    })));
});

app.post("/api/tasks", async (req, res) => {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const d = parsed.data;
    const project = await prisma.project.upsert({ where: { name: d.project }, update: {}, create: { name: d.project } });
    const created = await prisma.task.create({
        data: {
            title: d.title,
            description: d.description,
            deadline: new Date(d.deadline),
            priority: d.priority,
            status: FE_TO_DB[d.status],
            assignee: d.assignee,
            projectId: project.id,
        },
        include: { project: true },
    });
    res.status(201).json({
        id: created.id,
        title: created.title,
        description: created.description,
        project: created.project.name,
        deadline: created.deadline.toISOString().slice(0, 10),
        priority: created.priority,
        status: DB_TO_FE[created.status] || created.status,
        assignee: created.assignee,
    });
});

app.put("/api/tasks/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const d = parsed.data;
    let projectId: number | undefined;
    if (d.project) {
        const project = await prisma.project.upsert({ where: { name: d.project }, update: {}, create: { name: d.project } });
        projectId = project.id;
    }
    const updated = await prisma.task.update({
        where: { id },
        data: {
            title: d.title,
            description: d.description,
            deadline: d.deadline ? new Date(d.deadline) : undefined,
            priority: d.priority ?? undefined,
            status: d.status ? FE_TO_DB[d.status] : undefined,
            assignee: d.assignee,
            projectId,
        },
        include: { project: true },
    });
    res.json({
        id: updated.id,
        title: updated.title,
        description: updated.description,
        project: updated.project.name,
        deadline: updated.deadline.toISOString().slice(0, 10),
        priority: updated.priority,
        status: DB_TO_FE[updated.status] || updated.status,
        assignee: updated.assignee,
    });
});

app.delete("/api/tasks/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    await prisma.task.delete({ where: { id } });
    res.status(204).send();
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`[server] http://localhost:${port}`));