
"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
    componentName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class StudioErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4 bg-muted/20 rounded-xl border border-dashed border-destructive/50">
                    <div className="p-3 bg-destructive/10 rounded-full text-destructive">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">
                            {this.props.componentName || "Component"} Error
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                            Something went wrong while loading this instrument.
                        </p>
                    </div>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-bold"
                    >
                        <RefreshCw size={14} /> Retry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
