"use server";

import { streamText, convertToModelMessages } from "ai";

export async function POST(req: Request) {
  const { messages, contractType, context } = await req.json();

  // IMPORTANTE: Para ativar a integracao com OpenAI, descomente o codigo abaixo
  // e configure a variavel de ambiente AI_GATEWAY_API_KEY no painel de configuracoes.
  //
  // const result = streamText({
  //   model: "openai/gpt-4o-mini",
  //   system: `Voce e um assistente especializado em criacao de contratos para licitacoes publicas brasileiras.
  //   Seu papel e ajudar o usuario a:
  //   - Redigir clausulas contratuais adequadas
  //   - Sugerir modelos de contratos baseados no tipo de contratacao
  //   - Verificar conformidade com a Lei 14.133/2021 (Nova Lei de Licitacoes)
  //   - Incluir clausulas obrigatorias e recomendadas
  //   - Formatar o documento de acordo com padroes oficiais
  //
  //   Tipo de contrato sendo criado: ${contractType || "Nao especificado"}
  //   Contexto adicional: ${context || "Nenhum"}
  //
  //   Responda sempre em portugues brasileiro formal, adequado para documentos oficiais.`,
  //   messages: await convertToModelMessages(messages),
  // });
  //
  // return result.toUIMessageStreamResponse();

  // Resposta temporaria enquanto a IA nao esta configurada
  return Response.json({
    message:
      "Integracao com IA desativada. Para ativar, configure AI_GATEWAY_API_KEY e descomente o codigo em app/api/ai/contract-assistant/route.ts",
    suggestions: [
      "Configure a variavel AI_GATEWAY_API_KEY nas configuracoes do projeto",
      "Descomente o codigo de integracao no arquivo route.ts",
      "A IA ajudara a criar clausulas, verificar conformidade legal e sugerir modelos",
    ],
  });
}
