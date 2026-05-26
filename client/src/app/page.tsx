export default function Home() {
  // Middleware handles all redirects:
  // - Authenticated users → /dashboard/assignments
  // - Unauthenticated users → /sign-in
  // This page is just a fallback that should never render.
  return null;
}
