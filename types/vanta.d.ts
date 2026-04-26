// Vanta has no shipped types. SiteBackground only uses CLOUDS via a
// dynamic import; treat the module as `any` so tsc doesn't choke.
declare module "vanta/dist/vanta.clouds.min"
declare module "vanta/dist/*"
