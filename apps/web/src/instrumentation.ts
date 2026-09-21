export async function register() {
  // The database and Better Auth's own hashing need Node's runtime — this
  // hook also fires once for the edge runtime, which must skip it.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureLegacyOwner } = await import("@/server/legacy-migration");
    await ensureLegacyOwner();
  }
}
