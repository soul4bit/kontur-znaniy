export const articleTopics = [
  {
    name: "Linux",
    summary: "systemd, journald, users, disks, troubleshooting",
  },
  {
    name: "Docker",
    summary: "images, compose, registries, layer cache",
  },
  {
    name: "Сети",
    summary: "dns, routing, nat, tcpdump, vpn",
  },
  {
    name: "Ansible",
    summary: "roles, inventories, templates, idempotency",
  },
  {
    name: "K8S",
    summary: "pods, ingress, helm, probes, stateful workloads",
  },
  {
    name: "Terraform",
    summary: "state, modules, providers, plans, drift",
  },
  {
    name: "CI/CD",
    summary: "pipelines, runners, release flow, artifacts",
  },
] as const;

export type ArticleTopic = (typeof articleTopics)[number]["name"];

export const articleTopicNames = articleTopics.map((topic) => topic.name);