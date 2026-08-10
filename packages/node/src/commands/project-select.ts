import { resultError, resultOk } from "../errors.js";
import type { CommandResult, ProjectSelectArgs, ProjectSelectData, RuntimeEnv } from "../types.js";
import { contextFromPage } from "./context.js";
import { normalizeProjectSourcesUrl } from "./project-sources.js";
import { ensurePage } from "./session.js";

/**
 * Opens an exact visible Project URL. Names are deliberately not accepted:
 * project names are user-editable and may not be unique.
 */
export async function selectProject(
  env: RuntimeEnv,
  args: ProjectSelectArgs
): Promise<CommandResult<ProjectSelectData>> {
  let project: ProjectSelectData;
  try {
    project = normalizeProjectSourcesUrl(args.projectUrl);
  } catch (error) {
    return resultError(error instanceof Error ? error : new Error(String(error)), { timestamp: new Date().toISOString() });
  }

  const boot = await ensurePage(env);
  if (!boot.ok) return boot as CommandResult<ProjectSelectData>;
  const page = env.page!;
  if (page.goto === undefined || page.url === undefined) {
    return {
      ok: false,
      status: "unsupported",
      warnings: [],
      blocker: {
        kind: "selector_drift",
        code: "project_navigation_unavailable",
        fieldPath: "projectUrl",
        message: "The visible browser cannot open and verify a ChatGPT Project URL.",
        resumable: true
      },
      context: await contextFromPage(page)
    };
  }

  try {
    await page.goto(project.url, { waitUntil: "domcontentloaded", timeout: args.timeoutMs ?? 30000 }).catch(() => undefined);
    await page.waitForTimeout?.(500);
    const actual = await Promise.resolve(page.url()).catch(() => "");
    if (!actual.includes(`/g/${project.projectId}/`)) {
      return {
        ok: false,
        status: "blocked",
        warnings: [],
        blocker: {
          kind: "selector_drift",
          code: "project_postcondition_unverified",
          fieldPath: "projectUrl",
          message: "ChatGPT did not confirm the requested Project URL after navigation.",
          candidates: [{ label: actual }],
          resumable: true
        },
        context: await contextFromPage(page)
      };
    }
    return resultOk({ ...project, url: actual }, await contextFromPage(page));
  } catch (error) {
    return resultError(error instanceof Error ? error : new Error(String(error)), await contextFromPage(page));
  }
}
