"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Upload,
  FileText,
  X,
  Loader2,
  Save,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const documentSchema = z.object({
  title: z.string().min(3, "Titulo deve ter pelo menos 3 caracteres"),
  document_type: z.enum([
    "proposta",
    "carta_de_apresentacao",
    "declaracao",
    "atestado",
    "outro",
  ]),
  licitacao_numero: z.string().optional(),
  orgao_destino: z.string().optional(),
});

type DocumentForm = z.infer<typeof documentSchema>;

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url?: string;
  uploading?: boolean;
}

const fontFamilies = [
  { value: "Arial", label: "Arial" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Georgia", label: "Georgia" },
  { value: "Verdana", label: "Verdana" },
  { value: "Courier New", label: "Courier New" },
];

const fontSizes = [
  { value: "12px", label: "12" },
  { value: "14px", label: "14" },
  { value: "16px", label: "16" },
  { value: "18px", label: "18" },
  { value: "20px", label: "20" },
  { value: "24px", label: "24" },
];

export default function NovoDocumentoPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [currentFont, setCurrentFont] = useState("Arial");
  const [currentSize, setCurrentSize] = useState("14px");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DocumentForm>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      document_type: "proposta",
    },
  });

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleFontChange = (font: string) => {
    setCurrentFont(font);
    execCommand("fontName", font);
  };

  const handleSizeChange = (size: string) => {
    setCurrentSize(size);
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement("span");
        span.style.fontSize = size;
        range.surroundContents(span);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const supabase = createClient();
    if (!supabase || !user) return;

    for (const file of Array.from(files)) {
      const newFile: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploading: true,
      };

      setUploadedFiles((prev) => [...prev, newFile]);

      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("document-attachments")
        .upload(fileName, file);

      if (data && !error) {
        const { data: urlData } = supabase.storage
          .from("document-attachments")
          .getPublicUrl(fileName);

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.name === file.name && f.uploading
              ? { ...f, url: urlData.publicUrl, uploading: false }
              : f
          )
        );
      } else {
        setUploadedFiles((prev) =>
          prev.filter((f) => !(f.name === file.name && f.uploading))
        );
      }
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  async function onSubmit(data: DocumentForm) {
    if (!user) return;

    setSaving(true);
    const supabase = createClient();
    if (!supabase) {
      setSaving(false);
      return;
    }

    const editorContent = editorRef.current?.innerHTML || "";

    const { data: doc, error } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        title: data.title,
        document_type: data.document_type,
        content: editorContent,
        licitacao_numero: data.licitacao_numero || null,
        orgao_destino: data.orgao_destino || null,
        attachments: uploadedFiles
          .filter((f) => f.url)
          .map((f) => ({ name: f.name, url: f.url, type: f.type })),
        status: "rascunho",
      })
      .select()
      .single();

    setSaving(false);

    if (!error && doc) {
      router.push("/documentos");
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Acesso nao autorizado</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/documentos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Documento</h1>
          <p className="text-sm text-muted-foreground">
            Crie um documento para sua licitacao
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Document Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informacoes do Documento
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Titulo do Documento *</Label>
              <Input
                id="title"
                placeholder="Ex: Proposta Comercial - Pregao 001/2026"
                {...register("title")}
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_type">Tipo de Documento *</Label>
              <Select
                defaultValue="proposta"
                onValueChange={(v) =>
                  setValue("document_type", v as DocumentForm["document_type"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proposta">Proposta Comercial</SelectItem>
                  <SelectItem value="carta_de_apresentacao">
                    Carta de Apresentacao
                  </SelectItem>
                  <SelectItem value="declaracao">Declaracao</SelectItem>
                  <SelectItem value="atestado">Atestado</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licitacao_numero">Numero da Licitacao</Label>
              <Input
                id="licitacao_numero"
                placeholder="Ex: PE 001/2026"
                {...register("licitacao_numero")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgao_destino">Orgao Destino</Label>
              <Input
                id="orgao_destino"
                placeholder="Ex: Prefeitura Municipal de Sao Paulo"
                {...register("orgao_destino")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Rich Text Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Conteudo do Documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/50 p-2">
              <Select value={currentFont} onValueChange={handleFontChange}>
                <SelectTrigger className="h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontFamilies.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={currentSize} onValueChange={handleSizeChange}>
                <SelectTrigger className="h-8 w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontSizes.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCommand("bold")}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCommand("italic")}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCommand("underline")}
              >
                <Underline className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCommand("justifyLeft")}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCommand("justifyCenter")}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCommand("justifyRight")}
              >
                <AlignRight className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCommand("insertUnorderedList")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCommand("insertOrderedList")}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>

            {/* Editable Content */}
            <div
              ref={editorRef}
              contentEditable
              className="min-h-[400px] rounded-lg border border-input bg-card p-4 focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ fontFamily: currentFont, fontSize: currentSize }}
              onInput={(e) => setContent(e.currentTarget.innerHTML)}
            />
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Anexos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Anexe documentos como notas fiscais, certidoes, atestados e outros
              arquivos necessarios.
            </p>

            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) =>
                e.key === "Enter" && fileInputRef.current?.click()
              }
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm font-medium text-foreground">
                Clique para selecionar arquivos
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOC, DOCX, JPG, PNG (max. 10MB cada)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
              />
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    {file.uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeFile(file.name)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/documentos">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Documento
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
