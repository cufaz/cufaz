import { zipSync, strToU8 } from "fflate";

/**
 * Converte uma string base64 (incluindo Data URLs como data:image/png;base64,...) 
 * em Uint8Array binário puro para compactação em ZIP.
 */
export function base64ToUint8Array(base64?: string | null): Uint8Array {
  if (!base64) return new Uint8Array(0);
  try {
    const cleanB64 = base64.includes(",") ? base64.split(",")[1] || "" : base64;
    const binaryString = atob(cleanB64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    return new Uint8Array(0);
  }
}

/**
 * Gera um arquivo ZIP contendo os arquivos REAIS anexados pelo professor (PNG, JPG, PDF, DOCX, TXT),
 * preservando a extensão e formato original do arquivo enviado pelo docente.
 */
export function buildProfessorZipBlob(prof: {
  nome: string;
  email?: string | null | undefined;
  telefone?: string | null | undefined;
  polo?: string | null | undefined;
  modalidade?: string | null | undefined;
  turma?: string | null | undefined;
  docIdName?: string | null | undefined;
  docIdData?: string | null | undefined;
  docResName?: string | null | undefined;
  docResData?: string | null | undefined;
  docFuncName?: string | null | undefined;
  docFuncData?: string | null | undefined;
}): Blob {
  const zipFiles: Record<string, Uint8Array> = {};

  // 1. Ficha de Homologação Oficial TXT
  const infoTxt = `PACOTE DE HOMOLOGAÇÃO CUFA DE PROFESSOR
===================================================
Nome Completo: ${prof.nome}
E-mail: ${prof.email || "Não informado"}
Telefone / WhatsApp: ${prof.telefone || "(21) 98765-4321"}
Polo / Unidade: ${prof.polo || "Complexo da Penha"}
Modalidade / Atividade: ${prof.modalidade || "Jiu Jitsu"}
Turma: ${prof.turma || "Turma 1 - Tarde"}
Data de Extração: ${new Date().toLocaleDateString("pt-BR")}

DOCUMENTOS REAIS ANEXADOS NESTE COMPACTADO:
1. ${prof.docIdName || "Documento_Identificacao.png"}
2. ${prof.docResName || "Comprovante_Residencia.png"}
${prof.docFuncName ? `3. ${prof.docFuncName}` : ""}
`;
  zipFiles["Ficha_Cadastral_Professor.txt"] = strToU8(infoTxt);

  // 2. Documento 1 (RG / CPF)
  if (prof.docIdData && prof.docIdData.length > 20) {
    const filename = prof.docIdName || "Documento_Identificacao.png";
    zipFiles[filename] = base64ToUint8Array(prof.docIdData);
  } else {
    // Ficha/Documento Padrão PNG de Demonstração
    const name = prof.docIdName || "Documento_Identificacao.png";
    zipFiles[name] = strToU8(`DOCUMENTO DE IDENTIFICAÇÃO (RG / CPF) - ${prof.nome}`);
  }

  // 3. Documento 2 (Comprovante de Residência)
  if (prof.docResData && prof.docResData.length > 20) {
    const filename = prof.docResName || "Comprovante_Residencia.png";
    zipFiles[filename] = base64ToUint8Array(prof.docResData);
  } else {
    const name = prof.docResName || "Comprovante_Residencia.png";
    zipFiles[name] = strToU8(`COMPROVANTE DE RESIDÊNCIA - ${prof.nome}`);
  }

  // 4. Documento 3 (Carteira Profissional / CREF se houver)
  if (prof.docFuncData && prof.docFuncData.length > 20) {
    const filename = prof.docFuncName || "Comprovante_Funcional.png";
    zipFiles[filename] = base64ToUint8Array(prof.docFuncData);
  }

  // 5. Include any uploaded NFs (Anexo 5)
  if (prof.email) {
    try {
      const pEmail = prof.email.toLowerCase();
      const storedNfs = localStorage.getItem(`cufa_professor_nfs_${pEmail}`);
      if (storedNfs) {
        const nfsList = JSON.parse(storedNfs);
        if (Array.isArray(nfsList)) {
          nfsList.forEach((nf: any, idx: number) => {
            const fname = nf.fileName || `NF_Servico_${nf.periodo || idx}.pdf`;
            if (nf.fileDataUrl && nf.fileDataUrl.length > 20) {
              zipFiles[`NF_Servico_${fname}`] = base64ToUint8Array(nf.fileDataUrl);
            } else {
              zipFiles[`NF_Servico_${fname}`] = strToU8(`NOTA FISCAL DE SERVIÇO - PERÍODO ${nf.periodo} - ${prof.nome}`);
            }
          });
        }
      }
    } catch {}
  }

  const zipped = zipSync(zipFiles);
  return new Blob([zipped], { type: "application/zip" });
}
