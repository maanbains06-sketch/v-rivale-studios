import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TebexPackage {
  id: number;
  name: string;
  description: string;
  image: string | null;
  base_price: number;
  sales_price: number;
  category: {
    id: number;
    name: string;
  };
  type: string;
}

interface TebexCategory {
  id: number;
  name: string;
  description?: string;
  packages?: TebexPackage[];
}

function looksLikeHeadlessToken(token: string) {
  // Docs: token example like `t66x-7cd928b1e...`
  return /^[a-z0-9]{3,6}-[a-f0-9]{16,}$/i.test(token);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("TEBEX_STORE_IDENTIFIER")?.trim();

    if (!token) {
      return new Response(
        JSON.stringify({
          error: "Tebex store identifier not configured",
          hint:
            "Set TEBEX_STORE_IDENTIFIER to your Tebex Headless API webstore identifier/token (looks like t66x-...).",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!looksLikeHeadlessToken(token)) {
      return new Response(
        JSON.stringify({
          error: "Invalid Tebex store identifier format",
          hint:
            "TEBEX_STORE_IDENTIFIER must be the Headless API webstore identifier/token (it is NOT your store URL/slug). It looks like t66x-...",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("Fetching Tebex Headless listings for token:", token.slice(0, 8) + "...");

    const storeInfoResponse = await fetch(`https://headless.tebex.io/api/accounts/${token}`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!storeInfoResponse.ok) {
      const errorText = await storeInfoResponse.text();
      console.error("Failed to fetch store info:", storeInfoResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch store information",
          details: errorText,
          hint:
            storeInfoResponse.status === 404
              ? "This usually means your TEBEX_STORE_IDENTIFIER is not a valid Headless API token. Copy it from your Tebex Headless API settings."
              : undefined,
        }),
        {
          status: storeInfoResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const storeInfoData = await storeInfoResponse.json();
    const storeInfo = storeInfoData.data;

    const categoriesResponse = await fetch(
      `https://headless.tebex.io/api/accounts/${token}/categories?includePackages=1`,
      { headers: { "Content-Type": "application/json" } },
    );

    if (!categoriesResponse.ok) {
      const errorText = await categoriesResponse.text();
      console.error("Failed to fetch categories:", categoriesResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch store categories", details: errorText }),
        {
          status: categoriesResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const categoriesData = await categoriesResponse.json();
    const categories: TebexCategory[] = categoriesData.data || [];

    const packages: Array<{
      id: number;
      name: string;
      description: string;
      image: string | null;
      price: number;
      category: { id: number; name: string };
    }> = [];

    categories.forEach((cat) => {
      (cat.packages || []).forEach((pkg) => {
        packages.push({
          id: pkg.id,
          name: pkg.name,
          description: pkg.description || "",
          image: pkg.image,
          price: pkg.sales_price || pkg.base_price,
          category: { id: cat.id, name: cat.name },
        });
      });
    });

    return new Response(
      JSON.stringify({
        success: true,
        store: {
          name: storeInfo?.name || "Store",
          domain: storeInfo?.domain || "",
          currency: storeInfo?.currency || { iso_4217: "INR", symbol: "₹" },
          gameType: storeInfo?.game_type || "FiveM",
        },
        categories: categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          packages: cat.packages || [],
        })),
        packages,
        totalPackages: packages.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error fetching Tebex store:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch store data", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
