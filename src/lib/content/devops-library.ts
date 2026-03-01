export const articleTopics = [
  {
    name: "Linux",
    summary: "systemd, journald, users, disks, troubleshooting",
    categories: ["Общее", "systemd", "Файловая система", "Сеть", "Безопасность"],
  },
  {
    name: "Docker",
    summary: "images, compose, registries, layer cache",
    categories: ["Общее", "Images", "Compose", "Registry", "Troubleshooting"],
  },
  {
    name: "\u0421\u0435\u0442\u0438",
    summary: "dns, routing, nat, tcpdump, vpn",
    categories: ["Общее", "DNS", "Routing", "VPN", "Диагностика"],
  },
  {
    name: "Ansible",
    summary: "roles, inventories, templates, idempotency",
    categories: ["Общее", "Roles", "Inventories", "Templates", "Практика"],
  },
  {
    name: "K8S",
    summary: "pods, ingress, helm, probes, stateful workloads",
    categories: ["Общее", "Pods", "Ingress", "Helm", "Stateful"],
  },
  {
    name: "Terraform",
    summary: "state, modules, providers, plans, drift",
    categories: ["Общее", "State", "Modules", "Providers", "Workflows"],
  },
  {
    name: "CI/CD",
    summary: "pipelines, runners, release flow, artifacts",
    categories: ["Общее", "Pipelines", "Runners", "Artifacts", "Release"],
  },
] as const;

export type ArticleTopic = (typeof articleTopics)[number]["name"];

export const articleTopicNames = articleTopics.map((topic) => topic.name);
