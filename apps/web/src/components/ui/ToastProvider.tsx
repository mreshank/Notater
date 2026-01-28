"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Date.now().toString() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto dismiss
        setTimeout(() => {
            removeToast(id);
        }, 4000);
    }, [removeToast]);

    const value = {
        toast: addToast,
        success: (msg: string) => addToast(msg, "success"),
        error: (msg: string) => addToast(msg, "error"),
        warning: (msg: string) => addToast(msg, "warning"),
        info: (msg: string) => addToast(msg, "info"),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) => {
    const icons = {
        success: <CheckCircle size={16} className="text-green-500" />,
        error: <AlertCircle size={16} className="text-destructive" />,
        warning: <AlertTriangle size={16} className="text-yellow-500" />,
        info: <Info size={16} className="text-blue-500" />,
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="pointer-events-auto min-w-[300px] max-w-sm bg-background/90 backdrop-blur-md border border-border shadow-lg rounded-lg p-3 flex items-start gap-3"
            layout
        >
            <div className="mt-0.5 shrink-0">{icons[toast.type]}</div>
            <div className="flex-1 text-sm font-medium text-foreground leading-tight pt-0.5">
                {toast.message}
            </div>
            <button
                onClick={onDismiss}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
                <X size={14} />
            </button>
        </motion.div>
    );
};
