"use client";
/**
 * Templates Modal — Browse and apply deck templates
 * Displayed when user creates a new deck or manually selects a template
 */

import { useCallback, useState, type ReactNode } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ThumbsUp, Clock } from "lucide-react";
import type { DeckTemplate } from "@/lib/deck/templates";
import { cn } from "@/components/ui/utils";

interface TemplatesModalProps {
  readonly commanderName: string;
  readonly onSelectTemplate: (template: DeckTemplate) => void;
  readonly onClose: () => void;
  readonly isOpen: boolean;
}

export function TemplatesModal({
  commanderName,
  onSelectTemplate,
  onClose,
  isOpen,
}: TemplatesModalProps) {
  const t = useTranslations("deck");
  const format = useFormatter();
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(
    null
  );

  // Fetch templates for this commander
  const {
    data: templates = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["templates", commanderName],
    queryFn: async () => {
      const res = await fetch(
        `/api/templates?commander=${encodeURIComponent(commanderName)}`
      );
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json() as Promise<DeckTemplate[]>;
    },
    enabled: isOpen && !!commanderName,
  });

  // Filter by archetype if selected
  const filteredTemplates = selectedArchetype
    ? templates.filter((t) => t.archetype === selectedArchetype)
    : templates;

  // Unique archetypes from templates
  const archetypes = Array.from(new Set(templates.map((t) => t.archetype)));

  const handleApply = useCallback(
    (template: DeckTemplate) => {
      onSelectTemplate(template);
      onClose();
    },
    [onSelectTemplate, onClose]
  );

  function templatesScrollBody(): ReactNode {
    if (isLoading) {
      return (
        <div className="text-center py-12 text-white/60">
          {t("templates.loading")}
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center py-12 text-red-400">
          {t("templates.loadFailed")}
        </div>
      );
    }
    if (templates.length === 0) {
      return (
        <div className="text-center py-12 text-white/60">
          {t("templates.empty")}
        </div>
      );
    }
    return (
      <>
        {archetypes.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-white/60">
              {t("templates.filterByArchetype")}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedArchetype(null)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  selectedArchetype === null
                    ? "bg-blue-600 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                )}
              >
                {t("templates.all")}
              </button>
              {archetypes.map((arch) => (
                <button
                  type="button"
                  key={arch}
                  onClick={() => setSelectedArchetype(arch)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    selectedArchetype === arch
                      ? "bg-blue-600 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  )}
                >
                  {arch}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              className="border border-white/10 rounded-lg p-4 hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer"
              onClick={() => handleApply(template)}
              whileHover={{ x: 4 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-white truncate">
                      {template.name}
                    </h3>
                    {template.source === "official" && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-600/30 text-blue-200 flex-shrink-0">
                        {t("templates.official")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/60 mb-2">
                    {t("templates.byAuthor", {
                      archetype: template.archetype,
                      author: template.author,
                    })}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-white/50">
                    <div className="flex items-center gap-1">
                      <ThumbsUp size={14} />
                      <span>{template.upvotes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>
                        {format.dateTime(new Date(template.createdAt))}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 flex-shrink-0 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApply(template);
                  }}
                >
                  <Download size={16} />
                  {t("templates.use")}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </>
    );
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-[var(--background)] rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold text-white">
                {t("templates.title", { commander: commanderName })}
              </h2>
              <p className="text-sm text-white/60 mt-1">
                {t("templates.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label={t("templates.close")}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {templatesScrollBody()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
