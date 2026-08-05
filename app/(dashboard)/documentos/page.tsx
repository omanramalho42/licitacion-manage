"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, FileText, Trash2, Edit, Eye, Loader2, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

interface Document {
  id: string;
  title: string;
  document_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  file_path?: string | null;
  expiry_date?: string | null;
}

const statusColors: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  em_revisao: "bg-warning/20 text-warning",
  aprovado: "bg-success/20 text-success",
  enviado: "bg-primary/20 text-primary",
  ativo: "bg-success/20 text-success",
};

const statusLabels: Record<string, string> = {
  rascunho: "Rascunho",
  em_revisao: "Em Revisao",
  aprovado: "Aprovado",
  enviado: "Enviado",
  ativo: "Ativo",
};

const typeLabels: Record<string, string> = {
  proposta: "Proposta",
  carta_de_apresentacao: "Carta de Apresentacao",
  declaracao: "Declaracao",
  atestado: "Atestado de Capacidade Tecnica",
  outro: "Outro",
  certidao_negativa_federal: "Certidão Negativa Federal",
  certidao_negativa_estadual: "Certidão Negativa Estadual",
  certidao_negativa_municipal: "Certidão Negativa Municipal",
  certidao_fgts: "Certidão FGTS",
  certidao_trabalhista: "Certidão Trabalhista",
  contrato_social: "Contrato Social",
  balanco_patrimonial: "Balanço Patrimonial",
};

const HABILITACAO_TYPES = [
  "certidao_negativa_federal",
  "certidao_negativa_estadual",
  "certidao_negativa_municipal",
  "certidao_fgts",
  "certidao_trabalhista",
  "contrato_social",
  "atestado",
  "balanco_patrimonial",
  "outro",
];

export default function DocumentosPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("atestado");
  const [uploadExpiry, setUploadExpiry] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/dashboard");
      return;
    }
    if (!authLoading && user) {
      fetchDocuments();
    }
  }, [authLoading, isAdmin, user, router]);

  async function fetchDocuments() {
    const supabase = createClient();
    if (!supabase) return;

    const { data } = await supabase
      .from("documents")
      .select("*")
      .order("updated_at", { ascending: false });

    if (data) {
      setDocuments(data as Document[]);
    }
    setLoading(false);
  }

  async function handleDelete(doc: Document) {
    setDeleting(doc.id);
    const supabase = createClient();
    if (!supabase) return;

    if (doc.file_path) {
      await supabase.storage.from("documents").remove([doc.file_path]);
    }
    await supabase.from("documents").delete().eq("id", doc.id);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    setDeleting(null);
  }

  async function handleDownload(doc: Document) {
    if (!doc.file_path) return;
    const supabase = createClient();
    if (!supabase) return;
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  }

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !user || !uploadTitle.trim()) return;

    setUploading(true);
    const supabase = createClient();
    if (!supabase) {
      setUploading(false);
      return;
    }

    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (uploadError) {
      console.error("[v0] Erro no upload:", uploadError);
      setUploading(false);
      return;
    }

    let extractedText: string | null = null;
    try {
      const res = await fetch("/api/documentos/extrair-texto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      });
      const json = await res.json();
      extractedText = json.text || null;
    } catch {
      // segue sem o texto extraído
    }

    await supabase.from("documents").insert({
      user_id: user.id,
      title: uploadTitle,
      document_type: uploadType,
      status: "ativo",
      file_path: filePath,
      expiry_date: uploadExpiry || null,
      extracted_text: extractedText,
    });

    setUploadTitle("");
    setUploadExpiry("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
    setUploadOpen(false);
    fetchDocuments();
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus documentos e sua documentação de habilitação para licitacoes
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Enviar Documento de Habilitação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Documento de Habilitação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Ex: CND Federal 2026"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={uploadType} onValueChange={setUploadType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HABILITACAO_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Validade (se houver)</Label>
                  <Input type="date" value={uploadExpiry} onChange={(e) => setUploadExpiry(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Arquivo (PDF)</Label>
                  <Input ref={fileInputRef} type="file" accept="application/pdf" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleUpload} disabled={uploading || !uploadTitle.trim()}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Enviar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => router.push("/documentos/novo")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Documento
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Meus Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum documento ainda
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie um documento ou envie sua documentação de habilitação
              </p>
              <Button onClick={() => router.push("/documentos/novo")}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Documento
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>
                      {typeLabels[doc.document_type] || doc.document_type}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[doc.status] || ""}>
                        {statusLabels[doc.status] || doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.expiry_date || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(doc.updated_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {doc.file_path ? (
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/documentos/${doc.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/documentos/${doc.id}/editar`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acao nao pode ser desfeita. O documento sera
                                permanentemente excluido.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(doc)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deleting === doc.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Excluir"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}