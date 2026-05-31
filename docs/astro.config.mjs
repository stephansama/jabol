import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightLlmsTxt from "starlight-llms-txt";

// https://astro.build/config
export default defineConfig({
  site: "https://stephansama.github.io",
  base: "/jabol",
  publicDir: "../assets",
  vite: {
    server: { fs: { allow: [".."] } },
  },
  integrations: [
    starlight({
      title: "jabol",
      description: "Just A Bunch Of Links — self-hostable JSON-driven link directory",
      logo: { src: "../assets/favicon.svg", alt: "jabol logo" },
      social: { github: "https://github.com/stephansama/jabol" },
      components: {
        Head: "./src/components/Head.astro",
      },
      plugins: [
        starlightLlmsTxt({
          projectName: "jabol",
          description:
            "Just A Bunch Of Links — self-hostable JSON-driven link directory. Drop a links.json, run a container, get a fast, searchable, optionally-admin-gated link page.",
          promote: ["getting-started/**", "configuration/**"],
        }),
      ],
      sidebar: [
        { label: "Introduction", link: "/" },
        {
          label: "Getting started",
          items: [
            { label: "Install", link: "/getting-started/install/" },
            { label: "Quickstart", link: "/getting-started/quickstart/" },
            { label: "Environment", link: "/getting-started/environment/" },
          ],
        },
        {
          label: "Configuration",
          items: [
            { label: "links.json", link: "/configuration/links-json/" },
            { label: "Top-level fields", link: "/configuration/top-level-fields/" },
            { label: "Link fields", link: "/configuration/link-fields/" },
            { label: "JSON Schema", link: "/configuration/json-schema/" },
          ],
        },
        {
          label: "Admin",
          items: [
            { label: "Overview", link: "/admin/overview/" },
            { label: "Branding", link: "/admin/branding/" },
            { label: "Links", link: "/admin/links/" },
            { label: "Admin users", link: "/admin/users/" },
          ],
        },
        {
          label: "Deploy",
          items: [
            { label: "Docker", link: "/deploy/docker/" },
            { label: "Docker Compose", link: "/deploy/docker-compose/" },
            { label: "Coolify", link: "/deploy/coolify/" },
          ],
        },
        { label: "Development", link: "/development/" },
        { label: "API reference", link: "/api-reference/" },
      ],
    }),
  ],
});
