export const PATALINK_CONFIG = {
  apiKey: process.env.REACT_APP_PATALINK_API_KEY || "",
  encryptionKey: process.env.REACT_APP_PATALINK_ENCRYPTION_KEY || "",
  baseUrl: "https://aviator-crash-rose.vercel.app/api",
  callbackUrl: "https://aviator-crash-rose.vercel.app/payment/callback",
  patalinkApi: "https://api.patalink.me",
};

export const DEPOSIT_AMOUNTS = [100, 500, 1000, 2000, 5000, 10000, 25000, 50000];

export async function pollPaymentStatus(
  transactionId: string,
  _apiKey: string,
  onStatus: (status: string, data?: any) => void
): Promise<() => void> {
  let active = true;
  const interval = setInterval(async () => {
    if (!active) return;
    try {
      const res = await fetch(`${PATALINK_CONFIG.baseUrl}/poll?transactionId=${transactionId}`);
      const data = await res.json();
      if (data.status === "success" || data.status === "failed") {
        clearInterval(interval);
        onStatus(data.status, data);
      }
    } catch (err) {
      console.error("Payment poll error:", err);
    }
  }, 3000);

  return () => {
    active = false;
    clearInterval(interval);
  };
}
