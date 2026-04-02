import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { invoiceService } from "./invoiceService";
import { clientService } from "./clientService";
import { userService } from "./userService";
import { Invoice, Client, InvoiceItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const getInvoicesTool: FunctionDeclaration = {
  name: "getInvoices",
  description: "Get all invoices for the current user to answer questions about revenue, status, or specific invoices.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const getClientsTool: FunctionDeclaration = {
  name: "getClients",
  description: "Get all clients for the current user to answer questions about client details or identify clients by name.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const createInvoiceTool: FunctionDeclaration = {
  name: "createInvoice",
  description: "Create a new invoice for a client. Requires client name, items (description, quantity, unitPrice), and due date.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      clientName: { type: Type.STRING, description: "The name of the client to invoice." },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unitPrice: { type: Type.NUMBER }
          },
          required: ["description", "quantity", "unitPrice"]
        }
      },
      dueDate: { type: Type.STRING, description: "Due date in YYYY-MM-DD format." },
      notes: { type: Type.STRING, description: "Optional notes for the invoice." },
      paymentTerms: { type: Type.STRING, description: "Optional payment terms (e.g., 'Net 30', 'Due on Receipt')." }
    },
    required: ["clientName", "items", "dueDate"]
  },
};

export const geminiService = {
  async chat(userId: string, message: string, history: any[] = []) {
    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `You are InvoiceFlow AI, a helpful assistant for a SaaS invoicing app. 
        You can help users manage their invoices, clients, and business insights.
        Use the provided tools to fetch data or perform actions.
        When creating an invoice, if the client doesn't exist, ask the user to create the client first.
        Always be professional, concise, and helpful.`,
        tools: [{ functionDeclarations: [getInvoicesTool, getClientsTool, createInvoiceTool] }],
      },
    });

    const response = await model;
    const functionCalls = response.functionCalls;

    if (functionCalls) {
      const toolResults: any[] = [];
      
      for (const call of functionCalls) {
        if (call.name === "getInvoices") {
          const invoices = await invoiceService.getInvoicesOnce(userId);
          toolResults.push({ name: "getInvoices", response: { invoices } });
        } else if (call.name === "getClients") {
          const clients = await clientService.getClientsOnce(userId);
          toolResults.push({ name: "getClients", response: { clients } });
        } else if (call.name === "createInvoice") {
          const { clientName, items, dueDate, notes, paymentTerms } = call.args as any;
          
          const clients = await clientService.getClientsOnce(userId);
          const client = clients.find(c => c.name.toLowerCase().includes(clientName.toLowerCase()));
          
          if (!client) {
            toolResults.push({ name: "createInvoice", response: { error: `Client "${clientName}" not found. Please create the client first.` } });
          } else {
            const subtotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
            const invoiceData = {
              userId,
              clientId: client.id,
              invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
              status: "DRAFT" as const,
              issueDate: new Date().toISOString().split('T')[0],
              dueDate,
              subtotal,
              taxRate: 0,
              taxAmount: 0,
              discountPercent: 0,
              discountAmount: 0,
              totalAmount: subtotal,
              currency: "USD",
              notes: notes || "",
              paymentTerms: paymentTerms || "Net 30",
              items: items.map((item: any) => ({ ...item, amount: item.quantity * item.unitPrice }))
            };
            
            const id = await invoiceService.createInvoice(userId, invoiceData);
            toolResults.push({ name: "createInvoice", response: { success: true, invoiceId: id, invoiceNumber: invoiceData.invoiceNumber } });
          }
        }
      }

      // Send tool results back to Gemini
      const finalResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history,
          { role: "user", parts: [{ text: message }] },
          { role: "model", parts: response.candidates[0].content.parts },
          { role: "user", parts: toolResults.map(tr => ({ functionResponse: tr })) }
        ],
        config: {
          systemInstruction: `You are InvoiceFlow AI. You have just received data from tools. 
          Summarize the information for the user or confirm the action taken.`,
        }
      });

      return finalResponse.text;
    }

    return response.text;
  },

  async analyzeReceipt(base64Image: string, mimeType: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType
              }
            },
            {
              text: "Analyze this receipt or invoice image and extract the following information in JSON format: clientName, items (array of {description, quantity, unitPrice}), taxAmount, totalAmount, and paymentTerms (if mentioned, e.g., 'Net 30'). If any field is missing, use null or 0. Ensure the output is valid JSON."
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER }
                }
              }
            },
            taxAmount: { type: Type.NUMBER },
            totalAmount: { type: Type.NUMBER },
            paymentTerms: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text);
  },

  async parseVoiceCommand(text: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          text: `Parse the following voice command into a structured invoice JSON object: "${text}". 
          The JSON should include: clientName, items (array of {description, quantity, unitPrice}), dueDate (in YYYY-MM-DD format, relative to today if mentioned like 'in 30 days'), and paymentTerms (e.g., 'Net 30', 'Due on Receipt'). 
          Current date is ${new Date().toISOString().split('T')[0]}.
          If any information is missing, use null or sensible defaults.`
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER }
                }
              }
            },
            dueDate: { type: Type.STRING },
            paymentTerms: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text);
  }
};
