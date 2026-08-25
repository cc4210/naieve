/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits .next/standalone with a traced, minimal node_modules — the Docker
  // runtime stage copies that instead of the whole dependency tree.
  output: 'standalone',
  // `pg` opens raw TCP sockets; bundling it breaks that. Keeping it external
  // also guarantees it lands in the standalone node_modules, which is where
  // scripts/migrate.mjs resolves it from at container start.
  serverExternalPackages: ['pg'],
};
module.exports = nextConfig;
