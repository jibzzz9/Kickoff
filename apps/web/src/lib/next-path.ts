/** Chemin de retour après connexion : uniquement un chemin interne (évite les redirections vers un autre site). */
export function safeNext(value: string | null | undefined, fallback: string) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
