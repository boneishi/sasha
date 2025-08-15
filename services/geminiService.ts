import { GoogleGenAI, Type } from "@google/genai";
import type { Client, Quote, QuoteItem, SystemSettings, Appointment, Staff, Address, ProductProfile, ProductRange } from '../types';
import { CURRENCY_SYMBOLS } from "../constants";

if (!process.env.API_KEY) {
  // This is a placeholder for environments where the key might not be set.
  // In a real build process, this should be handled properly.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const formatItems = (items: QuoteItem[], currency: SystemSettings['currency'], productRanges: ProductRange[]) => {
  const symbol = CURRENCY_SYMBOLS[currency];
  return items.map(item => {
    const rangeName = productRanges.find(r => r.id === item.productRangeId)?.name || 'Custom';
    const description = `${item.quantity} x ${rangeName}`;
    const dimensions = item.windowInstances.map(inst => `${inst.overallWidth}mm x ${inst.overallHeight}mm`).join(', ');
    return `- ${description}: ${dimensions} - ${symbol}${(item.price * item.quantity).toFixed(2)}`;
  }).join('\n');
};

const formatAddress = (address?: Address) => {
    if (!address) return 'N/A';
    return [address.line1, address.line2, address.townCity, address.county, address.postcode].filter(Boolean).join(', ');
}

export const generateFollowUpEmail = async (client: Client, quote: Quote, systemSettings: SystemSettings, currentUser: Staff, productRanges: ProductRange[]): Promise<{ subject: string; body: string; }> => {
  if (!process.env.API_KEY) {
      return Promise.reject("API key is not configured.");
  }
  
  const primaryContact = client.contacts.find(c => c.isPrimary);
  if (!primaryContact) {
      return Promise.reject("Client does not have a primary contact.");
  }
  const clientName = `${primaryContact.firstName} ${primaryContact.lastName}`;
  const greetingName = primaryContact.firstName;
    
  const total = quote.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const symbol = CURRENCY_SYMBOLS[systemSettings.currency];
  const companyName = systemSettings.companyName || 'Sash Style Pro';

  const prompt = `
    Generate a polite and professional follow-up email to a potential client about a quote we sent them.
    The output must be a valid JSON object.

    **Client Information:**
    - Contact Name: ${clientName}
    - Company Name: ${client.companyName || 'N/A'}

    **Quote Information:**
    - Quote Number: ${quote.quoteNumber}
    - Quote Date: ${quote.date}
    - Total Amount: ${symbol}${total.toFixed(2)}
    - Items:
    ${formatItems(quote.items, systemSettings.currency, productRanges)}

    **Instructions for the email:**
    1.  Create a concise and professional subject line. For example: "Following up on your ${companyName} Quote".
    2.  Start the email body with a friendly and personal greeting to ${greetingName}.
    3.  Mention the quote number (${quote.quoteNumber}) and the date it was sent.
    4.  Briefly remind them of the project (windows/doors).
    5.  Ask if they have had a chance to review the quote and if they have any questions.
    6.  Highlight our commitment to quality and service.
    7.  Encourage them to reply or call to discuss the project further.
    8.  Keep the tone helpful and not pushy.
    9.  Sign off from "${currentUser.name}".
    `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    subject: { type: Type.STRING, description: "The subject line of the email." },
                    body: { type: Type.STRING, description: "The full body of the email." }
                },
                required: ["subject", "body"]
            }
        }
    });
    // The response.text is a string, but we know it's JSON because of the responseMimeType
    const jsonResponse = JSON.parse(response.text);
    return jsonResponse;
  } catch (error) {
    console.error("Error generating email with Gemini API:", error);
    throw new Error("There was an error generating the email. Please check the console for details.");
  }
};

export const generateAppointmentConfirmationEmail = async (appointment: Appointment, client: Client, staff: Staff, systemSettings: SystemSettings): Promise<{ subject: string; body: string; }> => {
  if (!process.env.API_KEY) {
      return Promise.reject("API key is not configured.");
  }
  
  const primaryContact = client.contacts.find(c => c.isPrimary);
  if (!primaryContact) {
      return Promise.reject("Client does not have a primary contact.");
  }
  const clientName = `${primaryContact.firstName} ${primaryContact.lastName}`;
  const greetingName = primaryContact.firstName;
    
  const startTime = new Date(appointment.start).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' });
  const companyName = systemSettings.companyName || 'Sash Style Pro';

  const prompt = `
    Generate a polite and professional email to a client to confirm their upcoming appointment.
    The output must be a valid JSON object.

    **Client Information:**
    - Contact Name: ${clientName}
    - Company Name: ${client.companyName || 'N/A'}

    **Appointment Information:**
    - Title: ${appointment.title}
    - Date and Time: ${startTime}
    - With: ${staff.name}
    - From company: ${companyName}

    **Instructions for the email:**
    1.  Create a concise and professional subject line. For example: "Confirmation for your appointment with ${companyName}".
    2.  Start the email body with a friendly and personal greeting to ${greetingName}.
    3.  Confirm the appointment title and the full date and time.
    4.  Mention who the appointment is with.
    5.  Include a sentence asking them to contact us if they need to reschedule.
    6.  Keep the tone helpful and friendly.
    7.  Sign off from "The Team at ${companyName}".
    `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.6,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    subject: { type: Type.STRING, description: "The subject line of the email." },
                    body: { type: Type.STRING, description: "The full body of the email." }
                },
                required: ["subject", "body"]
            }
        }
    });
    const jsonResponse = JSON.parse(response.text);
    return jsonResponse;
  } catch (error) {
    console.error("Error generating appointment email with Gemini API:", error);
    throw new Error("There was an error generating the appointment email. Please check the console for details.");
  }
};


export const suggestSurveyAppointments = async (
    surveyor: Staff,
    existingAppointments: Appointment[],
    client: Client,
    systemSettings: SystemSettings
): Promise<{start: string; end: string; justification: string}[]> => {
    if (!process.env.API_KEY) {
        return Promise.reject("API key is not configured.");
    }
    
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const formattedAppointments = existingAppointments
        .filter(app => new Date(app.start) > today && new Date(app.start) < nextWeek)
        .map(app => {
            const clientForApp = app.clientId ? client : null; // In a real scenario, you'd fetch this
            const address = clientForApp?.installationAddress || clientForApp?.officeAddress;
            return `- From ${new Date(app.start).toLocaleString()} to ${new Date(app.end).toLocaleString()} at ${formatAddress(address)}`;
        }).join('\n');

    const prompt = `
    You are an intelligent scheduling assistant. Your task is to suggest three optimal appointment slots for a technical survey at a client's property.

    Current Date: ${today.toDateString()}

    Surveyor Information:
    - Name: ${surveyor.name}
    - Working Hours: 9:00 AM to 5:00 PM, ${systemSettings.workingWeek.join(', ')}.

    New Survey Details:
    - Client: ${client.companyName || client.contacts.find(c=>c.isPrimary)?.firstName}
    - Location: ${formatAddress(client.installationAddress || client.officeAddress)}
    - Estimated Duration: 2 hours

    Surveyor's Existing Appointments for the next 7 days:
    ${formattedAppointments || 'No appointments scheduled.'}

    Instructions:
    1. Analyze the surveyor's schedule, working hours, and the location of the new survey.
    2. Suggest three 2-hour slots within the next 7 working days.
    3. Prioritize slots that are geographically close to other appointments on the same day to minimize travel time (Assume locations in the same town/city are close).
    4. Provide a brief justification for each suggestion, explaining why it's an efficient choice (e.g., "morning slot before another local appointment", "avoids rush hour travel", "fills a gap in the schedule").
    5. The output must be a valid JSON object. Do not include any text outside the JSON structure.
    6. The 'start' and 'end' times must be full ISO 8601 date strings (e.g., "2024-08-01T10:00:00.000Z").
    `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.5,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                start: { type: Type.STRING, description: "The suggested start time in ISO 8601 format." },
                                end: { type: Type.STRING, description: "The suggested end time in ISO 8601 format." },
                                justification: { type: Type.STRING, description: "A brief reason for the suggestion." }
                            },
                            required: ["start", "end", "justification"]
                        }
                    }
                },
                required: ["suggestions"]
            }
        }
    });
    const jsonResponse = JSON.parse(response.text);
    return jsonResponse.suggestions;
  } catch (error) {
    console.error("Error suggesting appointments with Gemini API:", error);
    throw new Error("There was an error getting AI suggestions. Please try again.");
  }
};
