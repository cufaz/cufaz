/**
 * Formata live o valor digitado pelo usuário em moeda brasileira (BRL).
 * Exemplo:
 *  - "1" -> "R$ 0,01"
 *  - "100" -> "R$ 1,00"
 *  - "10000" -> "R$ 100,00"
 *  - "1000000" -> "R$ 10.000,00"
 */
export function formatBRLInput(value: string | number | null | undefined): string {
  if (value === "" || value === null || value === undefined) return "R$ 0,00";
  
  // Se for um número inteiro/float vindo do sistema (ex: 1000 ou 100.5)
  if (typeof value === "number") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  const digitsOnly = String(value).replace(/\D/g, "");
  if (!digitsOnly) return "R$ 0,00";

  const numericValue = Number(digitsOnly) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
}

/**
 * Converte a string formatada em BRL (ex: "R$ 10.000,00") para valor numérico float (ex: 10000)
 */
export function parseBRLToNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;

  const digitsOnly = String(value).replace(/\D/g, "");
  if (!digitsOnly) return 0;

  return Number(digitsOnly) / 100;
}
