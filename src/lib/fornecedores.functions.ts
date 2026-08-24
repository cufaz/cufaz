import { createServerFn } from "@tanstack/react-start";

export type CartaoCnpjExtraido = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  data_abertura: string;
  porte: string;
  natureza_juridica: string;
  situacao_cadastral: string;
  cnae_principal_codigo: string;
  cnae_principal_descricao: string;
  cnae_secundarios: { codigo: string; descricao: string }[];
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
  email: string;
  telefone: string;
  cnae: string;
};

const SYSTEM_PROMPT = `Você extrai dados de Comprovantes de Inscrição e de Situação Cadastral (Cartão CNPJ) da Receita Federal.
Responda SOMENTE com um JSON válido, sem markdown, no formato:
{"cnpj":"","razao_social":"","nome_fantasia":"","data_abertura":"","porte":"","natureza_juridica":"","situacao_cadastral":"","cnae_principal_codigo":"","cnae_principal_descricao":"","cnae_secundarios":[{"codigo":"","descricao":""}],"endereco":"","cidade":"","uf":"","cep":"","email":"","telefone":""}
Regras: endereco = logradouro, número e complemento/bairro em uma linha. cidade = município. Se um campo não existir no documento, use string vazia (nunca invente dados). Se o nome fantasia estiver mascarado com asteriscos, use string vazia.`;

export const parseCartaoCnpj = createServerFn({ method: "POST" })
  .inputValidator((input: { fileName: string; fileData: string }) => {
    if (!input?.fileData) throw new Error("Arquivo inválido.");
    return input;
  })
  .handler(async ({ data }): Promise<CartaoCnpjExtraido> => {
    const apiKey = process.env['LOVABLE_API_KEY'];
    if (!apiKey) throw new Error("Serviço de leitura indisponível (chave de IA ausente).");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Extraia os dados deste Cartão CNPJ." },
              {
                type: "file",
                file: {
                  filename: data.fileName || "cartao-cnpj.pdf",
                  file_data: `data:application/pdf;base64,${data.fileData}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Muitas leituras em sequência. Tente novamente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados. Fale com o gestor CUFA.");
      throw new Error(`Falha na leitura do Cartão CNPJ (${res.status}). ${body.slice(0, 180)}`);
    }

    const json: any = await res.json();
    const raw = String(json?.choices?.[0]?.message?.content ?? "");
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Não foi possível interpretar o documento.");

    const parsed = JSON.parse(match[0]) as Partial<CartaoCnpjExtraido>;
    const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const codigo = s(parsed.cnae_principal_codigo);
    const descricao = s(parsed.cnae_principal_descricao);

    return {
      cnpj: s(parsed.cnpj),
      razao_social: s(parsed.razao_social),
      nome_fantasia: s(parsed.nome_fantasia).replace(/^\*+$/, ""),
      data_abertura: s(parsed.data_abertura),
      porte: s(parsed.porte),
      natureza_juridica: s(parsed.natureza_juridica),
      situacao_cadastral: s(parsed.situacao_cadastral),
      cnae_principal_codigo: codigo,
      cnae_principal_descricao: descricao,
      cnae_secundarios: Array.isArray(parsed.cnae_secundarios)
        ? parsed.cnae_secundarios
            .map((c) => ({ codigo: s(c?.codigo), descricao: s(c?.descricao) }))
            .filter((c) => c.codigo || c.descricao)
        : [],
      endereco: s(parsed.endereco),
      cidade: s(parsed.cidade),
      uf: s(parsed.uf).toUpperCase(),
      cep: s(parsed.cep),
      email: s(parsed.email).toLowerCase(),
      telefone: s(parsed.telefone),
      cnae: codigo && descricao ? `${codigo} - ${descricao}` : codigo || descricao,
    };
  });
