import { Check, Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { createPortal } from "react-dom";
import WellCardEnvelope from "../cards/WellCardEnvelope";
import {
  PHOTO_DESIGN,
  SENDABLE_OCCASIONS,
  coverHtml,
  designsFor,
  sampleNote,
} from "../../data/greetingCards";
import { useApp } from "../../store/AppContext";
import { compressImage, MAX_PHOTO_BYTES } from "../../utils/compressImage";
import "../cards/wellCard.css";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;
const MESSAGE_MAX = 220;
const SIGNATURE_MAX = 40;
// Card photos: longest edge 900px, JPEG 0.8 (about 80 to 150 KB).
const PHOTO_EDGE = 900;
const PHOTO_QUALITY = 0.8;

interface Props {
  /** Preset recipient (from a member's profile). Leave out to pick anyone after writing the card. */
  memberId?: string;
  memberName?: string;
  defaultOccasion?: string;
  onClose: () => void;
}

interface DirectoryMember {
  id: string;
  name: string;
  avatar?: string;
}

type Step = "make" | "recipient" | "sending" | "done" | "error";

function firstName(name: string): string {
  return (name || "").trim().split(/\s+/)[0] || "";
}

export default function CardSender({ memberId, memberName, defaultOccasion = "birthday", onClose }: Props) {
  const { user } = useApp();
  const startOcc = SENDABLE_OCCASIONS.some((o) => o.id === defaultOccasion) ? defaultOccasion : "birthday";
  const [occasionId, setOccasionId] = useState(startOcc);
  const [designId, setDesignId] = useState(designsFor(startOcc)[0]?.id ?? "");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState(firstName(user.name));
  const [step, setStep] = useState<Step>("make");
  const [recipient, setRecipient] = useState<DirectoryMember | null>(
    memberId ? { id: memberId, name: memberName || "" } : null
  );
  const [members, setMembers] = useState<DirectoryMember[] | null>(API_URL ? null : []);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const designs = designsFor(occasionId);

  // Thumbnails are static art; build them once per occasion.
  const thumbs = useMemo(
    () => designs.map((d) => ({ id: d.id, name: d.name, html: d.draw() })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [occasionId]
  );
  const photoThumb = useMemo(() => (photo ? coverHtml(occasionId, PHOTO_DESIGN, photo, true) : ""), [photo, occasionId]);

  useEffect(() => {
    if (step !== "recipient" || members || !API_URL) return;
    fetch(`${API_URL}/api/members?excludeEmail=${encodeURIComponent(user.email || "")}`)
      .then((r) => (r.ok ? r.json() : { members: [] }))
      .then((d) => setMembers((d.members || []) as DirectoryMember[]))
      .catch(() => setMembers([]));
  }, [step, members, user.email]);

  const chooseOccasion = (id: string) => {
    setOccasionId(id);
    setDesignId(photo ? PHOTO_DESIGN : designsFor(id)[0]?.id ?? "");
  };

  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError("");
    if (file.size > MAX_PHOTO_BYTES) { setPhotoError("That photo is too big. Try a smaller one."); return; }
    setPhotoBusy(true);
    try {
      const dataUrl = await compressImage(file, PHOTO_EDGE, PHOTO_QUALITY);
      setPhoto(dataUrl);
      setDesignId(PHOTO_DESIGN);
    } catch {
      setPhotoError("That photo would not open. Try another one.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const send = async (to: DirectoryMember) => {
    if (!API_URL || !user.email) { setStep("error"); return; }
    setStep("sending");
    try {
      const res = await fetch(`${API_URL}/api/tribe/${encodeURIComponent(to.id)}/card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          occasionId,
          designId,
          styleId: designId,
          message: message.trim(),
          signature: signature.trim(),
          photo: designId === PHOTO_DESIGN ? photo : undefined,
        }),
      });
      setStep(res.ok ? "done" : "error");
    } catch {
      setStep("error");
    }
  };

  const onSendClick = () => {
    if (recipient && memberId) send(recipient);
    else setStep("recipient");
  };

  const filtered = (members || []).filter(
    (m) => !search.trim() || m.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  const canSend = message.trim().length > 0 && !!designId && !photoBusy;

  return createPortal(
    <div className="fixed inset-0 z-[500] flex flex-col wc-root wc-backdrop" role="dialog" aria-label="Send a card">
      <div
        className="flex items-center justify-between px-4 pb-3 shrink-0"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))", borderBottom: "1px solid var(--wc-line)" }}
      >
        <div>
          <p className="text-[11px] uppercase" style={{ letterSpacing: ".3em", color: "var(--wc-sky)" }}>WELL Cards</p>
          <h2 style={{ fontFamily: "var(--wc-serif)", fontWeight: 500, fontSize: 26, margin: "2px 0 0" }}>
            {step === "recipient" ? "Who is it for?" : "Send a little love"}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ border: "1px solid rgba(255,255,255,.35)", background: "transparent", color: "#fff" }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ paddingLeft: "max(16px, env(safe-area-inset-left))", paddingRight: "max(16px, env(safe-area-inset-right))" }}>
        <div className="mx-auto flex flex-col items-center gap-4 py-5" style={{ maxWidth: 980 }}>
          {step === "make" && (
            <>
              <p className="wc-note" style={{ fontSize: 15, textAlign: "center" }}>
                Tap the WELL seal to open the envelope, then tap the card.
              </p>
              <WellCardEnvelope
                occasionId={occasionId}
                designId={designId}
                photo={photo}
                message={message || sampleNote(occasionId)}
                signature={signature}
                toLine={recipient?.name ? `For ${firstName(recipient.name)}` : "For you"}
              />
              <section className="wc-studio" aria-label="Make your card">
                <div>
                  <h2>1. Pick an occasion</h2>
                  <div className="wc-chips" role="group" aria-label="Occasion">
                    {SENDABLE_OCCASIONS.map((o) => (
                      <button key={o.id} type="button" aria-pressed={o.id === occasionId} onClick={() => chooseOccasion(o.id)}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h2>2. Pick a design</h2>
                  <div className="wc-designs" role="group" aria-label="Design">
                    {thumbs.map((t) => (
                      <button key={t.id} type="button" aria-pressed={t.id === designId} aria-label={t.name} onClick={() => setDesignId(t.id)}>
                        <div dangerouslySetInnerHTML={{ __html: t.html }} />
                      </button>
                    ))}
                    {photo && (
                      <button type="button" aria-pressed={designId === PHOTO_DESIGN} aria-label="Your photo" onClick={() => setDesignId(PHOTO_DESIGN)}>
                        <div dangerouslySetInnerHTML={{ __html: photoThumb }} />
                      </button>
                    )}
                    <button type="button" className="wc-add" onClick={() => fileRef.current?.click()} disabled={photoBusy}>
                      {photoBusy ? <Loader2 size={18} className="animate-spin" /> : photo ? "+ Use a different photo" : "+ Use my own photo"}
                    </button>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
                  {photoError && <p className="wc-note" style={{ color: "#F6B6A6", marginTop: 8 }}>{photoError}</p>}
                </div>
                <div className="wc-row2">
                  <label htmlFor="wc-msg">
                    3. Write your message
                    <textarea
                      id="wc-msg"
                      maxLength={MESSAGE_MAX}
                      value={message}
                      placeholder={sampleNote(occasionId)}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </label>
                  <label htmlFor="wc-sig">
                    Sign it
                    <input id="wc-sig" type="text" maxLength={SIGNATURE_MAX} value={signature} onChange={(e) => setSignature(e.target.value)} />
                  </label>
                </div>
                <p className="wc-note">Each card has a printed line inside, and your note appears below it in handwriting.</p>
              </section>
            </>
          )}

          {step === "recipient" && (
            <section className="wc-studio" aria-label="Choose who gets your card">
              <div>
                <h2>Send it to anyone in the WELL Collective</h2>
                <div style={{ position: "relative" }}>
                  <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--wc-muted)" }} />
                  <input
                    className="wc-search"
                    style={{ paddingLeft: 38 }}
                    type="search"
                    placeholder="Search by name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              {members === null ? (
                <div className="flex justify-center py-6"><Loader2 size={22} className="animate-spin" style={{ color: "var(--wc-sky)" }} /></div>
              ) : filtered.length === 0 ? (
                <p className="wc-note" style={{ textAlign: "center", padding: "16px 0" }}>
                  {search ? "No one by that name yet." : "No members to show right now."}
                </p>
              ) : (
                <div className="wc-people" role="list">
                  {filtered.map((m) => (
                    <button key={m.id} type="button" aria-pressed={recipient?.id === m.id} onClick={() => setRecipient(m)}>
                      {m.avatar ? <img src={m.avatar} alt="" /> : <span className="wc-initial">{(m.name || "?").charAt(0).toUpperCase()}</span>}
                      <span className="truncate">{m.name}</span>
                      {recipient?.id === m.id && <Check size={16} style={{ marginLeft: "auto", color: "var(--wc-sky)" }} />}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {step === "sending" && (
            <div className="flex flex-col items-center gap-3 py-16">
              <Loader2 size={28} className="animate-spin" style={{ color: "var(--wc-sky)" }} />
              <p className="wc-note" style={{ fontSize: 15 }}>Sealing your envelope...</p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--wc-sky)", color: "#050b14" }}>
                <Check size={28} />
              </div>
              <p style={{ fontFamily: "var(--wc-serif)", fontSize: 30, margin: 0 }}>Your card is on its way!</p>
              <p className="wc-note" style={{ fontSize: 15 }}>
                {recipient?.name ? `${firstName(recipient.name)} will get a little note to open it.` : "They will get a little note to open it."}
              </p>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p style={{ fontFamily: "var(--wc-serif)", fontSize: 28, margin: 0 }}>Oh no, that card did not go through.</p>
              <p className="wc-note" style={{ fontSize: 15 }}>Check your connection and try again.</p>
            </div>
          )}
        </div>
      </div>

      <div
        className="px-4 pt-3 shrink-0 flex justify-center gap-3"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))", borderTop: "1px solid var(--wc-line)" }}
      >
        {step === "make" && (
          <button type="button" className="wc-btn wc-primary" disabled={!canSend} onClick={onSendClick}>
            {recipient && memberId ? `Send to ${firstName(recipient.name) || "them"}` : "Send"}
          </button>
        )}
        {step === "recipient" && (
          <>
            <button type="button" className="wc-btn" onClick={() => setStep("make")}>Back</button>
            <button type="button" className="wc-btn wc-primary" disabled={!recipient} onClick={() => recipient && send(recipient)}>
              {recipient ? `Send to ${firstName(recipient.name) || "them"}` : "Pick someone"}
            </button>
          </>
        )}
        {step === "error" && (
          <>
            <button type="button" className="wc-btn" onClick={() => setStep("make")}>Back to my card</button>
            <button type="button" className="wc-btn wc-primary" onClick={() => recipient && send(recipient)} disabled={!recipient}>Try again</button>
          </>
        )}
        {step === "done" && (
          <button type="button" className="wc-btn wc-primary" onClick={onClose}>Done</button>
        )}
      </div>
    </div>,
    document.body
  );
}
