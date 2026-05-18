export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log("DB URL host:", process.env.DATABASE_URL?.replace(/:\/\/.*@/, "://***@"));
  }
}
