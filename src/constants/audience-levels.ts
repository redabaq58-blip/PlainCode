import type { AudienceLevel } from "@/types/explanation";

export const AUDIENCE_LEVELS: {
  value: AudienceLevel;
  label: string;
  short: string;
  description: string;
}[] = [
  {
    value: "ELI5",
    label: "Explain Like I'm 5",
    short: "ELI5",
    description: "Simple everyday analogies, no tech terms",
  },
  {
    value: "NON_TECHNICAL",
    label: "Non-Technical",
    short: "Non-Tech",
    description: "Plain English, no code or jargon",
  },
  {
    value: "BUSINESS_CONTEXT",
    label: "Business Context",
    short: "Business",
    description: "What does this mean for the product or users?",
  },
  {
    value: "TECHNICAL_NON_DEV",
    label: "Technical (Non-Dev)",
    short: "Tech Non-Dev",
    description: "Technical vocab OK, actual code syntax not needed",
  },
  {
    value: "DEVELOPER_PEER",
    label: "Developer Peer",
    short: "Developer",
    description: "Full technical language, code smells, architecture",
  },
];
