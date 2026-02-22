import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, ...params } = await req.json()
    const DAILY_EARN_CAP = 250

    // Helper: check daily earn cap
    const checkDailyCap = async (userId: string, amount: number): Promise<{ allowed: boolean; remaining: number }> => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('daily_earning_caps')
        .select('total_earned')
        .eq('user_id', userId)
        .eq('earn_date', today)
        .maybeSingle()

      const earned = data?.total_earned || 0
      const remaining = DAILY_EARN_CAP - earned
      return { allowed: remaining >= amount, remaining }
    }

    // Helper: award tokens with cap check
    const awardTokens = async (userId: string, amount: number, source: string, description: string, referenceId?: string) => {
      const { allowed, remaining } = await checkDailyCap(userId, amount)
      if (!allowed) {
        return { success: false, error: `Daily earning cap reached. Remaining: ${remaining} tokens` }
      }

      const actualAmount = Math.min(amount, remaining)

      // Update wallet
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('balance, lifetime_earned')
        .eq('user_id', userId)
        .maybeSingle()

      if (!wallet) {
        // Create wallet
        await supabase.from('user_wallets').insert({
          user_id: userId, balance: actualAmount, lifetime_earned: actualAmount
        })
      } else {
        await supabase.from('user_wallets').update({
          balance: wallet.balance + actualAmount,
          lifetime_earned: wallet.lifetime_earned + actualAmount,
          updated_at: new Date().toISOString()
        }).eq('user_id', userId)
      }

      // Record transaction
      await supabase.from('token_transactions').insert({
        user_id: userId,
        amount: actualAmount,
        transaction_type: 'earn',
        source,
        description,
        reference_id: referenceId || null
      })

      // Update daily cap
      const today = new Date().toISOString().split('T')[0]
      await supabase.from('daily_earning_caps').upsert({
        user_id: userId,
        earn_date: today,
        total_earned: (wallet ? await supabase.from('daily_earning_caps').select('total_earned').eq('user_id', userId).eq('earn_date', today).maybeSingle().then(r => r.data?.total_earned || 0) : 0) + actualAmount,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,earn_date' })

      // Check for active seasonal currency and award bonus
      const { data: activeSeasonal } = await supabase
        .from('seasonal_currencies')
        .select('*')
        .eq('is_active', true)

      if (activeSeasonal && activeSeasonal.length > 0) {
        for (const sc of activeSeasonal) {
          const seasonalAmount = Math.floor(actualAmount * sc.multiplier)
          await supabase.from('user_seasonal_balances').upsert({
            user_id: userId,
            currency_id: sc.id,
            balance: seasonalAmount,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,currency_id' })
          
          // Actually add to existing balance
          const { data: existing } = await supabase
            .from('user_seasonal_balances')
            .select('balance')
            .eq('user_id', userId)
            .eq('currency_id', sc.id)
            .maybeSingle()
          
          if (existing) {
            await supabase.from('user_seasonal_balances').update({
              balance: existing.balance + seasonalAmount
            }).eq('user_id', userId).eq('currency_id', sc.id)
          }
        }
      }

      return { success: true, amount: actualAmount, newBalance: (wallet?.balance || 0) + actualAmount }
    }

    switch (action) {
      case 'claim_daily': {
        const today = new Date().toISOString().split('T')[0]
        const { data: streak } = await supabase
          .from('daily_login_streaks')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (streak?.last_claim_date === today) {
          return new Response(JSON.stringify({ error: 'Already claimed today', alreadyClaimed: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Calculate streak
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        let newStreak = 1
        if (streak?.last_claim_date === yesterday) {
          newStreak = (streak.current_streak || 0) + 1
        }

        // Calculate reward
        let reward = 25 // base daily
        let description = 'Daily login bonus'

        // 7-day streak bonus
        if (newStreak > 0 && newStreak % 7 === 0) {
          reward += 100
          description = `Daily login + 7-day streak bonus (Day ${newStreak})`
        }

        // Monthly streak (30-day)
        const monthlyReset = streak?.monthly_reset_date
        const currentMonth = new Date().toISOString().slice(0, 7)
        let monthlyClaims = (monthlyReset?.startsWith(currentMonth) ? streak?.monthly_claims || 0 : 0) + 1

        if (monthlyClaims >= 28) {
          reward += 500
          description = `Daily login + Monthly streak reward!`
        }

        const result = await awardTokens(user.id, reward, 'daily_login', description)
        if (!result.success) {
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Update streak
        await supabase.from('daily_login_streaks').upsert({
          user_id: user.id,
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streak?.longest_streak || 0),
          last_claim_date: today,
          monthly_claims: monthlyClaims,
          monthly_reset_date: today,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

        return new Response(JSON.stringify({
          ...result,
          streak: newStreak,
          reward,
          monthlyClaims
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      case 'earn_mini_game': {
        const { gameType, score } = params

        // Anti-abuse: check cooldown (max 1 reward per game type per 60 seconds)
        const { data: recentGameTx } = await supabase.from('token_transactions')
          .select('created_at')
          .eq('user_id', user.id)
          .eq('source', 'mini_game')
          .order('created_at', { ascending: false })
          .limit(1)

        if (recentGameTx && recentGameTx.length > 0) {
          const lastReward = new Date(recentGameTx[0].created_at).getTime()
          if (Date.now() - lastReward < 60000) {
            return new Response(JSON.stringify({ error: 'Cooldown active. Wait before earning again.', cooldown: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
        }

        if (!score || score <= 0) {
          return new Response(JSON.stringify({ error: 'Invalid score' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Anti-abuse: check device fingerprint from request
        const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
        
        // Log IP for monitoring
        await supabase.from('login_ip_log').insert({
          user_id: user.id,
          ip_address: clientIP,
          user_agent: req.headers.get('user-agent') || 'unknown'
        }).then(() => {}).catch(() => {})

        const result = await awardTokens(user.id, 50, 'mini_game', `Mini game win: ${gameType}`)
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'earn_gallery': {
        // Can be called by admin when approving - use submissionUserId if provided
        const targetUserId = params.submissionUserId || user.id

        // Anti-abuse: check if already awarded for recent gallery
        const { data: recentGalleryTx } = await supabase.from('token_transactions')
          .select('created_at')
          .eq('user_id', targetUserId)
          .eq('source', 'gallery_approved')
          .order('created_at', { ascending: false })
          .limit(1)

        if (recentGalleryTx && recentGalleryTx.length > 0) {
          const lastReward = new Date(recentGalleryTx[0].created_at).getTime()
          if (Date.now() - lastReward < 300000) { // 5 min cooldown
            return new Response(JSON.stringify({ error: 'Gallery reward cooldown active' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
        }

        const result = await awardTokens(targetUserId, 20, 'gallery_approved', 'Gallery submission approved')
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'purchase_item': {
        const { itemId } = params
        const { data: item } = await supabase.from('shop_items').select('*').eq('id', itemId).maybeSingle()
        if (!item) {
          return new Response(JSON.stringify({ error: 'Item not found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        if (!item.is_active) {
          return new Response(JSON.stringify({ error: 'Item is not available' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Check if limited and sold out
        if (item.is_limited && item.max_quantity && item.sold_count >= item.max_quantity) {
          return new Response(JSON.stringify({ error: 'Item sold out' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Check if already owned
        const { data: owned } = await supabase.from('user_inventory')
          .select('id').eq('user_id', user.id).eq('item_id', itemId).maybeSingle()
        if (owned) {
          return new Response(JSON.stringify({ error: 'Already owned' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Check balance
        const { data: wallet } = await supabase.from('user_wallets')
          .select('balance, lifetime_spent').eq('user_id', user.id).maybeSingle()
        if (!wallet || wallet.balance < item.price) {
          return new Response(JSON.stringify({ error: 'Insufficient balance' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Deduct balance
        await supabase.from('user_wallets').update({
          balance: wallet.balance - item.price,
          lifetime_spent: wallet.lifetime_spent + item.price,
          updated_at: new Date().toISOString()
        }).eq('user_id', user.id)

        // Add to inventory
        await supabase.from('user_inventory').insert({
          user_id: user.id, item_id: itemId
        })

        // Update sold count
        await supabase.from('shop_items').update({
          sold_count: item.sold_count + 1
        }).eq('id', itemId)

        // Record transaction
        await supabase.from('token_transactions').insert({
          user_id: user.id,
          amount: -item.price,
          transaction_type: 'spend',
          source: 'purchase',
          description: `Purchased: ${item.name}`,
          reference_id: itemId
        })

        return new Response(JSON.stringify({
          success: true,
          newBalance: wallet.balance - item.price,
          item: item.name
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      case 'equip_item': {
        const { itemId, category } = params
        // Verify ownership
        const { data: owned } = await supabase.from('user_inventory')
          .select('id').eq('user_id', user.id).eq('item_id', itemId).maybeSingle()
        if (!owned) {
          return new Response(JSON.stringify({ error: 'Item not owned' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Unequip all items of same category
        const { data: sameCategory } = await supabase.from('shop_items')
          .select('id').eq('category', category)
        if (sameCategory) {
          const ids = sameCategory.map(s => s.id)
          await supabase.from('user_inventory')
            .update({ is_equipped: false })
            .eq('user_id', user.id)
            .in('item_id', ids)
        }

        // Equip the item
        await supabase.from('user_inventory')
          .update({ is_equipped: true })
          .eq('user_id', user.id)
          .eq('item_id', itemId)

        // Update profile customization
        const { data: item } = await supabase.from('shop_items')
          .select('*').eq('id', itemId).maybeSingle()

        if (item) {
          const updates: Record<string, any> = { user_id: user.id, updated_at: new Date().toISOString() }
          if (item.category === 'username_style') updates.username_color = item.item_data?.color
          if (item.category === 'badge') updates.equipped_badge_id = itemId
          if (item.category === 'profile_frame') updates.equipped_frame_id = itemId
          if (item.category === 'bio_effect') updates.equipped_bio_effect = item.item_data?.effect

          await supabase.from('user_profile_customization').upsert(updates, { onConflict: 'user_id' })
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'transfer': {
        const { receiverDiscordId, amount: transferAmount } = params
        if (!receiverDiscordId || !transferAmount || transferAmount <= 0) {
          return new Response(JSON.stringify({ error: 'Invalid transfer parameters' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const taxRate = 0.05 // 5% tax
        const tax = Math.ceil(transferAmount * taxRate)
        const totalDeducted = transferAmount + tax

        // Check sender balance
        const { data: senderWallet } = await supabase.from('user_wallets')
          .select('balance, lifetime_spent').eq('user_id', user.id).maybeSingle()
        if (!senderWallet || senderWallet.balance < totalDeducted) {
          return new Response(JSON.stringify({ error: `Insufficient balance. Need ${totalDeducted} (${transferAmount} + ${tax} tax)` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Find receiver by discord ID
        const { data: profiles } = await supabase.from('profiles')
          .select('id, discord_username').eq('discord_id', receiverDiscordId).maybeSingle()
        if (!profiles) {
          return new Response(JSON.stringify({ error: 'Receiver not found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (profiles.id === user.id) {
          return new Response(JSON.stringify({ error: 'Cannot transfer to yourself' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Deduct from sender
        await supabase.from('user_wallets').update({
          balance: senderWallet.balance - totalDeducted,
          lifetime_spent: senderWallet.lifetime_spent + totalDeducted,
          updated_at: new Date().toISOString()
        }).eq('user_id', user.id)

        // Add to receiver
        const { data: receiverWallet } = await supabase.from('user_wallets')
          .select('balance, lifetime_earned').eq('user_id', profiles.id).maybeSingle()

        if (receiverWallet) {
          await supabase.from('user_wallets').update({
            balance: receiverWallet.balance + transferAmount,
            lifetime_earned: receiverWallet.lifetime_earned + transferAmount,
            updated_at: new Date().toISOString()
          }).eq('user_id', profiles.id)
        } else {
          await supabase.from('user_wallets').insert({
            user_id: profiles.id, balance: transferAmount, lifetime_earned: transferAmount
          })
        }

        // Record transfer
        await supabase.from('token_transfers').insert({
          sender_id: user.id, receiver_id: profiles.id, amount: transferAmount, tax_amount: tax
        })

        // Record transactions
        await supabase.from('token_transactions').insert([
          { user_id: user.id, amount: -totalDeducted, transaction_type: 'transfer_out', source: 'transfer', description: `Transfer to ${profiles.discord_username || receiverDiscordId}` },
          { user_id: profiles.id, amount: transferAmount, transaction_type: 'transfer_in', source: 'transfer', description: `Transfer from user` }
        ])

        return new Response(JSON.stringify({
          success: true,
          sent: transferAmount,
          tax,
          newBalance: senderWallet.balance - totalDeducted,
          receiver: profiles.discord_username
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      case 'convert_seasonal': {
        const { currencyId, amount: convertAmount } = params
        if (!currencyId || !convertAmount || convertAmount <= 0) {
          return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { data: seasonalBalance } = await supabase.from('user_seasonal_balances')
          .select('balance').eq('user_id', user.id).eq('currency_id', currencyId).maybeSingle()

        if (!seasonalBalance || seasonalBalance.balance < convertAmount) {
          return new Response(JSON.stringify({ error: 'Insufficient seasonal balance' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Convert at 1:1 ratio
        await supabase.from('user_seasonal_balances').update({
          balance: seasonalBalance.balance - convertAmount
        }).eq('user_id', user.id).eq('currency_id', currencyId)

        const { data: wallet } = await supabase.from('user_wallets')
          .select('balance, lifetime_earned').eq('user_id', user.id).maybeSingle()

        if (wallet) {
          await supabase.from('user_wallets').update({
            balance: wallet.balance + convertAmount,
            lifetime_earned: wallet.lifetime_earned + convertAmount
          }).eq('user_id', user.id)
        }

        await supabase.from('token_transactions').insert({
          user_id: user.id, amount: convertAmount, transaction_type: 'earn',
          source: 'seasonal_convert', description: 'Seasonal currency conversion'
        })

        return new Response(JSON.stringify({ success: true, converted: convertAmount }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'get_wallet': {
        const { data: wallet } = await supabase.from('user_wallets')
          .select('*').eq('user_id', user.id).maybeSingle()
        const { data: streak } = await supabase.from('daily_login_streaks')
          .select('*').eq('user_id', user.id).maybeSingle()
        const today = new Date().toISOString().split('T')[0]
        const { data: dailyCap } = await supabase.from('daily_earning_caps')
          .select('total_earned').eq('user_id', user.id).eq('earn_date', today).maybeSingle()
        const { data: seasonalBalances } = await supabase.from('user_seasonal_balances')
          .select('*, seasonal_currencies(*)').eq('user_id', user.id)
        const { data: recentTransactions } = await supabase.from('token_transactions')
          .select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)

        return new Response(JSON.stringify({
          wallet: wallet || { balance: 0, lifetime_earned: 0, lifetime_spent: 0 },
          streak: streak || { current_streak: 0, longest_streak: 0, last_claim_date: null, monthly_claims: 0 },
          dailyEarned: dailyCap?.total_earned || 0,
          dailyCap: DAILY_EARN_CAP,
          seasonalBalances: seasonalBalances || [],
          recentTransactions: recentTransactions || [],
          canClaimDaily: streak?.last_claim_date !== today
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      case 'get_leaderboard': {
        const { type = 'richest' } = params
        
        if (type === 'richest') {
          const { data } = await supabase.from('user_wallets')
            .select('user_id, balance, lifetime_earned')
            .order('balance', { ascending: false }).limit(10)
          
          // Fetch discord info for each user
          const enriched = await Promise.all((data || []).map(async (w) => {
            const { data: profile } = await supabase.from('profiles')
              .select('discord_username, discord_id, discord_avatar')
              .eq('id', w.user_id).maybeSingle()
            return { ...w, ...profile }
          }))

          return new Response(JSON.stringify({ leaderboard: enriched }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (type === 'top_earners_month') {
          const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString()
          const { data } = await supabase.from('token_transactions')
            .select('user_id, amount')
            .eq('transaction_type', 'earn')
            .gte('created_at', monthAgo)

          const earners: Record<string, number> = {}
          data?.forEach(t => { earners[t.user_id] = (earners[t.user_id] || 0) + t.amount })
          const sorted = Object.entries(earners).sort((a, b) => b[1] - a[1]).slice(0, 10)

          const enriched = await Promise.all(sorted.map(async ([userId, total]) => {
            const { data: profile } = await supabase.from('profiles')
              .select('discord_username, discord_id, discord_avatar').eq('id', userId).maybeSingle()
            return { user_id: userId, total_earned: total, ...profile }
          }))

          return new Response(JSON.stringify({ leaderboard: enriched }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (type === 'top_spenders') {
          const { data } = await supabase.from('user_wallets')
            .select('user_id, lifetime_spent')
            .order('lifetime_spent', { ascending: false }).limit(10)

          const enriched = await Promise.all((data || []).map(async (w) => {
            const { data: profile } = await supabase.from('profiles')
              .select('discord_username, discord_id, discord_avatar').eq('id', w.user_id).maybeSingle()
            return { ...w, ...profile }
          }))

          return new Response(JSON.stringify({ leaderboard: enriched }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (type === 'highest_streak') {
          const { data } = await supabase.from('daily_login_streaks')
            .select('user_id, longest_streak, current_streak')
            .order('longest_streak', { ascending: false }).limit(10)

          const enriched = await Promise.all((data || []).map(async (s) => {
            const { data: profile } = await supabase.from('profiles')
              .select('discord_username, discord_id, discord_avatar').eq('id', s.user_id).maybeSingle()
            return { ...s, ...profile }
          }))

          return new Response(JSON.stringify({ leaderboard: enriched }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify({ leaderboard: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'get_economy_stats': {
        // Owner only - get economy overview
        const { data: ownerCheck } = await supabase.rpc('is_owner', { _user_id: user.id })
        if (!ownerCheck) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { data: allWallets } = await supabase.from('user_wallets').select('balance, lifetime_earned, lifetime_spent')
        const totalCirculation = allWallets?.reduce((sum, w) => sum + w.balance, 0) || 0
        const totalEarned = allWallets?.reduce((sum, w) => sum + w.lifetime_earned, 0) || 0
        const totalSpent = allWallets?.reduce((sum, w) => sum + w.lifetime_spent, 0) || 0

        const { data: recentTx } = await supabase.from('token_transactions')
          .select('*, profiles!token_transactions_user_id_fkey(discord_username, discord_id, discord_avatar)')
          .order('created_at', { ascending: false }).limit(50)

        // If the join didn't work, fetch profiles separately
        let enrichedTx = recentTx || []
        if (recentTx && recentTx.length > 0 && !recentTx[0].profiles) {
          const userIds = [...new Set(recentTx.map(t => t.user_id))]
          const { data: profiles } = await supabase.from('profiles')
            .select('id, discord_username, discord_id, discord_avatar')
            .in('id', userIds)
          const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
          enrichedTx = recentTx.map(t => ({
            ...t,
            discord_username: profileMap.get(t.user_id)?.discord_username,
            discord_id: profileMap.get(t.user_id)?.discord_id,
            discord_avatar: profileMap.get(t.user_id)?.discord_avatar
          }))
        }

        return new Response(JSON.stringify({
          totalCirculation,
          totalEarned,
          totalSpent,
          totalUsers: allWallets?.length || 0,
          inflationRate: totalEarned > 0 ? ((totalCirculation / totalEarned) * 100).toFixed(1) : '0',
          recentTransactions: enrichedTx
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    console.error('Token economy error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
