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
  description: string;
  packages: TebexPackage[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the public store identifier (from your Tebex webstore URL or Headless API settings)
    const storeIdentifier = Deno.env.get("TEBEX_STORE_IDENTIFIER");
    
    if (!storeIdentifier) {
      console.error("TEBEX_STORE_IDENTIFIER not configured");
      return new Response(
        JSON.stringify({ error: "Tebex store identifier not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Fetching Tebex store with identifier:", storeIdentifier);

    // Fetch store information using Headless API
    const storeInfoResponse = await fetch(`https://headless.tebex.io/api/accounts/${storeIdentifier}`, {
      headers: {
        "Content-Type": "application/json",
      },
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

    const storeInfoData = await storeInfoResponse.json();
    const storeInfo = storeInfoData.data;
    console.log("Store info fetched successfully:", storeInfo?.name);

    // Fetch categories with packages using Headless API
    const categoriesResponse = await fetch(`https://headless.tebex.io/api/accounts/${storeIdentifier}/categories?includePackages=1`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!categoriesResponse.ok) {
      const errorText = await categoriesResponse.text();
      console.error("Failed to fetch categories:", categoriesResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch store categories", details: errorText }),
        { 
          status: categoriesResponse.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const categoriesData = await categoriesResponse.json();
    const categories: TebexCategory[] = categoriesData.data || [];
    console.log(`Fetched ${categories.length} categories`);

    // Get all packages from categories
    const allPackages: any[] = [];
    categories.forEach((category) => {
      if (category.packages) {
        category.packages.forEach((pkg) => {
          allPackages.push({
            id: pkg.id,
            name: pkg.name,
            description: pkg.description || '',
            image: pkg.image,
            price: pkg.sales_price || pkg.base_price,
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
          name: storeInfo?.name || 'Store',
          domain: storeInfo?.domain || '',
          currency: storeInfo?.currency || { iso_4217: 'INR', symbol: '₹' },
          gameType: storeInfo?.game_type || 'FiveM',
        },
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          packages: cat.packages || [],
        })),
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
