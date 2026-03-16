import { supabase } from '../../lib/supabase'
import type { BusinessCampaign, BusinessCampaignEvent, BusinessCampaignTarget, BusinessCampaignWorkflow } from '../../lib/supabase'
import { ensureWorkspaceForUser } from '../workspace/api'

async function getCampaignTargets(campaignId: string) {
  const { data, error } = await supabase
    .from('business_campaign_targets')
    .select(`
      *,
      creator:users!business_campaign_targets_creator_id_fkey (
        id,
        name,
        handle,
        avatar_img,
        avatar_color,
        initials
      )
    `)
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as BusinessCampaignTarget[]
}

async function getCampaignEvents(campaignId: string) {
  const { data, error } = await supabase
    .from('business_campaign_events')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as BusinessCampaignEvent[]
}

export async function getLatestBusinessCampaignForAdvertiser(advertiserId: string) {
  const { data, error } = await supabase
    .from('business_campaigns')
    .select('*')
    .eq('advertiser_id', advertiserId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const [targets, events] = await Promise.all([
    getCampaignTargets(data.id),
    getCampaignEvents(data.id),
  ])

  return {
    campaign: data as BusinessCampaign,
    targets,
    events,
  } as BusinessCampaignWorkflow
}

export async function getLatestBusinessCampaignForCreator(creatorId: string) {
  const { data: targets, error } = await supabase
    .from('business_campaign_targets')
    .select(`
      *,
      campaign:business_campaigns!business_campaign_targets_campaign_id_fkey (*),
      creator:users!business_campaign_targets_creator_id_fkey (
        id,
        name,
        handle,
        avatar_img,
        avatar_color,
        initials
      )
    `)
    .eq('creator_id', creatorId)
    .order('updated_at', { ascending: false })
    .limit(1)

  if (error) throw error
  if (!targets || targets.length === 0) return null

  const targetRow = targets[0] as any
  const campaign = targetRow.campaign as BusinessCampaign
  const [allTargets, events] = await Promise.all([
    getCampaignTargets(campaign.id),
    getCampaignEvents(campaign.id),
  ])

  return {
    campaign,
    targets: allTargets,
    events,
  } as BusinessCampaignWorkflow
}

export async function startBusinessCampaignDemo(advertiserId: string, creatorId: string) {
  const advertiserMembership = await ensureWorkspaceForUser({
    id: advertiserId,
    username: '',
    handle: '',
    name: 'Workspace owner',
    email: '',
  } as any)

  const advertiserAgentId = null // workspace_agents removed

  const { data: creatorRow, error: creatorError } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', creatorId)
    .maybeSingle()

  if (creatorError) throw creatorError
  if (!creatorRow?.id) throw new Error('Target creator not found')

  const creatorMembership = await ensureWorkspaceForUser({
    id: creatorRow.id,
    username: '',
    handle: '',
    name: creatorRow.name || 'Creator',
    email: '',
  } as any)

  const creatorAgentId = null // workspace_agents removed

  const { data: campaign, error: campaignError } = await supabase
    .from('business_campaigns')
    .insert({
      advertiser_id: advertiserId,
      agent_id: advertiserAgentId,
      name: 'Run club launch sprint',
      brand_name: 'AeroPulse',
      objective: 'Find 5 sports KOLs to promote the new performance sneaker line.',
      budget: 1000,
      budget_spent: 120,
      status: 'sourcing',
      target_creator_count: 1,
    })
    .select('*')
    .single()

  if (campaignError) throw campaignError

  const { data: target, error: targetError } = await supabase
    .from('business_campaign_targets')
    .insert({
      campaign_id: campaign.id,
      creator_id: creatorRow.id,
      creator_agent_id: creatorAgentId,
      stage: 'shortlisted',
      offer_amount: 100,
      deliverable_type: 'ai_video',
      deliverable_status: 'waiting',
      marketer_message: `Marketing Manager accepted the brief and is sourcing sports creators. ${creatorRow.name} is first in the shortlist.`,
      creator_message: 'Business Agent is monitoring new campaign opportunities.',
      creator_reward: 0,
    })
    .select('*')
    .single()

  if (targetError) throw targetError

  const { error: eventError } = await supabase
    .from('business_campaign_events')
    .insert({
      campaign_id: campaign.id,
      target_id: target.id,
      actor_type: 'advertiser',
      actor_user_id: advertiserId,
      title: 'Campaign brief created',
      detail: 'Marketing Manager accepted the AeroPulse launch brief and started sourcing sports creators.',
    })

  if (eventError) throw eventError
  return getLatestBusinessCampaignForAdvertiser(advertiserId)
}

export async function advanceBusinessCampaign(campaignId: string, advertiserId: string) {
  const { data: campaign, error: campaignError } = await supabase
    .from('business_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (campaignError) throw campaignError

  const targets = await getCampaignTargets(campaignId)
  const primaryTarget = targets[0]
  if (!primaryTarget) throw new Error('Campaign target not found')

  if (campaign.status === 'sourcing') {
    const { error: targetError } = await supabase
      .from('business_campaign_targets')
      .update({
        stage: 'offer_sent',
        marketer_message: 'Offer package drafted. Luna Chen now has a collaboration request with script outline, AI video sample, and $100 placement fee.',
        creator_message: 'New promotion request from AeroPulse. Review the AI-generated promo and approve or reject.',
      })
      .eq('id', primaryTarget.id)

    if (targetError) throw targetError

    const { error: campaignUpdateError } = await supabase
      .from('business_campaigns')
      .update({
        status: 'offer_sent',
        budget_spent: 220,
      })
      .eq('id', campaignId)

    if (campaignUpdateError) throw campaignUpdateError

    const { error: eventError } = await supabase
      .from('business_campaign_events')
      .insert({
        campaign_id: campaignId,
        target_id: primaryTarget.id,
        actor_type: 'agent',
        actor_user_id: advertiserId,
        title: 'Offer sent to creator',
        detail: 'AI-generated promo sample, fee, and posting requirements were delivered to the creator-side business agent.',
      })

    if (eventError) throw eventError
  } else if (campaign.status === 'approved') {
    const { error: targetError } = await supabase
      .from('business_campaign_targets')
      .update({
        stage: 'scheduled',
        deliverable_status: 'approved',
        creator_message: 'Promotion accepted. The sponsored video has been scheduled in your community feed.',
      })
      .eq('id', primaryTarget.id)

    if (targetError) throw targetError

    const { error: campaignUpdateError } = await supabase
      .from('business_campaigns')
      .update({
        status: 'scheduled',
        budget_spent: 340,
      })
      .eq('id', campaignId)

    if (campaignUpdateError) throw campaignUpdateError

    const { error: eventError } = await supabase
      .from('business_campaign_events')
      .insert({
        campaign_id: campaignId,
        target_id: primaryTarget.id,
        actor_type: 'agent',
        actor_user_id: advertiserId,
        title: 'Publishing scheduled',
        detail: 'Approved promo content moved into creator publishing queue, with performance reporting set for the next day.',
      })

    if (eventError) throw eventError
  } else if (campaign.status === 'scheduled') {
    const now = new Date().toISOString()

    const { error: targetError } = await supabase
      .from('business_campaign_targets')
      .update({
        stage: 'published',
        deliverable_status: 'published',
        creator_message: 'Sponsored content is now live in your community feed. Metrics collection has started.',
        published_at: now,
      })
      .eq('id', primaryTarget.id)

    if (targetError) throw targetError

    const { error: campaignUpdateError } = await supabase
      .from('business_campaigns')
      .update({
        status: 'published',
        budget_spent: 380,
      })
      .eq('id', campaignId)

    if (campaignUpdateError) throw campaignUpdateError

    const { error: eventError } = await supabase
      .from('business_campaign_events')
      .insert({
        campaign_id: campaignId,
        target_id: primaryTarget.id,
        actor_type: 'system',
        actor_user_id: advertiserId,
        title: 'Sponsored post published',
        detail: 'The approved promotion is now live in the creator feed, and performance collection has started.',
      })

    if (eventError) throw eventError
  } else if (campaign.status === 'published') {
    const { error: targetError } = await supabase
      .from('business_campaign_targets')
      .update({
        stage: 'reported',
        deliverable_status: 'reported',
        creator_message: 'Performance report returned. The live placement generated views, clicks, and conversions for the advertiser.',
        reported_views: 482000,
        reported_clicks: 16240,
        reported_conversions: 1840,
      })
      .eq('id', primaryTarget.id)

    if (targetError) throw targetError

    const { error: campaignUpdateError } = await supabase
      .from('business_campaigns')
      .update({
        status: 'completed',
        budget_spent: 460,
        reported_reach: 482000,
        reported_conversions: 1840,
      })
      .eq('id', campaignId)

    if (campaignUpdateError) throw campaignUpdateError

    const { error: eventError } = await supabase
      .from('business_campaign_events')
      .insert({
        campaign_id: campaignId,
        target_id: primaryTarget.id,
        actor_type: 'system',
        actor_user_id: advertiserId,
        title: 'Performance report returned',
        detail: 'AeroPulse received the first-day report: 482K reach, 16.2K clicks, and 1,840 conversions from Luna Chen placement.',
      })

    if (eventError) throw eventError
  }

  return getLatestBusinessCampaignForAdvertiser(advertiserId)
}

export async function approveBusinessCampaignTarget(targetId: string, creatorId: string) {
  const { data: target, error: targetError } = await supabase
    .from('business_campaign_targets')
    .select('*')
    .eq('id', targetId)
    .single()

  if (targetError) throw targetError

  const { error: updateTargetError } = await supabase
    .from('business_campaign_targets')
    .update({
      stage: 'approved',
      deliverable_status: 'uploaded',
      creator_reward: target.offer_amount,
      creator_message: 'You approved the AeroPulse campaign. Business Agent is notifying the marketer and locking the creator fee.',
      responded_at: new Date().toISOString(),
    })
    .eq('id', targetId)

  if (updateTargetError) throw updateTargetError

  const { error: updateCampaignError } = await supabase
    .from('business_campaigns')
    .update({
      status: 'approved',
      budget_spent: 280,
    })
    .eq('id', target.campaign_id)

  if (updateCampaignError) throw updateCampaignError

  const { error: eventError } = await supabase
    .from('business_campaign_events')
    .insert({
      campaign_id: target.campaign_id,
      target_id: targetId,
      actor_type: 'creator',
      actor_user_id: creatorId,
      title: 'Creator approved campaign',
      detail: 'Creator accepted the AeroPulse placement and requested the marketer to move the asset into publishing queue.',
    })

  if (eventError) throw eventError
  return getLatestBusinessCampaignForCreator(creatorId)
}

export async function rejectBusinessCampaignTarget(targetId: string, creatorId: string) {
  const { data: target, error: targetError } = await supabase
    .from('business_campaign_targets')
    .select('*')
    .eq('id', targetId)
    .single()

  if (targetError) throw targetError

  const { error: updateTargetError } = await supabase
    .from('business_campaign_targets')
    .update({
      stage: 'rejected',
      creator_message: 'Creator rejected the AeroPulse campaign. Business Agent requested the marketer to revise offer or move to backup creators.',
      responded_at: new Date().toISOString(),
    })
    .eq('id', targetId)

  if (updateTargetError) throw updateTargetError

  const { error: updateCampaignError } = await supabase
    .from('business_campaigns')
    .update({
      status: 'cancelled',
    })
    .eq('id', target.campaign_id)

  if (updateCampaignError) throw updateCampaignError

  const { error: eventError } = await supabase
    .from('business_campaign_events')
    .insert({
      campaign_id: target.campaign_id,
      target_id: targetId,
      actor_type: 'creator',
      actor_user_id: creatorId,
      title: 'Creator rejected campaign',
      detail: 'Creator declined the promotion request, so the marketer must revise the offer or choose another creator.',
    })

  if (eventError) throw eventError
  return getLatestBusinessCampaignForCreator(creatorId)
}
