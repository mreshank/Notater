
import { Home, ListMusic, LayoutGrid, AudioWaveform, Disc, SlidersHorizontal, LucideIcon } from "lucide-react";


export type ViewMode = "home" | "keys" | "drums" | "seq" | "piano" | "mix";

interface NavButtonProps {
    view: ViewMode;
    icon: LucideIcon;
    label: string;
    activeView: ViewMode;
    onClick: (view: ViewMode) => void;
    isFirst?: boolean;
    isLast?: boolean;
}

function NavButton({ view, icon: Icon, label, activeView, onClick, isFirst, isLast }: NavButtonProps) {
    const isActive = activeView === view;
    return (
        <button
            onClick={() => onClick(view)}
            className={`
                relative flex flex-col items-center justify-center gap-0.5 sm:gap-1 
                py-2 px-1.5 sm:px-3 flex-1 sm:flex-initial sm:min-w-[56px] 
                transition-all active:scale-95 touch-manipulation
                ${isFirst ? 'rounded-l-xl sm:rounded-lg' : ''} 
                ${isLast ? 'rounded-r-xl sm:rounded-lg' : ''}
                ${!isFirst && !isLast ? 'sm:rounded-lg' : ''}
                ${isActive
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }
            `}
        >
            {/* Active indicator bar - mobile only */}
            {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full sm:hidden" />
            )}
            <Icon size={18} className="sm:w-5 sm:h-5" />
            <span className="text-[9px] sm:text-xs font-semibold tracking-tight">{label}</span>
        </button>
    );
}

interface StudioNavProps {
    activeView: ViewMode;
    setActiveView: (view: ViewMode) => void;
}

export function StudioNav({ activeView, setActiveView }: StudioNavProps) {
    return (
        <nav className="h-14 sm:h-20 border-t border-foreground/10 flex items-center px-1.5 sm:px-4 shrink-0 pb-safe z-40 bg-background/95 backdrop-blur-lg safe-area-bottom">
            {/* Mobile: Connected tab bar */}
            <div className="flex sm:hidden w-full bg-muted/40 rounded-xl p-0.5 border border-border/50">
                <NavButton view="home" icon={Home} label="Home" activeView={activeView} onClick={setActiveView} isFirst />
                <NavButton view="drums" icon={Disc} label="Drums" activeView={activeView} onClick={setActiveView} />
                <NavButton view="seq" icon={ListMusic} label="Seq" activeView={activeView} onClick={setActiveView} />
                <NavButton view="piano" icon={LayoutGrid} label="Roll" activeView={activeView} onClick={setActiveView} />
                <NavButton view="keys" icon={AudioWaveform} label="Keys" activeView={activeView} onClick={setActiveView} />
                <NavButton view="mix" icon={SlidersHorizontal} label="Mix" activeView={activeView} onClick={setActiveView} isLast />
            </div>

            {/* Desktop: Spaced buttons */}
            <div className="hidden sm:flex items-center justify-around w-full">
                <NavButton view="home" icon={Home} label="Home" activeView={activeView} onClick={setActiveView} />
                <div className="w-px h-8 bg-foreground/10" />
                <NavButton view="drums" icon={Disc} label="Drums" activeView={activeView} onClick={setActiveView} />
                <NavButton view="seq" icon={ListMusic} label="Seq" activeView={activeView} onClick={setActiveView} />
                <NavButton view="piano" icon={LayoutGrid} label="Roll" activeView={activeView} onClick={setActiveView} />
                <NavButton view="keys" icon={AudioWaveform} label="Keys" activeView={activeView} onClick={setActiveView} />
                <NavButton view="mix" icon={SlidersHorizontal} label="Mix" activeView={activeView} onClick={setActiveView} />
            </div>
        </nav>
    );
}
