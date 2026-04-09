import { PromptType } from "@/lib/constants";
import { prisma } from "../lib/prisma";

const prompts = {
  MOVE: [
    "Stand up and do 10 seconds of power poses as a team.",
    "Each teammate finds one object in the room that represents innovation.",
    "Do a quick shoulder roll sequence together for 20 seconds.",
    "Form a shape with your team that represents 'momentum'.",
    "Take a 15-second silent walk and return with one observation.",
    "Swap seats with someone from another team and introduce yourselves.",
    "Do three synchronized claps and a team cheer.",
    "Stretch your arms wide and share one word that describes your energy.",
    "Build a human arrow pointing to where the future is headed.",
    "Stand in a line by birth month, no talking allowed.",
  ],
  TALK: [
    "What is one customer frustration you wish disappeared overnight?",
    "Share a small process change that had a surprisingly big impact.",
    "If your product had a personality, what trait should it lose?",
    "What is one assumption in your industry that feels outdated?",
    "Name one moment when a constraint improved your outcome.",
    "What would your team attempt if approval was guaranteed?",
    "Which emerging behavior are your customers quietly showing?",
    "What is one risk worth testing in the next 30 days?",
    "Describe a recent idea that failed fast and taught a lot.",
    "What does 'frictionless' mean for your customer in one sentence?",
  ],
  CREATE: [
    "Sketch a one-minute concept for a service with zero forms.",
    "Invent a new onboarding ritual for first-time users.",
    "Create a tagline for a product that prevents rework.",
    "Design a 'before and after' customer journey in 3 steps.",
    "Build a metaphor for your roadmap using weather terms.",
    "Create a feature name that sounds impossible but useful.",
    "Draft a voice assistant command that solves a daily annoyance.",
    "Write a two-line pitch for a solution that saves 10 minutes daily.",
    "Combine two unrelated industries and name the resulting offering.",
    "Create a tiny experiment you could run by tomorrow afternoon.",
  ],
};

async function main() {
  const all = [
    ...prompts.MOVE.map((text) => ({ text, type: "MOVE" as PromptType })),
    ...prompts.TALK.map((text) => ({ text, type: "TALK" as PromptType })),
    ...prompts.CREATE.map((text) => ({ text, type: "CREATE" as PromptType })),
  ];

  for (const prompt of all) {
    await prisma.prompt.upsert({
      where: { id: `${prompt.type}-${prompt.text}`.replace(/\s+/g, "-").slice(0, 191) },
      update: { text: prompt.text, type: prompt.type, enabled: true },
      create: {
        id: `${prompt.type}-${prompt.text}`.replace(/\s+/g, "-").slice(0, 191),
        text: prompt.text,
        type: prompt.type,
        enabled: true,
      },
    });
  }

  console.log(`Seeded ${all.length} prompts`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
