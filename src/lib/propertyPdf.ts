import type { FilterGroup, Listing, ThemeSettings } from "@/lib/inmoData";
import { propertyTypeLabels } from "@/lib/inmoData";
import { getAvailability } from "@/lib/availability";

type PropertyAttribute = {
  label: string;
  values: string[];
};

type PropertyPdfInput = {
  property: Listing;
  attributes: PropertyAttribute[];
  images: string[];
  theme: ThemeSettings;
  propertyUrl: string;
};

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const mmToPx = (mm: number) => Math.round(mm * 6);

const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(
    clean.length === 3
      ? clean
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : clean,
    16
  );
  if (Number.isNaN(value)) return { r: 27, g: 54, b: 93 };
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const formatPrice = (price: number, priceUnit: string) => {
  const base = currencyFormatter.format(price);
  if (priceUnit === "noche") return `${base} / noche`;
  if (priceUnit === "mensual") return `${base} / mes`;
  return base;
};

const sanitizeFileName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const fetchImageDataUrl = async (url: string) => {
  if (url.startsWith("data:image/")) return url;
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) throw new Error(`No se pudo cargar imagen ${url}`);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
};

const loadImage = async (src: string) =>
  await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo procesar una imagen"));
    image.src = src;
  });

const renderImage = async (
  dataUrl: string,
  widthMm: number,
  heightMm: number,
  mode: "cover" | "contain" = "cover"
) => {
  const image = await loadImage(dataUrl);
  const width = mmToPx(widthMm);
  const height = mmToPx(heightMm);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const scale =
    mode === "cover"
      ? Math.max(width / image.naturalWidth, height / image.naturalHeight)
      : Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const targetWidth = image.naturalWidth * scale;
  const targetHeight = image.naturalHeight * scale;
  const x = (width - targetWidth) / 2;
  const y = (height - targetHeight) / 2;
  ctx.drawImage(image, x, y, targetWidth, targetHeight);

  return canvas.toDataURL("image/jpeg", 0.92);
};

const addWrappedText = (
  doc: import("jspdf").jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) => {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
};

const drawPremiumHeader = (
  doc: import("jspdf").jsPDF,
  title: string,
  theme: ThemeSettings,
  pageWidth: number,
  primary: { r: number; g: number; b: number },
  neutral: { r: number; g: number; b: number },
  margin: number
) => {
  doc.setFillColor(252, 250, 245);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(primary.r, primary.g, primary.b);
  doc.text((theme.name || "Connexa").toUpperCase(), margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(title.toUpperCase(), pageWidth - margin, 14, { align: "right" });
  doc.setDrawColor(neutral.r, neutral.g, neutral.b);
  doc.setLineWidth(0.35);
  doc.line(margin, 24, pageWidth - margin, 24);
};

const drawAvailabilityIndicator = (
  doc: import("jspdf").jsPDF,
  text: string,
  x: number,
  y: number,
  color: { r: number; g: number; b: number }
) => {
  doc.setFillColor(color.r, color.g, color.b);
  doc.circle(x + 2, y + 2, 1.6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(color.r, color.g, color.b);
  doc.text(text.toUpperCase(), x + 6, y + 4.2);
};

const drawInfoCard = (
  doc: import("jspdf").jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  primary: { r: number; g: number; b: number }
) => {
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(229, 221, 204);
  doc.roundedRect(x, y, width, 22, 4, 4, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(115, 112, 105);
  doc.text(label.toUpperCase(), x + 5, y + 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.2);
  doc.setTextColor(primary.r, primary.g, primary.b);
  doc.text(value, x + 5, y + 16, { maxWidth: width - 10 });
};

const drawTextLink = (
  doc: import("jspdf").jsPDF,
  label: string,
  x: number,
  y: number,
  primary: { r: number; g: number; b: number },
  propertyUrl: string
) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(primary.r, primary.g, primary.b);
  doc.text(label, x, y);
  doc.setDrawColor(primary.r, primary.g, primary.b);
  doc.line(x, y + 1.5, x + doc.getTextWidth(label), y + 1.5);
  doc.link(x, y - 5, doc.getTextWidth(label), 8, { url: propertyUrl });
};

const loadPdfImages = async (images: string[]) => {
  const loaded = await Promise.allSettled(
    images.map(async (image) => await fetchImageDataUrl(image))
  );
  return loaded.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : []
  );
};

export const generatePropertyPdf = async ({
  property,
  attributes,
  images,
  theme,
  propertyUrl,
}: PropertyPdfInput) => {
  const pdfModule = (await import("jspdf/dist/jspdf.es.min.js")) as unknown as {
    jsPDF?: typeof import("jspdf").jsPDF;
    default?: typeof import("jspdf").jsPDF;
  };
  const jsPDF = pdfModule.jsPDF ?? pdfModule.default;
  if (!jsPDF) throw new Error("No se pudo cargar el generador PDF.");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const primary = hexToRgb(theme.primary || "#1b365d");
  const neutral = hexToRgb(theme.neutral || "#e6c88f");
  const availability = getAvailability(property.status);
  const pdfImages = await loadPdfImages(images);
  const coverImage = pdfImages[0]
    ? await renderImage(pdfImages[0], pageWidth - margin * 2, 124, "cover")
    : "";

  const price = formatPrice(property.price, property.priceUnit);

  doc.setFillColor(252, 250, 245);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  drawPremiumHeader(doc, "Ficha privada", theme, pageWidth, primary, neutral, margin);
  drawAvailabilityIndicator(
    doc,
    availability.label,
    pageWidth - margin - 35,
    36,
    availability.rgb
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(neutral.r, neutral.g, neutral.b);
  doc.text(propertyTypeLabels[property.type].toUpperCase(), margin, 38);
  doc.setFontSize(25);
  doc.setTextColor(primary.r, primary.g, primary.b);
  doc.text(doc.splitTextToSize(property.title, 122), margin, 51);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(94, 90, 82);
  doc.text(property.neighborhood, margin, 71);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(primary.r, primary.g, primary.b);
  doc.text(price, pageWidth - margin, 61, { align: "right" });

  if (coverImage) {
    doc.addImage(coverImage, "JPEG", margin, 84, pageWidth - margin * 2, 124);
    doc.setDrawColor(230, 200, 143);
    doc.setLineWidth(0.45);
    doc.rect(margin, 84, pageWidth - margin * 2, 124, "S");
  } else {
    doc.setFillColor(243, 239, 230);
    doc.rect(margin, 84, pageWidth - margin * 2, 124, "F");
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(12);
    doc.text("Imagen no disponible", pageWidth / 2, 148, { align: "center" });
  }

  const specY = 220;
  drawInfoCard(
    doc,
    "Operacion",
    property.priceUnit === "venta"
      ? "Venta"
      : property.priceUnit === "mensual"
        ? "Alquiler"
        : "Temporario",
    margin,
    specY,
    42,
    primary
  );
  drawInfoCard(doc, "Ambientes", String(property.rooms), margin + 46, specY, 42, primary);
  drawInfoCard(doc, "Superficie", `${property.area} m2`, margin + 92, specY, 42, primary);
  drawInfoCard(
    doc,
    "Estado",
    availability.label,
    margin + 138,
    specY,
    40,
    primary
  );

  doc.setDrawColor(226, 220, 206);
  doc.line(margin, 259, pageWidth - margin, 259);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(105, 101, 93);
  doc.text("Mas fotos, consultas y estado actualizado disponibles en la ficha web.", margin, 269);
  drawTextLink(doc, "Abrir ficha web", pageWidth - margin - 50, 269, primary, propertyUrl);

  doc.addPage();
  doc.setFillColor(252, 250, 245);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  drawPremiumHeader(doc, "Detalle comercial", theme, pageWidth, primary, neutral, margin);

  let y = 38;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(primary.r, primary.g, primary.b);
  doc.text("Sobre esta propiedad", margin, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(74, 70, 63);
  y = addWrappedText(
    doc,
    property.description || "Descripcion pendiente.",
    margin,
    y,
    108,
    5.5
  );
  if (property.highlight) {
    y += 8;
    doc.setDrawColor(neutral.r, neutral.g, neutral.b);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 108, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.text("DESTACADO", margin, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(74, 70, 63);
    doc.text(doc.splitTextToSize(property.highlight, 108), margin, y + 16);
  }

  const sideX = 138;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(sideX, 38, pageWidth - sideX - margin, 86, 4, 4, "F");
  doc.setDrawColor(230, 200, 143);
  doc.roundedRect(sideX, 38, pageWidth - sideX - margin, 86, 4, 4, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(primary.r, primary.g, primary.b);
  doc.text("Ficha tecnica", sideX + 7, 49);

  const details = [
    ["Precio", price],
    ["Operacion", property.priceUnit === "venta" ? "Venta" : property.priceUnit === "mensual" ? "Alquiler mensual" : "Alquiler temporario"],
    ["Barrio", property.neighborhood],
    ["Tipo", propertyTypeLabels[property.type]],
    ["Ambientes", String(property.rooms)],
    ["Superficie", `${property.area} m2`],
    ["Disponibilidad", availability.label],
  ];
  details.forEach(([label, value], index) => {
    const rowY = 61 + index * 9;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(115, 112, 105);
    doc.text(label.toUpperCase(), sideX + 7, rowY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.text(value, pageWidth - margin - 7, rowY, { align: "right", maxWidth: 42 });
  });

  const attributeValues = attributes.flatMap((group) =>
    group.values.map((value) => ({
      group: group.label,
      value,
    }))
  );
  if (attributeValues.length) {
    let chipY = 145;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.text("Amenities y atributos", margin, chipY);
    chipY += 11;
    attributeValues.forEach((item) => {
      if (chipY > 220) return;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 220, 206);
      doc.roundedRect(margin, chipY - 6, 112, 12, 4, 4, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.2);
      doc.setTextColor(115, 112, 105);
      doc.text(item.group.toUpperCase(), margin + 5, chipY - 1.7);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(74, 70, 63);
      doc.text(item.value, margin + 5, chipY + 3.2, { maxWidth: 100 });
      chipY += 14;
    });
  }

  doc.setDrawColor(226, 220, 206);
  doc.line(margin, 238, pageWidth - margin, 238);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(primary.r, primary.g, primary.b);
  doc.text("Siguiente paso", margin, 250);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(74, 70, 63);
  doc.text(
    "Para coordinar una visita o hacer una consulta, abrí la ficha web y enviá el formulario desde la propiedad.",
    margin,
    259,
    { maxWidth: pageWidth - margin * 2 - 55 }
  );
  drawTextLink(doc, "Abrir ficha web", pageWidth - margin - 48, 259, primary, propertyUrl);

  if (pdfImages.length) {
    const imageSlots = [
      { x: margin, y: 42, w: 82, h: 70 },
      { x: margin + 96, y: 42, w: 82, h: 70 },
      { x: margin, y: 124, w: 82, h: 70 },
      { x: margin + 96, y: 124, w: 82, h: 70 },
      { x: margin, y: 206, w: 82, h: 54 },
      { x: margin + 96, y: 206, w: 82, h: 54 },
    ];

    for (let index = 0; index < pdfImages.length; index += imageSlots.length) {
      doc.addPage();
      doc.setFillColor(252, 250, 245);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      drawPremiumHeader(doc, "Galeria", theme, pageWidth, primary, neutral, margin);
      doc.setTextColor(primary.r, primary.g, primary.b);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Galeria de imagenes", margin, 34);

      const pageImages = pdfImages.slice(index, index + imageSlots.length);
      for (let slotIndex = 0; slotIndex < pageImages.length; slotIndex += 1) {
        const slot = imageSlots[slotIndex];
        const rendered = await renderImage(pageImages[slotIndex], slot.w, slot.h, "cover");
        doc.addImage(rendered, "JPEG", slot.x, slot.y, slot.w, slot.h);
        doc.setDrawColor(226, 220, 206);
        doc.rect(slot.x, slot.y, slot.w, slot.h, "S");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(115, 112, 105);
        doc.text(`Imagen ${index + slotIndex + 1}`, slot.x, slot.y + slot.h + 5);
      }
    }
  }

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`${theme.name || "Connexa"} - ${property.neighborhood}`, margin, pageHeight - 9);
    doc.link(margin, pageHeight - 13, pageWidth - margin * 2, 7, { url: propertyUrl });
    doc.text(`${page}/${totalPages}`, pageWidth - margin, pageHeight - 9, {
      align: "right",
    });
  }

  doc.save(`ficha-${sanitizeFileName(property.title || property.id)}.pdf`);
};

export const resolvePropertyAttributes = (
  groups: FilterGroup[],
  values: Record<string, string[]>
) =>
  groups
    .map((group) => ({
      label: group.label,
      values: values[group.id] ?? [],
    }))
    .filter((group) => group.values.length > 0);
