/**
 * Shipment number helpers.
 *
 * Some environments still generate legacy SHP-###### numbers even for outbound shipments.
 * The desired format for new outbound shipments is OUT-#####.
 */

/**
 * If a shipment_number is a legacy SHP numeric code, return an OUT-##### version.
 * Otherwise returns null (no change required).
 */
export function coerceOutboundShipmentNumber(
  shipmentNumber: string | null | undefined
): string | null {
  const raw = String(shipmentNumber || '').trim().toUpperCase();
  const match = raw.match(/^SHP-(\d{5,6})$/);
  if (!match) return null;

  const digits = match[1];
  // Desired format: OUT-##### (5 digits). If legacy is 6 digits, keep the last 5.
  return `OUT-${digits.slice(-5)}`;
}

