"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  index?: number;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendUp,
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <p className="text-2xl font-bold text-foreground">{value}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent">
              <Icon className="h-5 w-5 text-accent-foreground" />
            </div>
          </div>
          {(description || trend) && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              {trend && (
                <span
                  className={
                    trendUp ? "text-[hsl(152,60%,42%)]" : "text-destructive"
                  }
                >
                  {trend}
                </span>
              )}
              {description && (
                <span className="text-muted-foreground">{description}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
