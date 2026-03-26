"use client";
import React, { useState } from "react";
import Image from "next/image";
import { RefreshCw } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { CardFace } from "@/lib/deck/types";
import { CARD_BACK_URL } from "@/lib/scryfall/images";
interface CardFlipProps { readonly frontFace: CardFace; readonly backFace: CardFace; readonly isFlexibleLand?: boolean; readonly className?: string; readonly onClick?: () => void; }
function FaceImage({ face, side }: { readonly face: CardFace; readonly side: "front" | "back" }) {
  const [err, setErr] = useState(false);
  return (<div className={cn("absolute inset-0 rounded-[4.75%] overflow-hidden backface-hidden", side==="back"&&"[transform:rotateY(180deg)]")} aria-hidden={side==="back"}><Image src={err?CARD_BACK_URL:face.imageUri} alt={face.name} width={223} height={310} className="block w-full h-auto" onError={()=>setErr(true)} unoptimized /></div>);
}
/** 3D Moxfield-style card flip. Circular ↻ button bottom-right, 350ms ease-in-out. */
export function CardFlip({ frontFace, backFace, isFlexibleLand=false, className, onClick }: CardFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flip = (e: React.MouseEvent) => { e.stopPropagation(); setIsFlipped(p=>!p); };
  const active = isFlipped ? backFace : frontFace;
  return (
    <div className={cn("relative group", className)} style={{perspective:"1000px"}}>
      <div role={onClick?"button":undefined} tabIndex={onClick?0:undefined} aria-label={onClick?`Add ${active.name} to deck`:active.name} onClick={onClick} onKeyDown={onClick?(e)=>{if(e.key==="Enter"||e.key===" ")onClick();}:undefined} className={cn("relative w-full rounded-[4.75%] [transform-style:preserve-3d] transition-transform ease-in-out",isFlipped?"[transform:rotateY(180deg)]":"[transform:rotateY(0deg)]",onClick&&"cursor-pointer")} style={{transitionDuration:"350ms"}}>
        <div className="w-full" style={{paddingTop:"139.46%"}} />
        <FaceImage face={frontFace} side="front" />
        <FaceImage face={backFace} side="back" />
      </div>
      <button type="button" aria-label={isFlipped?`Show front: ${frontFace.name}`:`Turn over: ${backFace.name}`} title={isFlipped?`Show front: ${frontFace.name}`:`Turn over: ${backFace.name}`} onClick={flip} className="absolute bottom-2 right-2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 ring-1 ring-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
        <RefreshCw className={cn("w-4 h-4 text-white transition-transform duration-300",isFlipped&&"rotate-180")} />
      </button>
      <div className={cn("absolute top-1.5 left-1.5 z-10 px-1 py-0.5 rounded text-[9px] font-bold leading-none pointer-events-none select-none",isFlexibleLand?"bg-emerald-600/80 text-white":"bg-black/60 text-white/90")} title={isFlexibleLand?"Flexible land (MDFC)":"Double-faced card"}>
        {isFlexibleLand?"△▽ LAND":"△▽"}
      </div>
    </div>
  );
}
