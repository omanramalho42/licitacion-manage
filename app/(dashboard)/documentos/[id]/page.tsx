"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Download,
  Send,
  FileText,
  Calendar,
  Building,
  Paperclip,
  Loader2,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

interface Document {
  id: string;
  title: string;
  document_type: string;
  content: string;
  licitacao_numero: string | null;
  orgao_destino: string | null;
  status: string;
  attachments: { name: string; url: string; type: string }[];
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: typeof Clock }
> = {
  rascunho: {
    label: "Rascunho",
    color: "bg-muted text-muted-foreground",
    icon: FileText,
  },
  em_revisao: {
    label: "Em Revisao",
    color: "bg-warning/20 text-warning",
    icon: Clock,
  },
  aprovado: {
    label: "Aprovado",
    color: "bg-success/20 text-success",
    icon: CheckCircle,
  },
  enviado: {
    label: "Enviado",
    color: "bg-primary/20 text-primary",
    icon: Send,
  },
};

const typeLabels: Record<string, string> = {
  proposta: "Proposta Comercial",
  carta_de_apresentacao: "Carta de Apresentacao",
  declaracao: "Declaracao",
  atestado: "Atestado",
  outro: "Outro",
};

export default function DocumentoDetalhe() {
  const router = useRouter();
  const params = useParams();
  const { isAdmin } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [params.id]);

  async function fetchDocument() {
    const supabase = createClient();
    if (!supabase) return;

    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("id", params.id)
      .single();

    if (data) {
      setDocument(data as Document);
    }
    setLoading(false);
  }

  async function updateStatus(newStatus: string) {
    if (!document) return;
    setUpdating(true);

    const supabase = createClient();
    if (!supabase) return;

    await supabase
      .from("documents")
      .update({ status: newStatus })
      .eq("id", document.id);

    setDocument((prev) => (prev ? { ...prev, status: newStatus } : null));
    setUpdating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Documento nao encontrado</p>
        <Button asChild className="mt-4">
          <Link href="/documentos">Voltar</Link>
        </Button>
      </div>
    );
  }

  const status = statusConfig[document.status] || statusConfig.rascunho;
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/documentos" className="hover:text-foreground">
          Documentos
        </Link>
        <span>/</span>
        <span className="text-foreground">{document.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/documentos">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {document.title}
              </h1>
              <Badge className={status.color}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {typeLabels[document.document_type] || document.document_type}
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/documentos/${document.id}/editar`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
            {document.status === "aprovado" && (
              <Button onClick={() => updateStatus("enviado")} disabled={updating}>
                {updating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar ao Orgao
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Invoice Style */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documento
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Document Header Info */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                  Destinatario
                </p>
                <p className="font-medium text-foreground">
                  {document.orgao_destino || "Nao informado"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                  Licitacao
                </p>
                <p className="font-medium text-foreground">
                  {document.licitacao_numero || "Nao informado"}
                </p>
              </div>
            </div>

            <Separator />

            {/* Document Content */}
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: document.content }}
            />
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status do Documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAdmin && document.status !== "enviado" && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Alterar status:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <Button
                        key={key}
                        variant={document.status === key ? "default" : "outline"}
                        size="sm"
                        disabled={updating}
                        onClick={() => updateStatus(key)}
                      >
                        {config.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Criado em:</span>
                  <span className="font-medium">
                    {new Date(document.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Atualizado:</span>
                  <span className="font-medium">
                    {new Date(document.updated_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                {document.orgao_destino && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Orgao:</span>
                    <span className="font-medium truncate">
                      {document.orgao_destino}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Paperclip className="h-4 w-4" />
                Anexos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {document.attachments && document.attachments.length > 0 ? (
                <div className="space-y-2">
                  {document.attachments.map((file, index) => (
                    <a
                      key={`${file.name}-${index}`}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                    >
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </span>
                      <Download className="ml-auto h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Paperclip className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum anexo adicionado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
