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
  price: number;
  currency: string;
  category: {
    id: number;
    name: string;
  };
  type: string;
  sales: number;
}

interface TebexCategory {
  id: number;
  name: string;
  packages: TebexPackage[];
}

interface TebexStoreInfo {
  account: {
    id: number;
    name: string;
    domain: string;
    currency: {
      iso_4217: string;
      symbol: string;
    };
    online_mode: boolean;
    game_type: string;
    log_events: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const secretKey = Deno.env.get("TEBEX_SECRET_KEY");
    
    if (!secretKey) {
      console.error("TEBEX_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Tebex API key not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const headers = {
      "X-Tebex-Secret": secretKey,
      "Content-Type": "application/json",
    };

    // Fetch store information
    const storeInfoResponse = await fetch("https://plugin.tebex.io/information", {
      headers,
    });

    if (!storeInfoResponse.ok) {
      const errorText = await storeInfoResponse.text();
      console.error("Failed to fetch store info:", storeInfoResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch store information", details: errorText }),
        { 
          status: storeInfoResponse.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const storeInfo: TebexStoreInfo = await storeInfoResponse.json();
    console.log("Store info fetched successfully:", storeInfo.account.name);

    // Fetch categories with packages
    const listingResponse = await fetch("https://plugin.tebex.io/listing", {
      headers,
    });

    if (!listingResponse.ok) {
      const errorText = await listingResponse.text();
      console.error("Failed to fetch listing:", listingResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch store listing", details: errorText }),
        { 
          status: listingResponse.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const listingData = await listingResponse.json();
    const categories: TebexCategory[] = listingData.categories || [];
    console.log(`Fetched ${categories.length} categories`);

    // Get featured/all packages
    const allPackages: TebexPackage[] = [];
    categories.forEach((category) => {
      if (category.packages) {
        category.packages.forEach((pkg) => {
          allPackages.push({
            ...pkg,
            category: {
              id: category.id,
              name: category.name,
            },
          });
        });
      }
    });

    console.log(`Total packages: ${allPackages.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        store: {
          name: storeInfo.account.name,
          domain: storeInfo.account.domain,
          currency: storeInfo.account.currency,
          gameType: storeInfo.account.game_type,
        },
        categories,
        packages: allPackages,
        totalPackages: allPackages.length,
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error fetching Tebex store:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch store data", details: String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
