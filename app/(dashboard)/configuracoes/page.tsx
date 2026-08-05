"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Bell, Globe, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Configuracoes</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as configuracoes da plataforma
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Settings className="h-4 w-4" />
                Configuracoes Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-foreground">
                  Resultados por Pagina
                </Label>
                <Input
                  type="number"
                  defaultValue={15}
                  min={5}
                  max={50}
                  className="bg-secondary text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-foreground">
                  Periodo Padrao (dias)
                </Label>
                <Input
                  type="number"
                  defaultValue={30}
                  min={1}
                  max={365}
                  className="bg-secondary text-foreground"
                />
              </div>
              <Separator />
              <Button>Salvar Configuracoes</Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Bell className="h-4 w-4" />
                Notificacoes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Novas licitacoes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Receber alertas de novas licitacoes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Encerramento de prazo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Alertar sobre prazos proximos
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Atualizacoes de contratos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Notificar alteracoes em contratos
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Globe className="h-4 w-4" />
                API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-foreground">
                  Endpoint Base
                </Label>
                <Input
                  defaultValue="https://pncp.gov.br/api/consulta"
                  readOnly
                  className="bg-secondary font-mono text-xs text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-foreground">
                  Timeout (ms)
                </Label>
                <Input
                  type="number"
                  defaultValue={30000}
                  className="bg-secondary text-foreground"
                />
              </div>
              <div className="rounded-lg bg-accent p-3">
                <p className="text-xs text-accent-foreground">
                  A API do PNCP e publica e nao requer autenticacao para
                  consultas.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Shield className="h-4 w-4" />
                Sobre
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Versao
                </p>
                <p className="mt-1 text-sm text-foreground">1.0.0</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Fonte de Dados
                </p>
                <p className="mt-1 text-sm text-foreground">
                  Portal Nacional de Contratacoes Publicas (PNCP)
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  API
                </p>
                <a
                  href="https://pncp.gov.br/api/consulta/swagger-ui/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm text-primary hover:underline"
                >
                  Documentacao Swagger
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
