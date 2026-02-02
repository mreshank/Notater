
import { Home, ListMusic, LayoutGrid, AudioWaveform, Disc, SlidersHorizontal, LucideIcon } from "lucide-react";


export type ViewMode = "home" | "keys" | "drums" | "seq" | "piano" | "mix";

interface NavButtonProps {
    view: ViewMode;
    icon: LucideIcon;
    label: string;
    activeView: ViewMode;
    onClick: (view: ViewMode) => void;
}

function NavButton({ view, icon: Icon, label, activeView, onClick }: NavButtonProps) {
    const isActive = activeView === view;
    return (
        <button
            onClick={() => onClick(view)}
            className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive ? "opacity-100 text-primary scale-105" : "opacity-50 hover:opacity-100"
                }`}
        >
            <Icon size={24} />
            <span className="text-xs font-bold">{label}</span>
        </button>
    );
}

interface StudioNavProps {
    activeView: ViewMode;
    setActiveView: (view: ViewMode) => void;
}

export function StudioNav({ activeView, setActiveView }: StudioNavProps) {
    return (
        <nav className="h-20 border-t border-foreground/10 glass flex items-center justify-around shrink-0 pb-safe z-40 bg-background/80 backdrop-blur-md">
            <NavButton view="home" icon={Home} label="Home" activeView={activeView} onClick={setActiveView} />

            <div className="w-px h-8 bg-foreground/10" />
            
            <NavButton view="drums" icon={Disc} label="Drums" activeView={activeView} onClick={setActiveView} />
            <NavButton view="seq" icon={ListMusic} label="Seq" activeView={activeView} onClick={setActiveView} />
            <NavButton view="piano" icon={LayoutGrid} label="Roll" activeView={activeView} onClick={setActiveView} />
            <NavButton view="keys" icon={AudioWaveform} label="Keys" activeView={activeView} onClick={setActiveView} />
            <NavButton view="mix" icon={SlidersHorizontal} label="Mix" activeView={activeView} onClick={setActiveView} />
        </nav>
    );
}
