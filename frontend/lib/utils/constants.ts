import type { AttackVector, Severity, UpdateType, TagType } from "@/types/database";

export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const ATTACK_VECTOR_LABELS: Record<AttackVector, string> = {
  phishing: "Phishing",
  ransomware: "Ransomware",
  malware: "Malware",
  vulnerability_exploit: "Vulnerability Exploit",
  credential_attack: "Credential Attack",
  social_engineering: "Social Engineering",
  insider: "Insider Threat",
  supply_chain: "Supply Chain",
  misconfiguration: "Misconfiguration",
  unauthorized_access: "Unauthorized Access",
  scraping: "Data Scraping",
  other: "Other",
};

export const UPDATE_TYPE_LABELS: Record<UpdateType, string> = {
  discovery: "Discovery",
  new_info: "New Information",
  class_action: "Class Action",
  regulatory_fine: "Regulatory Fine",
  remediation: "Remediation",
  resolution: "Resolution",
  investigation: "Investigation",
};

export const TAG_TYPE_LABELS: Record<TagType, string> = {
  continent: "Continent",
  country: "Country",
  industry: "Industry",
  attack_vector: "Attack Vector",
  cve: "CVE",
  mitre_attack: "MITRE ATT&CK",
  threat_actor: "Threat Actor",
};

export const RSS_SOURCES = [
  { name: "BleepingComputer", url: "https://www.bleepingcomputer.com" },
  { name: "The Hacker News", url: "https://thehackernews.com" },
  { name: "DataBreachToday", url: "https://www.databreachtoday.co.uk" },
  { name: "Krebs on Security", url: "https://krebsonsecurity.com" },
  { name: "HelpNet Security", url: "https://www.helpnetsecurity.com" },
  { name: "NCSC UK", url: "https://www.ncsc.gov.uk" },
  { name: "Check Point Research", url: "https://research.checkpoint.com" },
  { name: "Have I Been Pwned", url: "https://haveibeenpwned.com" },
  { name: "DataBreaches.net", url: "https://databreaches.net" },
  { name: "The Record (Recorded Future)", url: "https://therecord.media" },
  { name: "ZDNet Security", url: "https://www.zdnet.com" },
  { name: "CyberScoop", url: "https://cyberscoop.com" },
  { name: "Infosecurity Magazine", url: "https://www.infosecurity-magazine.com" },
  { name: "GlobeNewswire Cybersecurity", url: "https://www.globenewswire.com" },
  { name: "Dark Reading", url: "https://www.darkreading.com" },
  { name: "Threatpost", url: "https://threatpost.com" },
  { name: "Graham Cluley", url: "https://grahamcluley.com" },
  { name: "Security Affairs", url: "https://securityaffairs.com" },
  { name: "The Register Security", url: "https://www.theregister.com" },
];
