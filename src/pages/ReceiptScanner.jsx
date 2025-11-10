// my-app/src/pages/ReceiptScanner.jsx
import { useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";
import {
  uploadReceiptImage,
  parseReceiptText,
  createReceipt,
  // listReceipts  // ← eliminado
} from "../api/receipts";

// Flecha simple sin librerías (rota al abrir/cerrar)
const ChevronDown = ({ rotated }) => (
  <span
    className={`inline-block transition-transform ${rotated ? "rotate-180" : ""}`}
    aria-hidden="true"
  >
    ▼
  </span>
);

export default function ReceiptScanner() {
  const [mode, setMode] = useState("upload");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [recognizing, setRecognizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [metodoTransporte, setMetodoTransporte] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState(null);
  const [showText, setShowText] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (mode !== "camera") return;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setError("No se pudo acceder a la cámara");
      }
    })();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [mode]);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setText("");
    setParsed(null);
    setMetodoTransporte(null);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setImageFile(file);
        setImagePreview(URL.createObjectURL(blob));
        setText("");
        setParsed(null);
        setMetodoTransporte(null);
      },
      "image/jpeg",
      0.95
    );
  };

  const runOCR = async () => {
    if (!imageFile) return;
    setRecognizing(true);
    setProgress(0);
    setError(null);
    try {
      const result = await Tesseract.recognize(imageFile, "spa+eng", {
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress != null)
            setProgress(m.progress);
        },
      });
      const t = result.data?.text || "";
      setText(t);
      const p = await parseReceiptText(t);
      setParsed(p);
      setMetodoTransporte(p?.metodoTransporte || null);
    } catch (e) {
      console.error(e);
      setError("Error en OCR o parseo");
    } finally {
      setRecognizing(false);
    }
  };

  const saveReceipt = async () => {
    if ((!text && !imageFile) || !metodoTransporte) return;
    setSaving(true);
    setError(null);
    try {
      let imageUrl;
      if (imageFile) {
        const { imageUrl: url } = await uploadReceiptImage(imageFile);
        imageUrl = url;
      }
      const doc = await createReceipt({
        text: text || "",
        parsed: parsed ? { ...parsed, metodoTransporte } : { metodoTransporte },
        imageUrl,
        metodoTransporte,
      });
      setSaved(doc);
      // ya no actualizamos "recent" ni mostramos la lista
    } catch (e) {
      console.error(e);
      setError("No se pudo guardar la boleta");
    } finally {
      setSaving(false);
    }
  };

  const transportOptions = [
    { key: "uber", label: "Uber" },
    { key: "transvip", label: "Transvip" },
    { key: "cabify", label: "Cabify" },
    { key: "didi", label: "DiDi" },
    { key: "otro", label: "Otros" },
  ];

  const handleMetodoTransporte = (value) => {
    setMetodoTransporte(value);
    setParsed((prev) => (!prev ? { metodoTransporte: value } : { ...prev, metodoTransporte: value }));
  };

  // Estilo base: botones negros
  const blackBtn =
    "px-3 py-2 rounded border border-black bg-black text-white hover:bg-white hover:text-black transition-all disabled:bg-black disabled:text-white disabled:opacity-100 active:scale-95";

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Escanear Boleta</h1>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="flex gap-2 mb-4">
        <button
          className={`${blackBtn} ${mode === "upload" ? "opacity-100" : "opacity-90"}`}
          onClick={() => {
            setMode("upload");
            fileInputRef.current?.click();
          }}
        >
          Subir archivo
        </button>

        <button
          className={`${blackBtn} ${mode === "camera" ? "opacity-100" : "opacity-90"}`}
          onClick={() => setMode("camera")}
        >
          Usar cámara
        </button>
      </div>

      {mode === "camera" && (
        <div className="mb-4">
          <video ref={videoRef} className="w-full rounded border" />
          <div className="flex gap-2 mt-2">
            <button className={blackBtn} onClick={takePhoto}>
              Tomar foto
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {imagePreview && (
        <div className="mb-4">
          <img src={imagePreview} alt="preview" className="max-h-80 rounded border" />
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button className={blackBtn} onClick={runOCR} disabled={!imageFile || recognizing}>
          {recognizing ? `Reconociendo ${Math.round(progress * 100)}%` : "Extraer texto (OCR)"}
        </button>

        <button
          className={blackBtn}
          onClick={saveReceipt}
          disabled={(!text && !imageFile) || saving || !metodoTransporte}
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {error && <div className="text-red-600 mb-2">{error}</div>}

      {/* Bloque colapsable: Texto extraído */}
      {text && (
        <div className="mb-4 border rounded">
          <button
            type="button"
            onClick={() => setShowText((s) => !s)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50"
            aria-expanded={showText}
            aria-controls="texto-extraido"
          >
            <span className="font-medium">Texto extraído</span>
            <ChevronDown rotated={showText} />
          </button>

          {showText && (
            <pre
              id="texto-extraido"
              className="p-3 border-t rounded-b whitespace-pre-wrap text-sm"
            >
              {text}
            </pre>
          )}
        </div>
      )}

      {parsed && (
        <div className="mb-4">
          <h2 className="font-medium mb-2">Campos detectados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div><span className="font-semibold">Origen:</span> {parsed.origen || "-"}</div>
            <div><span className="font-semibold">Destino:</span> {parsed.destino || "-"}</div>
            <div><span className="font-semibold">Comuna:</span> {parsed.comuna || "-"}</div>
            <div><span className="font-semibold">Región:</span> {parsed.region || "-"}</div>
            <div><span className="font-semibold">Precio:</span> {parsed.precio ?? "-"}</div>
            <div><span className="font-semibold">Fecha:</span> {parsed.fecha ? new Date(parsed.fecha).toLocaleDateString() : (parsed.fechaHora ? new Date(parsed.fechaHora).toLocaleDateString() : "-")}</div>
            <div><span className="font-semibold">Hora:</span> {parsed.hora || (parsed.fechaHora ? new Date(parsed.fechaHora).toLocaleTimeString() : "-")}</div>
            <div><span className="font-semibold">Pasajeros:</span> {parsed.cantidadPasajeros ?? "-"}</div>
            <div><span className="font-semibold">Transporte detectado:</span> {parsed.metodoTransporte ? parsed.metodoTransporte.toUpperCase() : "No detectado"}</div>
          </div>
        </div>
      )}

      {(parsed || text) && (
        <div className="mb-4">
          <h2 className="font-medium mb-2">Selecciona el método de transporte</h2>
          <div className="flex flex-wrap gap-2">
            {transportOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleMetodoTransporte(opt.key)}
                className={`${blackBtn} ${metodoTransporte === opt.key ? "bg-white text-black border-black" : ""}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {saved && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded">
          Guardado OK: {saved._id}
        </div>
      )}

      {/* Se eliminó el bloque de "Últimas boletas" */}
    </div>
  );
}
