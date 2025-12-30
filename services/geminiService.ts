
import { GoogleGenAI, Type } from "@google/genai";
import { COAItem, TransactionItem, JournalEntry } from "../types";

/**
 * GENERATIVE AI CORE ENGINE (Gemini 3 Flash)
 * Menggunakan SDK @google/genai yang merupakan standar terbaru untuk model Gemini.
 */
export const generateJournalsWithAI = async (
  coa: COAItem[],
  transactions: TransactionItem[]
): Promise<JournalEntry[]> => {
  // Menginisialisasi client dengan API_KEY dari environment variable
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    3. Cari akun paling relevan dari COA di atas berdasarkan deskripsi.
    4. Buat narasi (narration) yang sangat profesional dan deskriptif.
    5. Return dalam format JSON ARRAY yang valid.
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
    if (!text) throw new Error("Respons AI kosong.");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Processing Error:", error);
    throw new Error("Gagal memproses data dengan AI. Pastikan API_KEY sudah dikonfigurasi di Vercel.");
  }
};
