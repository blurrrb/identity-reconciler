export default {
  async fetch(
    _req: Request,
    _env: Env,
    _ctx: ExecutionContext
  ): Promise<Response> {
    return new Response("hello world");
  },
};
