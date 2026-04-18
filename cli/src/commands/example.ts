/**
 * `ditto example` — no-op printer that shows the user a full,
 * copy-paste-able walkthrough of how to go from "zero" to "AI agent
 * rebuilds my UI in the extracted brand style".
 *
 * Doesn't call the API, doesn't charge credits, doesn't need a valid
 * key. Useful as a post-install welcome screen.
 */

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const MAGENTA = "\x1b[35m";
const RESET = "\x1b[0m";

export async function runExample(): Promise<void> {
  const isTTY = process.stdout.isTTY;
  const b = isTTY ? BOLD : "";
  const d = isTTY ? DIM : "";
  const c = isTTY ? CYAN : "";
  const g = isTTY ? GREEN : "";
  const m = isTTY ? MAGENTA : "";
  const r = isTTY ? RESET : "";

  const out = (s: string) => process.stdout.write(s + "\n");

  out("");
  out(`${b}${m}Ditto — sample workflow${r}`);
  out(`${d}Goal: make your AI agent rebuild a page in the style of any website.${r}`);
  out("");

  out(`${b}${c}1.${r} ${b}Estrai uno stile${r} ${d}— scarica i token di un sito nel tuo progetto.${r}`);
  out(`   ${g}$${r} ditto https://stripe.com`);
  out(`   ${d}→ scrive ./DESIGN.md (100 crediti)${r}`);
  out("");

  out(`${b}${c}2.${r} ${b}(Opzionale) Mescola più stili${r} ${d}— blend di ispirazioni.${r}`);
  out(`   ${g}$${r} ditto merge https://stripe.com https://linear.app --name "MyBlend"`);
  out(`   ${d}→ scrive ./DESIGN.md ibrido (2×100 + 300 crediti)${r}`);
  out("");

  out(`${b}${c}3.${r} ${b}Apri il tuo agente AI preferito${r} (Claude Code, Cursor, Zed) ${b}nella stessa cartella${r}.`);
  out(`   ${d}L'agente leggerà DESIGN.md automaticamente come contesto del progetto.${r}`);
  out("");

  out(`${b}${c}4.${r} ${b}Incolla uno di questi prompt:${r}`);
  out("");
  out(`   ${b}Prompt A — ricostruisci la landing:${r}`);
  out(`   ${m}"Leggi DESIGN.md e crea una landing page Next.js che rispetti${r}`);
  out(`   ${m} colori, tipografia, border-radius e hero composition estratti.${r}`);
  out(`   ${m} Usa le microcopy di voice dal file come tono dei CTA."${r}`);
  out("");
  out(`   ${b}Prompt B — porta un componente già esistente al nuovo brand:${r}`);
  out(`   ${m}"Guarda DESIGN.md. Aggiorna src/components/Pricing.tsx per${r}`);
  out(`   ${m} usare il colore primary, il font heading e il radius estratti.${r}`);
  out(`   ${m} Mantieni la logica, tocca solo lo styling."${r}`);
  out("");
  out(`   ${b}Prompt C — estrazione diretta dentro l'agente (richiede MCP):${r}`);
  out(`   ${m}"Usa il tool extract_design di ditto su https://vercel.com,${r}`);
  out(`   ${m} poi costruisci un Button che rifletta il primary e gli hover state."${r}`);
  out("");

  out(`${b}${c}5.${r} ${b}Gestisci i tuoi design${r}`);
  out(`   ${g}$${r} ditto list            ${d}# libreria salvata su Ditto${r}`);
  out(`   ${g}$${r} ditto view stripe     ${d}# dumpa un DESIGN.md salvato${r}`);
  out(`   ${g}$${r} ditto whoami          ${d}# saldo crediti${r}`);
  out("");

  out(`${d}More: ${r}${c}https://dittodesign.dev/settings/api-keys${r}`);
  out("");
}
