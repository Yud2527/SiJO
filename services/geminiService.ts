
import { GoogleGenAI, Type } from "@google/genai";
import { COAItem, TransactionItem, JournalEntry } from "../types";

/**
 * GENERATIVE AI CORE ENGINE (Gemini 3 Flash)
 */
export const generateJournalsWithAI = async (
  coa: COAItem[],
  transactions: TransactionItem[]
): Promise<JournalEntry[]> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
    throw new Error("API_KEY tidak ditemukan atau tidak valid. Silakan atur Environment Variable 'API_KEY' di Vercel dan lakukan REDEPLOY.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  const prompt = `
    Anda adalah asisten akuntan profesional bersertifikat PSAK.
    Tugas: Ubah data mutasi bank berikut menjadi entri jurnal akuntansi yang akurat.

    DAFTAR AKUN (COA) YANG TERSEDIA:
    ${JSON.stringify(coa.map(c => ({ code: c.code, name: c.name, cat: c.category })))}

    DATA TRANSAKSI MUTASI:
    ${JSON.stringify(transactions)}

    ATURAN PENJURNALAN:
    1. Jika Tipe 'CR' (Uang Masuk): Debit akun Bank (Aset), Kredit akun pendapatan/piutang/lainnya.
    2. Jika Tipe 'DB' (Uang Keluar): Kredit akun Bank (Aset), Debit akun beban/utang/aset lainnya.
    3. Pilih akun yang paling spesifik dari daftar COA yang diberikan.
    4. Buat narasi (narration) yang sangat profesional (misal: "Penerimaan piutang dari...", "Pembayaran beban listrik...").
    5. Harus mengembalikan valid JSON ARRAY.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              date: { type: Type.STRING },
              description: { type: Type.STRING },
              narration: { type: Type.STRING },
              lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    accountCode: { type: Type.STRING },
                    accountName: { type: Type.STRING },
                    debit: { type: Type.NUMBER },
                    credit: { type: Type.NUMBER }
                  },
                  required: ["accountCode", "accountName", "debit", "credit"]
                }
              },
              isValid: { type: Type.BOOLEAN }
            },
            required: ["id", "date", "description", "narration", "lines", "isValid"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI tidak mengembalikan hasil. Silakan coba lagi.");
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("AI Processing Error:", error);
    
    // Handling specific API Errors
    if (error.message?.includes("403") || error.message?.includes("API_KEY_INVALID")) {
      throw new Error("API Key yang Anda gunakan tidak valid. Periksa kembali di Google AI Studio.");
    }
    
    if (error.message?.includes("429")) {
      throw new Error("Terlalu banyak permintaan (Rate limit). Tunggu sebentar dan coba lagi.");
    }

    throw new Error(error.message || "Terjadi kesalahan saat menghubungi server AI.");
  }
};
