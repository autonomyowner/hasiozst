/**
 * Delivery provider abstraction layer.
 * Each provider implements createParcel, trackParcel, getFees, and validateCredentials.
 * All HTTP calls happen server-side inside Convex actions — API keys never reach the client.
 */

import { getProviderWilayaId, getWilayaFrenchName, splitName } from "./deliveryMappings";

// --- Types ---

export interface ProviderConfig {
  apiKey: string;
  apiId?: string;
}

export interface ParcelData {
  fullName: string;
  phone: string;
  address: string;
  wilayaCode: string;
  commune?: string;
  isStopDesk: boolean;
  weight?: number;
  orderTotal: number;
  productDescription?: string;
}

export interface CreateParcelResult {
  success: boolean;
  externalId: string;
  trackingNumber: string;
  deliveryFee?: number;
  labelUrl?: string;
  error?: string;
}

export interface TrackingEvent {
  status: string;
  date: string;
  location?: string;
}

export interface TrackingResult {
  success: boolean;
  providerStatus: string;
  history: TrackingEvent[];
  error?: string;
}

export interface FeeResult {
  success: boolean;
  fee: number;
  error?: string;
}

export type MappedOrderStatus = "processing" | "shipped" | "delivered";

interface DeliveryProvider {
  createParcel(config: ProviderConfig, data: ParcelData): Promise<CreateParcelResult>;
  trackParcel(config: ProviderConfig, externalId: string): Promise<TrackingResult>;
  getFees(config: ProviderConfig, fromWilayaCode: string, toWilayaCode: string, isStopDesk: boolean): Promise<FeeResult>;
  validateCredentials(config: ProviderConfig): Promise<boolean>;
  mapStatus(providerStatus: string): MappedOrderStatus | "failed";
}

// --- Yalidine ---

class YalidineProvider implements DeliveryProvider {
  private baseUrl = "https://api.yalidine.app/v1";

  private headers(config: ProviderConfig) {
    return {
      "X-API-ID": config.apiId ?? "",
      "X-API-TOKEN": config.apiKey,
      "Content-Type": "application/json",
    };
  }

  async createParcel(config: ProviderConfig, data: ParcelData): Promise<CreateParcelResult> {
    const { firstname, familyname } = splitName(data.fullName);
    const wilayaId = getProviderWilayaId(data.wilayaCode);
    const wilayaName = getWilayaFrenchName(data.wilayaCode);

    const body = {
      firstname,
      familyname,
      contact_phone: data.phone,
      address: data.address,
      to_commune_name: data.commune || wilayaName,
      to_wilaya_name: wilayaName,
      product_list: data.productDescription || "Commande",
      price: data.orderTotal,
      is_stopdesk: data.isStopDesk ? 1 : 0,
      has_exchange: 0,
      weight: data.weight || 1,
    };

    try {
      const response = await fetch(`${this.baseUrl}/parcels/`, {
        method: "POST",
        headers: this.headers(config),
        body: JSON.stringify([body]),
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, externalId: "", trackingNumber: "", error: `Yalidine API error: ${response.status} - ${text}` };
      }

      const result = await response.json();
      // Yalidine returns array of parcels
      const parcel = Array.isArray(result) ? result[0] : result;

      if (parcel?.has_error || parcel?.error) {
        return { success: false, externalId: "", trackingNumber: "", error: parcel.error_message || parcel.error || "Unknown Yalidine error" };
      }

      return {
        success: true,
        externalId: String(parcel.id || parcel.tracking),
        trackingNumber: parcel.tracking || parcel.id || "",
        deliveryFee: parcel.price_delivery,
        labelUrl: parcel.label_url,
      };
    } catch (err) {
      return { success: false, externalId: "", trackingNumber: "", error: `Network error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  async trackParcel(config: ProviderConfig, externalId: string): Promise<TrackingResult> {
    try {
      const response = await fetch(`${this.baseUrl}/parcels/${externalId}/histories`, {
        headers: this.headers(config),
      });

      if (!response.ok) {
        return { success: false, providerStatus: "", history: [], error: `Yalidine tracking error: ${response.status}` };
      }

      const result = await response.json();
      const histories = Array.isArray(result) ? result : result.data || [];

      const history: TrackingEvent[] = histories.map((h: { status?: string; date?: string; reason?: string }) => ({
        status: h.status || "",
        date: h.date || "",
        location: h.reason,
      }));

      const latestStatus = history.length > 0 ? history[history.length - 1].status : "Nouveau";

      return { success: true, providerStatus: latestStatus, history };
    } catch (err) {
      return { success: false, providerStatus: "", history: [], error: `Network error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  async getFees(config: ProviderConfig, fromWilayaCode: string, toWilayaCode: string, isStopDesk: boolean): Promise<FeeResult> {
    try {
      const fromId = getProviderWilayaId(fromWilayaCode);
      const toId = getProviderWilayaId(toWilayaCode);
      const response = await fetch(`${this.baseUrl}/deliveryfees/?from_wilaya_id=${fromId}&to_wilaya_id=${toId}`, {
        headers: this.headers(config),
      });

      if (!response.ok) {
        return { success: false, fee: 0, error: `Yalidine fees error: ${response.status}` };
      }

      const result = await response.json();
      const fees = Array.isArray(result) ? result[0] : result;
      const fee = isStopDesk ? (fees?.desk_fee ?? fees?.home_fee ?? 0) : (fees?.home_fee ?? 0);

      return { success: true, fee };
    } catch (err) {
      return { success: false, fee: 0, error: `Network error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  async validateCredentials(config: ProviderConfig): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/wilayas/`, {
        headers: this.headers(config),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  mapStatus(status: string): MappedOrderStatus | "failed" {
    const s = status.toLowerCase();
    if (["nouveau", "en attente", "planifié", "en préparation"].some(x => s.includes(x))) return "processing";
    if (["en cours", "au centre", "en transit", "transféré", "en livraison"].some(x => s.includes(x))) return "shipped";
    if (s.includes("livré")) return "delivered";
    if (["retourné", "échoué", "annulé", "refusé"].some(x => s.includes(x))) return "failed";
    return "processing";
  }
}

// --- Maystro ---

class MaystroProvider implements DeliveryProvider {
  private baseUrl = "https://backend.maystro-delivery.com/api";

  private headers(config: ProviderConfig) {
    return {
      Authorization: `Token ${config.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async createParcel(config: ProviderConfig, data: ParcelData): Promise<CreateParcelResult> {
    const wilayaId = getProviderWilayaId(data.wilayaCode);

    const body = {
      customer_name: data.fullName,
      customer_phone: data.phone,
      address: data.address,
      wilaya: wilayaId,
      commune: data.commune || "",
      product_price: data.orderTotal,
      delivery_type: data.isStopDesk ? "SD" : "HD",
      note: data.productDescription || "",
    };

    try {
      const response = await fetch(`${this.baseUrl}/stores/orders/`, {
        method: "POST",
        headers: this.headers(config),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, externalId: "", trackingNumber: "", error: `Maystro API error: ${response.status} - ${text}` };
      }

      const result = await response.json();
      return {
        success: true,
        externalId: String(result.id || ""),
        trackingNumber: result.tracking || result.code || String(result.id || ""),
        deliveryFee: result.delivery_price,
      };
    } catch (err) {
      return { success: false, externalId: "", trackingNumber: "", error: `Network error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  async trackParcel(config: ProviderConfig, externalId: string): Promise<TrackingResult> {
    try {
      const response = await fetch(`${this.baseUrl}/stores/orders/${externalId}/`, {
        headers: this.headers(config),
      });

      if (!response.ok) {
        return { success: false, providerStatus: "", history: [], error: `Maystro tracking error: ${response.status}` };
      }

      const result = await response.json();
      const status = result.status || result.state || "";

      const history: TrackingEvent[] = [];
      if (result.history && Array.isArray(result.history)) {
        for (const h of result.history) {
          history.push({
            status: h.status || h.state || "",
            date: h.date || h.created_at || "",
            location: h.note,
          });
        }
      }

      return { success: true, providerStatus: status, history };
    } catch (err) {
      return { success: false, providerStatus: "", history: [], error: `Network error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  async getFees(config: ProviderConfig, _fromWilayaCode: string, toWilayaCode: string, isStopDesk: boolean): Promise<FeeResult> {
    try {
      const wilayaId = getProviderWilayaId(toWilayaCode);
      const response = await fetch(`${this.baseUrl}/stores/tarifs/?wilaya=${wilayaId}`, {
        headers: this.headers(config),
      });

      if (!response.ok) {
        return { success: false, fee: 0, error: `Maystro fees error: ${response.status}` };
      }

      const result = await response.json();
      const tarif = Array.isArray(result) ? result[0] : result;
      const fee = isStopDesk ? (tarif?.stop_desk ?? tarif?.home_delivery ?? 0) : (tarif?.home_delivery ?? 0);

      return { success: true, fee };
    } catch (err) {
      return { success: false, fee: 0, error: `Network error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  async validateCredentials(config: ProviderConfig): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/stores/orders/?page_size=1`, {
        headers: this.headers(config),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  mapStatus(status: string): MappedOrderStatus | "failed" {
    const s = status.toLowerCase();
    if (["pending", "confirmed", "in_progress", "preparation"].some(x => s.includes(x))) return "processing";
    if (["in_delivery", "at_hub", "dispatched", "in_transit", "transfered"].some(x => s.includes(x))) return "shipped";
    if (s.includes("delivered") || s.includes("livré")) return "delivered";
    if (["returned", "failed", "cancelled", "refused"].some(x => s.includes(x))) return "failed";
    return "processing";
  }
}

// --- ZR Express ---

class ZRExpressProvider implements DeliveryProvider {
  private baseUrl = "https://api.zrexpress.com/api";

  private headers(config: ProviderConfig) {
    return {
      "X-API-ID": config.apiId ?? "",
      "X-API-TOKEN": config.apiKey,
      "Content-Type": "application/json",
    };
  }

  async createParcel(config: ProviderConfig, data: ParcelData): Promise<CreateParcelResult> {
    const { firstname, familyname } = splitName(data.fullName);
    const wilayaId = getProviderWilayaId(data.wilayaCode);

    const body = {
      firstname,
      familyname,
      contact_phone: data.phone,
      address: data.address,
      to_wilaya_id: wilayaId,
      to_commune: data.commune || "",
      price: data.orderTotal,
      is_stopdesk: data.isStopDesk ? 1 : 0,
      weight: data.weight || 1,
      product_list: data.productDescription || "Commande",
    };

    try {
      const response = await fetch(`${this.baseUrl}/parcels`, {
        method: "POST",
        headers: this.headers(config),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, externalId: "", trackingNumber: "", error: `ZR Express API error: ${response.status} - ${text}` };
      }

      const result = await response.json();
      const parcel = result.data || result;

      return {
        success: true,
        externalId: String(parcel.id || parcel.tracking || ""),
        trackingNumber: parcel.tracking || String(parcel.id || ""),
        deliveryFee: parcel.delivery_fee,
      };
    } catch (err) {
      return { success: false, externalId: "", trackingNumber: "", error: `Network error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  async trackParcel(config: ProviderConfig, externalId: string): Promise<TrackingResult> {
    try {
      const response = await fetch(`${this.baseUrl}/parcels/${externalId}/tracking`, {
        headers: this.headers(config),
      });

      if (!response.ok) {
        return { success: false, providerStatus: "", history: [], error: `ZR Express tracking error: ${response.status}` };
      }

      const result = await response.json();
      const data = result.data || result;
      const histories = data.history || data.events || [];

      const history: TrackingEvent[] = histories.map((h: { status?: string; date?: string; location?: string }) => ({
        status: h.status || "",
        date: h.date || "",
        location: h.location,
      }));

      const latestStatus = data.status || (history.length > 0 ? history[history.length - 1].status : "Nouveau");

      return { success: true, providerStatus: latestStatus, history };
    } catch (err) {
      return { success: false, providerStatus: "", history: [], error: `Network error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  async getFees(config: ProviderConfig, fromWilayaCode: string, toWilayaCode: string, isStopDesk: boolean): Promise<FeeResult> {
    try {
      const fromId = getProviderWilayaId(fromWilayaCode);
      const toId = getProviderWilayaId(toWilayaCode);
      const response = await fetch(`${this.baseUrl}/fees?from_wilaya=${fromId}&to_wilaya=${toId}`, {
        headers: this.headers(config),
      });

      if (!response.ok) {
        return { success: false, fee: 0, error: `ZR Express fees error: ${response.status}` };
      }

      const result = await response.json();
      const fees = result.data || result;
      const fee = isStopDesk ? (fees?.desk_fee ?? fees?.home_fee ?? 0) : (fees?.home_fee ?? 0);

      return { success: true, fee };
    } catch (err) {
      return { success: false, fee: 0, error: `Network error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  async validateCredentials(config: ProviderConfig): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/wilayas`, {
        headers: this.headers(config),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  mapStatus(status: string): MappedOrderStatus | "failed" {
    // ZR Express uses similar status strings to Yalidine (Procolis pattern)
    const s = status.toLowerCase();
    if (["nouveau", "en attente", "planifié", "en préparation"].some(x => s.includes(x))) return "processing";
    if (["en cours", "au centre", "en transit", "transféré", "en livraison"].some(x => s.includes(x))) return "shipped";
    if (s.includes("livré") || s.includes("delivered")) return "delivered";
    if (["retourné", "échoué", "annulé", "refusé", "returned", "failed"].some(x => s.includes(x))) return "failed";
    return "processing";
  }
}

// --- Factory ---

const providers: Record<string, DeliveryProvider> = {
  yalidine: new YalidineProvider(),
  maystro: new MaystroProvider(),
  zrexpress: new ZRExpressProvider(),
};

export function getProvider(name: string): DeliveryProvider {
  const provider = providers[name];
  if (!provider) throw new Error(`Unknown delivery provider: ${name}`);
  return provider;
}
