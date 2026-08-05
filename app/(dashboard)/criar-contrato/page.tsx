"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Upload,
  Image as ImageIcon,
  FileText,
  X,
  Loader2,
  Save,
  ArrowLeft,
  Sparkles,
  Send,
  ChevronRight,
  Download,
  Eye,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const contractSchema = z.object({
  title: z.string().min(3, "Titulo deve ter pelo menos 3 caracteres"),
  contract_type: z.enum([
    "fornecimento",
    "servicos",
    "obras",
    "consultoria",
    "locacao",
    "outros",
  ]),
  contractor_name: z.string().min(2, "Nome do contratante e obrigatorio"),
  contractor_cnpj: z.string().optional(),
  contracted_name: z.string().min(2, "Nome do contratado e obrigatorio"),
  contracted_cnpj: z.string().optional(),
  value: z.string().optional(),
  duration: z.string().optional(),
  licitacao_numero: z.string().optional(),
});

type ContractForm = z.infer<typeof contractSchema>;

interface UploadedImage {
  name: string;
  size: number;
  type: string;
  url?: string;
  uploading?: boolean;
  preview?: string;
}

interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

const contractTypes = [
  { value: "fornecimento", label: "Fornecimento de Bens" },
  { value: "servicos", label: "Prestacao de Servicos" },
  { value: "obras", label: "Execucao de Obras" },
  { value: "consultoria", label: "Consultoria" },
  { value: "locacao", label: "Locacao" },
  { value: "outros", label: "Outros" },
];

const fontFamilies = [
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Roboto, sans-serif", label: "Roboto" },
  { value: "Open Sans, sans-serif", label: "Open Sans" },
];

const fontSizes = [
  { value: "11px", label: "11" },
  { value: "12px", label: "12" },
  { value: "14px", label: "14" },
  { value: "16px", label: "16" },
  { value: "18px", label: "18" },
  { value: "20px", label: "20" },
  { value: "24px", label: "24" },
  { value: "28px", label: "28" },
];

const clauseTemplates = [
  {
    title: "Clausula de Objeto",
    content:
      "O presente contrato tem por objeto [descrever o objeto da contratacao], conforme especificacoes constantes no Termo de Referencia anexo.",
  },
  {
    title: "Clausula de Vigencia",
    content:
      "O prazo de vigencia deste contrato e de [XX] meses, contados a partir da data de sua assinatura, podendo ser prorrogado nos termos do art. 107 da Lei 14.133/2021.",
  },
  {
    title: "Clausula de Valor",
    content:
      "O valor total do presente contrato e de R$ [VALOR] ([valor por extenso]), inclusos todos os tributos, encargos e despesas necessarias a execucao do objeto.",
  },
  {
    title: "Clausula de Pagamento",
    content:
      "O pagamento sera efetuado em ate [XX] dias uteis, contados do recebimento definitivo, mediante apresentacao de nota fiscal e demais documentos exigidos.",
  },
  {
    title: "Clausula de Garantia",
    content:
      "O CONTRATADO devera prestar garantia no valor correspondente a [X]% do valor total do contrato, nas modalidades previstas no art. 96 da Lei 14.133/2021.",
  },
];

export default function CriarContratoPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [currentFont, setCurrentFont] = useState("Inter, sans-serif");
  const [currentSize, setCurrentSize] = useState("14px");
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [aiMessages, setAIMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAIInput] = useState("");
  const [aiLoading, setAILoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContractForm>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      contract_type: "fornecimento",
    },
  });

  const watchContractType = watch("contract_type");

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleFontChange = (font: string) => {
    setCurrentFont(font);
    execCommand("fontName", font.split(",")[0]);
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

  const insertClause = (content: string) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const div = document.createElement("p");
        div.innerHTML = content;
        range.insertNode(div);
      } else {
        editorRef.current.innerHTML += `<p>${content}</p>`;
      }
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;

      const preview = URL.createObjectURL(file);
      const newImage: UploadedImage = {
        name: file.name,
        size: file.size,
        type: file.type,
        preview,
        uploading: true,
      };

      setUploadedImages((prev) => [...prev, newImage]);

      // Simular upload (substituir por Supabase Storage quando configurado)
      setTimeout(() => {
        setUploadedImages((prev) =>
          prev.map((img) =>
            img.name === file.name && img.uploading
              ? { ...img, url: preview, uploading: false }
              : img
          )
        );
      }, 1000);
    }
  };

  const insertImage = (imageUrl: string) => {
    if (editorRef.current) {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.margin = "1rem 0";
      img.style.borderRadius = "8px";
      editorRef.current.appendChild(img);
    }
  };

  const removeImage = (fileName: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.name !== fileName));
  };

  const handleAISubmit = async () => {
    if (!aiInput.trim()) return;

    const userMessage: AIMessage = { role: "user", content: aiInput };
    setAIMessages((prev) => [...prev, userMessage]);
    setAIInput("");
    setAILoading(true);

    try {
      const response = await fetch("/api/ai/contract-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...aiMessages, userMessage],
          contractType: watchContractType,
          context: editorRef.current?.innerText?.slice(0, 500),
        }),
      });

      const data = await response.json();

      // Resposta temporaria enquanto IA nao esta configurada
      const assistantMessage: AIMessage = {
        role: "assistant",
        content:
          data.message ||
          "Integracao com IA pendente. Configure AI_GATEWAY_API_KEY para ativar.",
      };
      setAIMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setAIMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Erro ao conectar com o assistente. Tente novamente.",
        },
      ]);
    } finally {
      setAILoading(false);
    }
  };

  async function onSubmit(data: ContractForm) {
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
        document_type: "contrato",
        content: editorContent,
        licitacao_numero: data.licitacao_numero || null,
        orgao_destino: data.contractor_name || null,
        attachments: uploadedImages
          .filter((img) => img.url)
          .map((img) => ({ name: img.name, url: img.url, type: img.type })),
        status: "rascunho",
        metadata: {
          contract_type: data.contract_type,
          contractor_cnpj: data.contractor_cnpj || null,
          contracted_name: data.contracted_name,
          contracted_cnpj: data.contracted_cnpj || null,
          value: data.value || null,
          duration: data.duration || null,
        },
      })
      .select()
      .single();

    setSaving(false);

    if (!error && doc) {
      router.push("/contratos"); // ajuste para a rota real da tela de Contratos
    }
  }

  if (!isAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[400px] gap-4"
      >
        <FileText className="h-16 w-16 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">
          Acesso restrito a administradores
        </p>
        <Button asChild variant="outline">
          <Link href="/auth/login">Fazer Login como Admin</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/documentos">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Criar Contrato
            </h1>
            <p className="text-sm text-muted-foreground">
              Editor completo para criacao de contratos de licitacao
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAIPanel(!showAIPanel)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {showAIPanel ? "Ocultar IA" : "Mostrar IA"}
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor Area */}
          <div className={showAIPanel ? "lg:col-span-2" : "lg:col-span-3"}>
            <Tabs defaultValue="editor" className="space-y-4">
              <TabsList>
                <TabsTrigger value="info">Informacoes</TabsTrigger>
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="images">Imagens</TabsTrigger>
                <TabsTrigger value="templates">Modelos</TabsTrigger>
              </TabsList>

              {/* Contract Info Tab */}
              <TabsContent value="info">
                <Card>
                  <CardHeader>
                    <CardTitle>Dados do Contrato</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="title">Titulo do Contrato *</Label>
                      <Input
                        id="title"
                        placeholder="Ex: Contrato de Fornecimento de Material de Escritorio"
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
                      <Label>Tipo de Contrato *</Label>
                      <Select
                        defaultValue="fornecimento"
                        onValueChange={(v) =>
                          setValue(
                            "contract_type",
                            v as ContractForm["contract_type"]
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {contractTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="licitacao_numero">
                        Numero da Licitacao
                      </Label>
                      <Input
                        id="licitacao_numero"
                        placeholder="Ex: PE 001/2026"
                        {...register("licitacao_numero")}
                      />
                    </div>

                    <Separator className="md:col-span-2" />

                    <div className="space-y-2">
                      <Label htmlFor="contractor_name">
                        Nome do Contratante *
                      </Label>
                      <Input
                        id="contractor_name"
                        placeholder="Orgao Publico / Empresa Contratante"
                        {...register("contractor_name")}
                        className={
                          errors.contractor_name ? "border-destructive" : ""
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contractor_cnpj">CNPJ Contratante</Label>
                      <Input
                        id="contractor_cnpj"
                        placeholder="00.000.000/0000-00"
                        {...register("contractor_cnpj")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contracted_name">
                        Nome do Contratado *
                      </Label>
                      <Input
                        id="contracted_name"
                        placeholder="Empresa / Fornecedor Contratado"
                        {...register("contracted_name")}
                        className={
                          errors.contracted_name ? "border-destructive" : ""
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contracted_cnpj">CNPJ Contratado</Label>
                      <Input
                        id="contracted_cnpj"
                        placeholder="00.000.000/0000-00"
                        {...register("contracted_cnpj")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="value">Valor do Contrato</Label>
                      <Input
                        id="value"
                        placeholder="R$ 0,00"
                        {...register("value")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Vigencia (meses)</Label>
                      <Input
                        id="duration"
                        placeholder="12"
                        {...register("duration")}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Editor Tab */}
              <TabsContent value="editor">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/50 p-2">
                      <Select
                        value={currentFont}
                        onValueChange={handleFontChange}
                      >
                        <SelectTrigger className="h-8 w-36">
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

                      <Select
                        value={currentSize}
                        onValueChange={handleSizeChange}
                      >
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
                        title="Negrito"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => execCommand("italic")}
                        title="Italico"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => execCommand("underline")}
                        title="Sublinhado"
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
                        title="Alinhar a esquerda"
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => execCommand("justifyCenter")}
                        title="Centralizar"
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => execCommand("justifyRight")}
                        title="Alinhar a direita"
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => execCommand("justifyFull")}
                        title="Justificar"
                      >
                        <AlignJustify className="h-4 w-4" />
                      </Button>

                      <Separator orientation="vertical" className="h-6 mx-1" />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => execCommand("insertUnorderedList")}
                        title="Lista"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => execCommand("insertOrderedList")}
                        title="Lista numerada"
                      >
                        <ListOrdered className="h-4 w-4" />
                      </Button>

                      <Separator orientation="vertical" className="h-6 mx-1" />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => imageInputRef.current?.click()}
                        title="Inserir imagem"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.print()}
                        title="Imprimir"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Editor */}
                    <div
                      ref={editorRef}
                      contentEditable
                      className="min-h-[500px] rounded-lg border border-input bg-card p-6 focus:outline-none focus:ring-2 focus:ring-ring prose prose-sm max-w-none dark:prose-invert"
                      style={{ fontFamily: currentFont, fontSize: currentSize }}
                      suppressContentEditableWarning
                    >
                      <h1 style={{ textAlign: "center", fontSize: "18px" }}>
                        CONTRATO DE{" "}
                        {
                          contractTypes.find((t) => t.value === watchContractType)
                            ?.label
                        }
                      </h1>
                      <p style={{ textAlign: "justify" }}>
                        Pelo presente instrumento particular, as partes abaixo
                        qualificadas celebram este contrato, regido pela Lei
                        14.133/2021 e demais legislacoes aplicaveis.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Galeria de Imagens
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Adicione imagens como logotipos, assinaturas digitais,
                      carimbos ou ilustracoes ao contrato.
                    </p>

                    <div
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50 cursor-pointer"
                      onClick={() => imageInputRef.current?.click()}
                      onKeyDown={(e) =>
                        e.key === "Enter" && imageInputRef.current?.click()
                      }
                    >
                      <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="text-sm font-medium text-foreground">
                        Clique para adicionar imagens
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, GIF, SVG (max. 5MB cada)
                      </p>
                      <input
                        ref={imageInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                    </div>

                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {uploadedImages.map((img) => (
                          <motion.div
                            key={img.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative group rounded-lg border border-border overflow-hidden"
                          >
                            {img.preview && (
                              <img
                                src={img.preview}
                                alt={img.name}
                                className="w-full h-24 object-cover"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  img.url && insertImage(img.url)
                                }
                                disabled={img.uploading}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeImage(img.name)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            {img.uploading && (
                              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Templates Tab */}
              <TabsContent value="templates">
                <Card>
                  <CardHeader>
                    <CardTitle>Modelos de Clausulas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      Clique em uma clausula para inseri-la no editor.
                    </p>
                    {clauseTemplates.map((clause) => (
                      <motion.div
                        key={clause.title}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="rounded-lg border border-border p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => insertClause(clause.content)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-foreground">
                            {clause.title}
                          </h4>
                          <Badge variant="secondary">Inserir</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {clause.content}
                        </p>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="flex justify-end gap-4 mt-6">
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
                    Salvar Contrato
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* AI Assistant Panel */}
          <AnimatePresence>
            {showAIPanel && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="lg:col-span-1"
              >
                <Card className="sticky top-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Assistente IA
                      <Badge variant="outline" className="ml-auto">
                        Beta
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg bg-accent/50 p-3 text-sm">
                      <p className="text-muted-foreground">
                        <strong>Nota:</strong> Para ativar o assistente IA,
                        configure a variavel{" "}
                        <code className="bg-muted px-1 rounded">
                          AI_GATEWAY_API_KEY
                        </code>{" "}
                        nas configuracoes do projeto.
                      </p>
                    </div>

                    <ScrollArea className="h-[300px] rounded-lg border border-border p-3">
                      {aiMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <Sparkles className="h-10 w-10 text-muted-foreground/50 mb-3" />
                          <p className="text-sm text-muted-foreground">
                            Pergunte sobre clausulas, conformidade legal ou
                            sugestoes para seu contrato
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {aiMessages.map((msg, i) => (
                            <div
                              key={i}
                              className={`rounded-lg p-3 text-sm ${
                                msg.role === "user"
                                  ? "bg-primary text-primary-foreground ml-4"
                                  : "bg-muted mr-4"
                              }`}
                            >
                              {msg.content}
                            </div>
                          ))}
                          {aiLoading && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Pensando...</span>
                            </div>
                          )}
                        </div>
                      )}
                    </ScrollArea>

                    <div className="flex gap-2">
                      <Textarea
                        value={aiInput}
                        onChange={(e) => setAIInput(e.target.value)}
                        placeholder="Ex: Sugira clausulas para contrato de servicos..."
                        className="min-h-[60px] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAISubmit();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="icon"
                        onClick={handleAISubmit}
                        disabled={aiLoading || !aiInput.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Sugestoes rapidas:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {[
                          "Clausula de multa",
                          "Rescisao contratual",
                          "Garantia",
                          "Foro",
                        ].map((suggestion) => (
                          <Badge
                            key={suggestion}
                            variant="outline"
                            className="cursor-pointer hover:bg-accent"
                            onClick={() => {
                              setAIInput(
                                `Sugira uma clausula de ${suggestion.toLowerCase()} adequada`
                              );
                            }}
                          >
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </motion.div>
  );
}
