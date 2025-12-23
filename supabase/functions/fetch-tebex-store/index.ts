import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TebexPackage {
  id: number;
  name: string;
  price: string;
  image: string | boolean;
  sale: {
    active: boolean;
    discount: string;
  };
}

interface TebexCategory {
  id: number;
  name: string;
  packages: TebexPackage[];
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
        JSON.stringify({ error: "Tebex secret key not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Fetching Tebex store listing with Plugin API");

    // Use the Plugin API to get listings
    const listingResponse = await fetch("https://plugin.tebex.io/listing", {
      headers: {
        "X-Tebex-Secret": secretKey,
        "Content-Type": "application/json",
      },
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

    // Get all packages from categories
    const allPackages: any[] = [];
    categories.forEach((category) => {
      if (category.packages) {
        category.packages.forEach((pkg) => {
          allPackages.push({
            id: pkg.id,
            name: pkg.name,
            description: '',
            image: typeof pkg.image === 'string' ? pkg.image : null,
            price: parseFloat(pkg.price) || 0,
            salePrice: pkg.sale?.active ? parseFloat(pkg.price) - parseFloat(pkg.sale.discount) : null,
            category: {
              id: category.id,
              name: category.name,
            },
          });
        });
      }
    });

    console.log(`Total packages: ${allPackages.length}`);

    // Fetch store info
    const infoResponse = await fetch("https://plugin.tebex.io/information", {
      headers: {
        "X-Tebex-Secret": secretKey,
        "Content-Type": "application/json",
      },
    });

    let storeInfo = { name: 'Store', domain: '', currency: { iso_4217: 'INR', symbol: '₹' } };
    if (infoResponse.ok) {
      const infoData = await infoResponse.json();
      storeInfo = {
        name: infoData.account?.name || 'Store',
        domain: infoData.account?.domain || '',
        currency: infoData.account?.currency || { iso_4217: 'INR', symbol: '₹' },
      };
      console.log("Store info fetched:", storeInfo.name);
    }

    return new Response(
      JSON.stringify({
        success: true,
        store: {
          name: storeInfo.name,
          domain: storeInfo.domain,
          currency: storeInfo.currency,
          gameType: 'FiveM',
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
