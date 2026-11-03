import application from "./dist/server/index.js";

// These headers are injected by ChatGPT Sites. They must never be trusted when
// the same app runs behind a public Cloudflare Worker, where a browser could
// supply them itself.
const chatGptIdentityHeaders = [
  "oai-authenticated-user-id",
  "oai-authenticated-user-email",
  "oai-authenticated-user-full-name",
  "oai-authenticated-user-full-name-encoding",
];

export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    const headers = new Headers(request.headers);
    for (const header of chatGptIdentityHeaders) headers.delete(header);

    return application.fetch(new Request(request, { headers }), env, ctx);
  },
} satisfies ExportedHandler<Cloudflare.Env>;
