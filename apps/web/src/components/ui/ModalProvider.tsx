"use client";
import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
// import { X } from "lucide-react";

type ModalType = "alert" | "confirm" | "prompt";

interface ModalOptions {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    defaultValue?: string; // For prompt
    onConfirm?: (value?: string) => void;
    onCancel?: () => void;
    isDestructive?: boolean;
}

interface ModalContextType {
    alert: (message: string, options?: Omit<ModalOptions, "message" | "defaultValue">) => Promise<void>;
    confirm: (message: string, options?: Omit<ModalOptions, "message" | "defaultValue">) => Promise<boolean>;
    prompt: (message: string, options?: Omit<ModalOptions, "message"> & { defaultValue?: string }) => Promise<string | null>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
    const [modal, setModal] = useState<(ModalOptions & { type: ModalType }) | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolveRef = useRef<((value: any) => void) | null>(null);

    const close = () => {
        setModal(null);
        resolveRef.current = null;
    };

    const alert = (message: string, options?: Omit<ModalOptions, "message">) => {
        return new Promise<void>((resolve) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            resolveRef.current = (val: any) => resolve(val);
            setModal({ type: "alert", message, ...options });
        });
    };

    const confirm = (message: string, options?: Omit<ModalOptions, "message">) => {
        return new Promise<boolean>((resolve) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            resolveRef.current = (val: any) => resolve(val);
            setModal({ type: "confirm", message, ...options });
        });
    };

    const prompt = (message: string, options?: Omit<ModalOptions, "message"> & { defaultValue?: string }) => {
        return new Promise<string | null>((resolve) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            resolveRef.current = (val: any) => resolve(val);
            setModal({ type: "prompt", message, ...options });
        });
    };

    const handleConfirm = (val?: string) => {
        if (modal?.onConfirm) modal.onConfirm(val);
        if (resolveRef.current) {
            // Start of fix: handling different resolve signatures
            if (modal?.type === "prompt") {
                resolveRef.current(val);
            } else {
                resolveRef.current(true);
            }
        }
        close();
    };

    const handleCancel = () => {
        if (modal?.onCancel) modal.onCancel();
        if (resolveRef.current) {
            if (modal?.type === "confirm") resolveRef.current(false);
            if (modal?.type === "prompt") resolveRef.current(null);
            if (modal?.type === "alert") resolveRef.current(undefined);
        }
        close();
    };

    return (
        <ModalContext.Provider value={{ alert, confirm, prompt }}>
            {children}
            <AnimatePresence>
                {modal && (
                    <ModalDialog
                        config={modal}
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                    />
                )}
            </AnimatePresence>
        </ModalContext.Provider>
    );
};

const ModalDialog = ({
    config,
    onConfirm,
    onCancel
}: {
    config: ModalOptions & { type: ModalType };
    onConfirm: (val?: string) => void;
    onCancel: () => void;
}) => {
    const [inputValue, setInputValue] = useState(config.defaultValue || "");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (config.type === "prompt" && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [config.type]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && config.type !== "alert") {
            onCancel();
        }
    };

    return (
        <div
            className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-background/50 backdrop-blur-sm"
            onClick={handleOverlayClick}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-sm bg-card border border-border shadow-2xl rounded-xl overflow-hidden"
            >
                <div className="p-4 md:p-6 space-y-4">
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg leading-none tracking-tight">
                            {config.title || (config.type === "alert" ? "Alert" : config.type === "confirm" ? "Confirm" : "Input")}
                        </h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {config.message}
                        </p>
                    </div>

                    {config.type === "prompt" && (
                        <input
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") onConfirm(inputValue);
                                if (e.key === "Escape") onCancel();
                            }}
                            className="w-full px-3 py-2 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Enter value..."
                            aria-label="Prompt Input"
                        />
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        {config.type !== "alert" && (
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 text-sm font-medium rounded hover:bg-muted transition-colors"
                            >
                                {config.cancelLabel || "Cancel"}
                            </button>
                        )}
                        <button
                            onClick={() => config.type === "prompt" ? onConfirm(inputValue) : onConfirm()}
                            className={`px-4 py-2 text-sm font-medium text-primary-foreground rounded transition-colors ${config.isDestructive ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}`}
                        >
                            {config.confirmLabel || "OK"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
