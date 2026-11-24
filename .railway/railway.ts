import { defineRailway, project, service, volume } from "railway/iac";
// Railway infrastructure for Duel (replaces railway.json, which Railway stops reading after 2026-12-01).
// Preview with `railway config plan`, apply with `railway config apply`.
// This repository manages only its own resources in the environment.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "duel";
export default defineRailway(() => {
  // SQLite lives here (DB_PATH=/data/duel.sqlite in the Dockerfile): never remove this mount.
  const data = volume("duel-volume", { region: "europe-west4-drams3a", sizeMB: 5000 });

  const duel = service("duel", {
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "Dockerfile" },
    healthcheck: "/health",
    healthcheckTimeout: 60,
    // One instance only: matchmaking and live duels are kept in memory.
    replicas: { "europe-west4-drams3a": 1 },
    volumeMounts: { "/data": data },
  });

  return project("duel", {
    // Variables (ADMIN_TOKEN, PUBLIC_URL, analytics IDs…) are managed in the Railway dashboard, not here.
    variables: { managed: false },
    resources: [duel, data],
  });
});
