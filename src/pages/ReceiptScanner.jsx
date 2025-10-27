// my-app/src/pages/ReceiptScanner.jsx
import { useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { uploadReceiptImage, parseReceiptText, createReceipt, listReceipts } from "../api/receipts";

export default function ReceiptScanner() {
  const [mode, setMode] = useState("upload"); // 'upload' | 'camera'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [recognizing, setRecognizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (mode !== "camera") return;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e) {
        setError("No se pudo acceder a la camara");
      }
    })();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [mode]);

  useEffect(() => {
    (async () => {
      try {
        const r = await listReceipts();
        setRecent(r);
      } catch {}
    })();
  }, []);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });
      setImageFile(file);
      setImagePreview(URL.createObjectURL(blob));
    }, "image/jpeg", 0.95);
  };

  const runOCR = async () => {
    if (!imageFile) return;
    setRecognizing(true);
    setProgress(0);
    setError(null);
    try {
      const result = await Tesseract.recognize(imageFile, "spa+eng", {
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress != null) setProgress(m.progress);
        },
      });
      const t = result.data?.text || "";
      setText(t);
      const p = await parseReceiptText(t);
      setParsed(p);
    } catch (e) {
      console.error(e);
      setError("Error en OCR o parseo");
    } finally {
      setRecognizing(false);
    }
  };

  const saveReceipt = async () => {
    if (!text && !imageFile) return;
    setSaving(true);
    setError(null);
    try {
      let imageUrl;
      if (imageFile) {
        const { imageUrl: url } = await uploadReceiptImage(imageFile);
        imageUrl = url;
      }
      const doc = await createReceipt({ text: text || "", parsed, imageUrl });
      setSaved(doc);
      const r = await listReceipts();
      setRecent(r);
    } catch (e) {
      console.error(e);
      setError("No se pudo guardar la boleta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Escanear Boleta</h1>

      {/* input oculto para abrir el explorador desde el boton */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-2 rounded ${mode === "upload" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => {
            setMode("upload");
            fileInputRef.current?.click();
          }}
        >
          Subir archivo
        </button>
        <button
          className={`px-3 py-2 rounded ${mode === "camera" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setMode("camera")}
        >
          Usar camara
        </button>
      </div>

      {mode === "upload" && (
        <div className="mb-4">
          <input type="file" accept="image/*" onChange={onFileChange} />
        </div>
      )}

      {mode === "camera" && (
        <div className="mb-4">
          <video ref={videoRef} className="w-full rounded border" />
          <div className="flex gap-2 mt-2">
            <button className="px-3 py-2 bg-gray-200 rounded" onClick={takePhoto}>Tomar foto</button>
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
        <button
          className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          onClick={runOCR}
          disabled={!imageFile || recognizing}
        >
          {recognizing ? `Reconociendo ${Math.round(progress * 100)}%` : "Extraer texto (OCR)"}
        </button>
        <button
          className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          onClick={saveReceipt}
          disabled={(!text && !imageFile) || saving}
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {error && <div className="text-red-600 mb-2">{error}</div>}

      {text && (
        <div className="mb-4">
          <h2 className="font-medium mb-2">Texto extraido</h2>
          <pre className="p-3 bg-gray-50 border rounded whitespace-pre-wrap text-sm">{text}</pre>
        </div>
      )}

      {parsed && (
        <div className="mb-4">
          <h2 className="font-medium mb-2">Campos detectados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div><span className="font-semibold">Origen:</span> {parsed.origen || "-"}</div>
            <div><span className="font-semibold">Destino:</span> {parsed.destino || "-"}</div>
            <div><span className="font-semibold">Precio:</span> {parsed.precio ?? "-"}</div>
            <div><span className="font-semibold">Fecha:</span> {parsed.fecha ? new Date(parsed.fecha).toLocaleDateString() : (parsed.fechaHora ? new Date(parsed.fechaHora).toLocaleDateString() : "-")}</div>
            <div><span className="font-semibold">Hora:</span> {parsed.hora || (parsed.fechaHora ? new Date(parsed.fechaHora).toLocaleTimeString() : "-")}</div>
            <div><span className="font-semibold">Pasajeros:</span> {parsed.cantidadPasajeros ?? "-"}</div>
          </div>
        </div>
      )}

      {saved && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded">
          Guardado OK: {saved._id}
        </div>
      )}

      <div>
        <h2 className="font-medium mb-2">Ultimas boletas</h2>
        <ul className="text-sm list-disc pl-5">
          {recent.map((r) => (
            <li key={r._id}>
              {new Date(r.createdAt).toLocaleString()} - {r.origen || "-"} -> {r.destino || "-"} - {r.precio ?? "-"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
