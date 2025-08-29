import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const projectNames = [
        "Website Doanh Nghiệp",
        "Ứng dụng Quản Lý",
        "Hệ thống CRM",
        "Nền tảng E-learning",
    ];

    const projects = await Promise.all(
        projectNames.map((name) =>
            prisma.project.upsert({ where: { name }, update: {}, create: { name } })
        )
    );
    const find = (n: string) => projects.find((p) => p.name === n)!;

    await prisma.task.createMany({
        data: [
            {
                title: "Thiết kế giao diện dashboard",
                description: "Tạo wireframe và thiết kế UI cho trang dashboard chính",
                projectId: find("Website Doanh Nghiệp").id,
                deadline: new Date("2024-01-15"),
                priority: "high",
                status: "in_progress",
                assignee: "Nguyễn Văn A"
            },
            {
                title: "Phân tích yêu cầu khách hàng",
                description: "Thu thập và phân tích yêu cầu chi tiết từ khách hàng",
                projectId: find("Ứng dụng Quản Lý").id,
                deadline: new Date("2024-01-10"),
                priority: "medium",
                status: "completed",
                assignee: "Trần Thị B"
            },
            {
                title: "Triển khai API backend",
                description: "Xây dựng các endpoint API cho chức năng chính",
                projectId: find("Hệ thống CRM").id,
                deadline: new Date("2024-01-20"),
                priority: "high",
                status: "pending",
                assignee: "Lê Văn C"
            },
            {
                title: "Kiểm thử tích hợp",
                description: "Thực hiện kiểm thử tích hợp các module",
                projectId: find("Website Doanh Nghiệp").id,
                deadline: new Date("2024-01-12"),
                priority: "medium",
                status: "in_progress",
                assignee: "Phạm Thị D"
            }
        ]
    });
    console.log("Seeded!");
}

main().finally(() => prisma.$disconnect());