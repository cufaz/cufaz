import jsPDF from "jspdf";

export interface StudentAutorizacaoData {
  nomeAluno: string;
  dataNasc?: string;
  alunoCpf?: string;
  polo: string;
  modalidade: string;
  nomeResponsavel: string;
  cpfResponsavel: string;
  telefoneResponsavel: string;
  hospitalEmergencia?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  telefonePai?: string;
  telefoneVizinho?: string;
  telefoneAvo?: string;
}

export function generateTermoAutorizacaoPdf(data: StudentAutorizacaoData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Header Banner
  doc.setFillColor(249, 115, 22); // CUFA Brand Orange (#f97316)
  doc.rect(0, 0, 210, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CUFA — CENTRAL ÚNICA DAS FAVELAS", 14, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("TERMO DE AUTORIZAÇÃO E RESPONSABILIDADE DOS PAIS / RESPONSÁVEL LEGAL", 14, 18);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("1. DADOS DO ALUNO E RESPONSÁVEL LEGAL", 14, 34);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 36, 196, 36);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const lines = [
    `Nome Completo do Aluno: ${data.nomeAluno || "—"}`,
    `Data de Nascimento: ${data.dataNasc || "—"}    |    CPF do Aluno: ${data.alunoCpf || "—"}`,
    `Unidade / Polo: ${data.polo || "Complexo da Penha"}    |    Modalidade / Oficina: ${data.modalidade || "Geral"}`,
    "",
    `Nome do Responsável Legal: ${data.nomeResponsavel || "—"}`,
    `CPF do Responsável: ${data.cpfResponsavel || "—"}    |    WhatsApp: ${data.telefoneResponsavel || "—"}`,
    `Endereço Completo: ${data.endereco || "—"}, Nº ${data.numero || "S/N"} - Bairro: ${data.bairro || "—"}`,
    `CEP: ${data.cep || "—"} - ${data.cidade || "Rio de Janeiro"}/${data.uf || "RJ"}`,
    "",
    "CONTATOS DE EMERGÊNCIA & TELEFONES ADICIONAIS:",
    `• Hospital / UPA de Preferência em Emergência: ${data.hospitalEmergencia || "Hospital / UPA mais próximo"}`,
    `• Telefone do Pai: ${data.telefonePai || "Não informado"}`,
    `• Telefone do Vizinho: ${data.telefoneVizinho || "Não informado"}`,
    `• Telefone da Avó / Avô: ${data.telefoneAvo || "Não informado"}`,
  ];

  let y = 43;
  lines.forEach((line) => {
    if (line.startsWith("CONTATOS") || line.startsWith("1.")) {
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
    }
    doc.text(line, 14, y);
    y += 6;
  });

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(249, 115, 22);
  doc.text("2. TERMO DE DECLARAÇÃO E AUTORIZAÇÃO", 14, y);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, y + 2, 196, y + 2);

  y += 8;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const declaracao = [
    "Eu, acima qualificado como responsável legal pelo aluno(a) declaro para os devidos fins que:",
    "",
    "1. AUTORIZO o referido aluno(a) a participar ativamente de todas as oficinas, treinos, atividades sociais, educacionais e esportivas promovidas pela CUFA — Central Única das Favelas no polo cadastrado.",
    "2. AUTORIZO o atendimento inicial de primeiros socorros e, se necessário em casos de emergência médica, o encaminhamento imediato para o hospital / UPA indicado ou mais próximo.",
    "3. DECLARO estar ciente das normas de convivência, frequência e respeito institucional exigidas pelo projeto.",
    "4. AUTORIZO a utilização da imagem do participante para fins institucionais de prestação de contas e divulgação social do projeto.",
  ];

  declaracao.forEach((paragraph) => {
    const splitLines = doc.splitTextToSize(paragraph, 180);
    doc.text(splitLines, 14, y);
    y += splitLines.length * 5;
  });

  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text(`Data: ____ / ____ / ________    |    Local: ${data.cidade || "Rio de Janeiro"} - ${data.uf || "RJ"}`, 14, y);

  y += 25;
  doc.line(40, y, 170, y);
  doc.setFontSize(9);
  doc.text("Assinatura do Responsável Legal", 105, y + 5, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${data.nomeResponsavel || "—"} — CPF: ${data.cpfResponsavel || "—"}`, 105, y + 10, { align: "center" });

  // Save PDF
  const nomeSlug = (data.nomeAluno || "Aluno").replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`Termo_Autorizacao_CUFA_${nomeSlug}.pdf`);
}
