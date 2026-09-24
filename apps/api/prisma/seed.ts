import { demoAccount } from "@maia-hub/shared";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const skillNames = [
  "UI/UX Design",
  "Design Gráfico",
  "Fotografia",
  "Vídeo/Motion",
  "Desenvolvimento Web",
  "Desenvolvimento Mobile",
  "Ilustração",
  "Redação/Copywriting",
  "Branding/Identidade Visual",
  "Social Media",
  "Edição de Áudio",
  "Animação 3D",
] as const;

const password = demoAccount.password;

const creators = [
  {
    name: demoAccount.name,
    email: demoAccount.email,
    bio: "Designer de produto. Gosto de retrato, interface e luz natural.",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    skills: ["UI/UX Design", "Fotografia"],
    works: [
      {
        type: "PROJECT" as const,
        title: "Série de retratos",
        body: "Primeiro projeto no MAIA Hub: retratos com luz natural, feitos no fim da tarde.",
        externalLink: "https://unsplash.com/photos/woman-in-black-spaghetti-strap-top-mEZ3PoFGs_k",
        imageUrls: [
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80",
        ],
      },
    ],
  },
  {
    name: "Ana Criadora",
    email: "ana@maiahub.dev",
    bio: "Fotógrafa e designer de interfaces.",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
    skills: ["Fotografia", "UI/UX Design"],
    works: [
      {
        type: "PROJECT" as const,
        title: "Caderno de luz",
        body: "Um ensaio curto sobre sombra, pele e janela. Ainda estou editando a sequência.",
        externalLink: "",
        imageUrls: [
          "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
        ],
      },
    ],
  },
  {
    name: "Bruno Dev",
    email: "bruno@maiahub.dev",
    bio: "Desenvolvedor web. Interfaces pequenas, detalhes grandes.",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    skills: ["Desenvolvimento Web"],
    works: [
      {
        type: "POST" as const,
        title: "",
        body: "Pequenas interfaces, grandes detalhes. Estou testando um fluxo de publicação mais calmo para o portfólio.",
        externalLink: "",
        imageUrls: [],
      },
    ],
  },
  {
    name: "Lia Martins",
    email: "lia@maiahub.dev",
    bio: "Ilustradora editorial.",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    skills: ["Ilustração", "Design Gráfico"],
    works: [
      {
        type: "PROJECT" as const,
        title: "Capa de revista",
        body: "Estudo de capa para uma revista de cidade. Traço solto e paleta quente.",
        externalLink: "",
        imageUrls: [
          "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80",
        ],
      },
    ],
  },
  {
    name: "Helena Luz",
    email: "helena@maiahub.dev",
    bio: "Redatora e social media para estúdios criativos.",
    avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    skills: ["Redação/Copywriting", "Social Media"],
    works: [
      {
        type: "POST" as const,
        title: "Texto que cabe no olhar",
        body: "Uma legenda boa não explica a foto. Ela deixa a pessoa querer ficar mais um segundo.",
        externalLink: "",
        imageUrls: [],
      },
    ],
  },
];

async function main() {
  for (const name of skillNames) {
    await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const skills = await prisma.skill.findMany();
  const skillIdByName = new Map(skills.map((skill) => [skill.name, skill.id]));
  const passwordHash = await bcrypt.hash(password, 12);
  const userIds = new Map<string, string>();

  for (const creator of creators) {
    const user = await prisma.user.upsert({
      where: { email: creator.email },
      update: {
        name: creator.name,
        bio: creator.bio,
        avatarUrl: creator.avatarUrl,
        passwordHash,
      },
      create: {
        email: creator.email,
        name: creator.name,
        bio: creator.bio,
        avatarUrl: creator.avatarUrl,
        passwordHash,
      },
    });
    userIds.set(creator.email, user.id);

    await prisma.userSkill.deleteMany({ where: { userId: user.id } });
    const skillIds = creator.skills.map((skillName) => {
      const skillId = skillIdByName.get(skillName);
      if (!skillId) {
        throw new Error(`Habilidade não encontrada: ${skillName}`);
      }
      return { userId: user.id, skillId };
    });
    await prisma.userSkill.createMany({ data: skillIds });

    for (const work of creator.works) {
      const existing = await prisma.content.findFirst({
        where: { authorId: user.id, title: work.title.length > 0 ? work.title : null, body: work.body },
      });
      const content = existing
        ? await prisma.content.update({
            where: { id: existing.id },
            data: {
              type: work.type,
              title: work.title.length > 0 ? work.title : null,
              body: work.body,
              externalLink: work.externalLink.length > 0 ? work.externalLink : null,
            },
          })
        : await prisma.content.create({
            data: {
              authorId: user.id,
              type: work.type,
              title: work.title.length > 0 ? work.title : null,
              body: work.body,
              externalLink: work.externalLink.length > 0 ? work.externalLink : null,
            },
          });

      await prisma.contentImage.deleteMany({ where: { contentId: content.id } });
      if (work.imageUrls.length > 0) {
        await prisma.contentImage.createMany({
          data: work.imageUrls.map((url, order) => ({ contentId: content.id, url, order })),
        });
      }
    }
  }

  const marinaId = userIds.get(demoAccount.email);
  if (!marinaId) {
    return;
  }

  const others = [...userIds.values()].filter((id) => id !== marinaId);
  for (const followingId of others) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: marinaId, followingId } },
      update: {},
      create: { followerId: marinaId, followingId },
    });
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: followingId, followingId: marinaId } },
      update: {},
      create: { followerId: followingId, followingId: marinaId },
    });
  }

  const portrait = await prisma.content.findFirst({
    where: { authorId: marinaId, title: "Série de retratos" },
  });
  const brunoId = userIds.get("bruno@maiahub.dev");
  if (portrait && brunoId) {
    const alreadyCommented = await prisma.comment.findFirst({
      where: { userId: brunoId, contentId: portrait.id, body: "A luz desse retrato ficou muito boa." },
    });
    if (!alreadyCommented) {
      await prisma.comment.create({
        data: {
          userId: brunoId,
          contentId: portrait.id,
          body: "A luz desse retrato ficou muito boa.",
        },
      });
    }
    await prisma.like.upsert({
      where: { userId_contentId: { userId: brunoId, contentId: portrait.id } },
      update: {},
      create: { userId: brunoId, contentId: portrait.id },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
