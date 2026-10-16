import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { fallingExtrasHtml } from "../../data/cardArt";
import { coverHtml, fxFor, insideLeftHtml, printedLine } from "../../data/greetingCards";
import "./wellCard.css";

// The approved envelope sequence (well-card-studio.html):
// sealed -> tap seal -> flap rotates back -> card slides up out of the pocket
// rotated -> comes forward upright (falling extras) -> tap -> bifold opens.
type EnvState = "sealed" | "opened" | "rising" | "free" | "spread";

export interface WellCardEnvelopeProps {
  occasionId: string;
  designId: string;
  photo?: string | null;
  message: string;
  signature: string;
  toLine?: string;
  /** Open on its own shortly after showing (used by the received-card screen when asked). */
  autoOpen?: boolean;
  showReplay?: boolean;
}

function reducedMotion(): boolean {
  try {
    return !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

// A new design, occasion or photo closes the card again, like the demo: the
// inner envelope remounts with fresh state.
export default function WellCardEnvelope(props: WellCardEnvelopeProps) {
  const k = `${props.occasionId}|${props.designId}|${props.photo ? props.photo.length + props.photo.slice(-24) : ""}`;
  return <EnvelopeScene key={k} {...props} />;
}

function EnvelopeScene({
  occasionId,
  designId,
  photo,
  message,
  signature,
  toLine = "For you",
  autoOpen = false,
  showReplay = true,
}: WellCardEnvelopeProps) {
  const [state, setState] = useState<EnvState>("sealed");
  const [fxHtml, setFxHtml] = useState("");
  const [spreadScale, setSpreadScale] = useState(1);
  const [stageH, setStageH] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stateRef = useRef<EnvState>("sealed");
  useEffect(() => { stateRef.current = state; }, [state]);

  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const cover = useMemo(() => coverHtml(occasionId, designId, photo), [occasionId, designId, photo]);
  const insideLeft = useMemo(() => insideLeftHtml(occasionId, designId, photo), [occasionId, designId, photo]);
  const printed = printedLine(occasionId, designId);

  // Cards used to be one face, so people need a nudge to open the inside (Loretta, 2026-10-16).
  const [seenInside, setSeenInside] = useState(false);

  const reset = () => {
    clearTimers();
    setSeenInside(false);
    setFxHtml("");
    setState("sealed");
  };

  const open = useCallback(() => {
    if (stateRef.current !== "sealed") return;
    stateRef.current = "opened";
    setState("opened");
    later(() => setState("rising"), 1050);
    later(() => {
      setState("free");
      if (reducedMotion()) { setFxHtml(""); return; }
      setStageH(stageRef.current?.offsetHeight ?? 0);
      setFxHtml(fallingExtrasHtml(fxFor(occasionId, designId)));
    }, 2050);
  }, [occasionId, designId]);

  const fitSpread = () => {
    const stage = stageRef.current, card = cardRef.current;
    if (!stage || !card || !card.offsetWidth) return;
    setSpreadScale(Math.min(1, (stage.offsetWidth - 12) / (card.offsetWidth * 2)));
  };

  useEffect(() => {
    if (!autoOpen) return;
    const t = setTimeout(open, 600);
    return () => clearTimeout(t);
  }, [autoOpen, open]);

  useEffect(() => {
    const onResize = () => { if (stateRef.current === "spread") fitSpread(); };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); clearTimers(); };
  }, []);

  const onCard = () => {
    if (state === "free") { fitSpread(); setState("spread"); setSeenInside(true); }
    else if (state === "spread") setState("free");
    else if (state === "sealed") open();
  };
  const onCardKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onCard(); }
  };
  const replay = () => {
    if (state === "spread") { setState("free"); later(reset, 900); }
    else reset();
  };

  const stageClass = [
    "wc-stage",
    state !== "sealed" ? "wc-opened" : "",
    state === "rising" ? "wc-rising" : "",
    state === "free" || state === "spread" ? "wc-free" : "",
    state === "spread" ? "wc-spread" : "",
    state === "free" && !seenInside ? "wc-peek" : "",
  ].filter(Boolean).join(" ");
  const tapHint = state === "free" ? (seenInside ? "Tap the card to read the front again" : "Tap the card to open it") : state === "spread" ? "Tap the card to close it" : "";

  return (
    <div className="wc-root" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div className={stageClass} ref={stageRef} style={{ "--spread-scale": spreadScale.toFixed(3) } as CSSProperties}>
        <div className="wc-scene">
          <div className="wc-env-inner" />
          <div className="wc-card-slot">
            <div
              className="wc-card"
              ref={cardRef}
              tabIndex={0}
              role="button"
              aria-label={state === "spread" ? "Close the card" : "Open the card"}
              onClick={onCard}
              onKeyDown={onCardKey}
            >
              <div className="wc-page wc-inside-right wc-paper">
                <div className="wc-inside-pad">
                  {printed && <div className="wc-printed">{printed}</div>}
                  <div className="wc-hand">
                    {message}
                    <span className="wc-sig">{signature}</span>
                  </div>
                </div>
              </div>
              <div className="wc-page wc-cover">
                <div className="wc-face" dangerouslySetInnerHTML={{ __html: cover }} />
                <div className="wc-back" dangerouslySetInnerHTML={{ __html: insideLeft }} />
              </div>
            </div>
          </div>
          <div className="wc-pocket"><i className="wc-l" /><i className="wc-r" /><i className="wc-b" /><i className="wc-edge" /></div>
          <div className="wc-to">{toLine}</div>
          <div className="wc-flap"><div className="wc-out" /><div className="wc-in" /></div>
          <button className="wc-seal" type="button" aria-label="Break the seal and open the envelope" onClick={open}>
            <img src="/cards/logo.png" alt="" />
          </button>
          <div className="wc-hint">Tap the seal</div>
        </div>
        <div
          className="wc-fx"
          aria-hidden="true"
          style={{ "--stageH": `${stageH}px` } as CSSProperties}
          dangerouslySetInnerHTML={{ __html: fxHtml }}
        />
      </div>
      <p className="wc-tap-hint" aria-live="polite">{tapHint}</p>
      {showReplay && (
        <div className="wc-ctrl">
          <button type="button" className="wc-btn" onClick={replay}>Close and play again</button>
        </div>
      )}
    </div>
  );
}
