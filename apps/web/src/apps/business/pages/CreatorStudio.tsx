import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Eye, GripVertical, Palette, PanelTop, RotateCcw, Save, Sparkles, ToggleLeft, ToggleRight, Type } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import { updateWorkspaceConsumerConfigForUser } from '../../../domain/workspace/api'
import type { CreatorCustomization, CreatorLayoutSection, CreatorTheme, CreatorThemePreset } from '@olu/shared/types/consumer'

const THEME_PRESETS: { key: CreatorThemePreset; label: string; labelZh: string; accent: string; bg: string; sample: string }[] = [
  { key: 'default', label: 'Default', labelZh: '默认', accent: '#e11d48', bg: 'from-gray-900 to-gray-800', sample: 'bg-gradient-to-br from-gray-900 to-gray-800' },
  { key: 'neon', label: 'Neon', labelZh: '霓虹', accent: '#06b6d4', bg: 'from-cyan-950 to-violet-950', sample: 'bg-gradient-to-br from-cyan-950 to-violet-950' },
  { key: 'pastel', label: 'Pastel', labelZh: '柔和', accent: '#f472b6', bg: 'from-pink-50 to-violet-50', sample: 'bg-gradient-to-br from-pink-100 to-violet-100' },
  { key: 'minimal', label: 'Minimal', labelZh: '极简', accent: '#1f2937', bg: 'from-white to-gray-50', sample: 'bg-gradient-to-br from-gray-50 to-white' },
  { key: 'bold', label: 'Bold', labelZh: '粗犷', accent: '#ea580c', bg: 'from-orange-950 to-red-950', sample: 'bg-gradient-to-br from-orange-950 to-red-950' },
  { key: 'earth', label: 'Earth', labelZh: '大地色', accent: '#92400e', bg: 'from-amber-950 to-stone-900', sample: 'bg-gradient-to-br from-amber-950 to-stone-900' },
]

const HERO_STYLES = ['fullscreen', 'card', 'minimal', 'video'] as const
const FONT_STYLES = ['modern', 'serif', 'mono'] as const
const CARD_RADII = ['sm', 'md', 'lg', 'xl'] as const

const ALL_SECTIONS: { key: CreatorLayoutSection; icon: string; label: string; labelZh: string }[] = [
  { key: 'hero', icon: '🎯', label: 'Hero Banner', labelZh: '头图横幅' },
  { key: 'feed', icon: '📝', label: 'Feed / Posts', labelZh: '动态 / 帖子' },
  { key: 'topics', icon: '💬', label: 'Topics', labelZh: '话题' },
  { key: 'gallery', icon: '🖼', label: 'Gallery', labelZh: '相册' },
  { key: 'courses', icon: '🎓', label: 'Courses', labelZh: '课程' },
  { key: 'membership', icon: '👑', label: 'Membership', labelZh: '会员' },
  { key: 'shop', icon: '🛍', label: 'Shop', labelZh: '商店' },
  { key: 'about', icon: 'ℹ️', label: 'About', labelZh: '关于' },
]

const DEFAULT_CUSTOMIZATION: CreatorCustomization = {
  theme: {
    preset: 'default',
    accentColor: '#e11d48',
    bgStyle: 'gradient',
    bgValue: 'from-gray-900 to-gray-800',
    cardRadius: 'lg',
    fontStyle: 'modern',
  },
  sections: ['hero', 'feed', 'topics', 'gallery', 'membership', 'shop'],
  tabs: [
    { key: 'feed', label: 'Feed', visible: true, order: 0 },
    { key: 'topics', label: 'Topics', visible: true, order: 1 },
    { key: 'gallery', label: 'Gallery', visible: true, order: 2 },
    { key: 'courses', label: 'Courses', visible: true, order: 3 },
    { key: 'shop', label: 'Shop', visible: true, order: 4 },
    { key: 'about', label: 'About', visible: false, order: 5 },
  ],
  heroStyle: 'card',
}

type EditorTab = 'theme' | 'layout' | 'tabs'

export default function CreatorStudio() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const isZh = i18n.language.startsWith('zh')
  const [activeTab, setActiveTab] = useState<EditorTab>('theme')
  const [config, setConfig] = useState<CreatorCustomization>(DEFAULT_CUSTOMIZATION)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    // TODO: load from workspace config_json.creator_customization
  }, [user?.id])

  function updateTheme(partial: Partial<CreatorTheme>) {
    setConfig((prev) => ({ ...prev, theme: { ...prev.theme, ...partial } }))
    setSaved(false)
  }

  function applyPreset(preset: CreatorThemePreset) {
    const p = THEME_PRESETS.find((item) => item.key === preset)
    if (!p) return
    updateTheme({ preset, accentColor: p.accent, bgStyle: 'gradient', bgValue: p.bg })
  }

  function toggleSection(key: CreatorLayoutSection) {
    setConfig((prev) => {
      const has = prev.sections.includes(key)
      return {
        ...prev,
        sections: has ? prev.sections.filter((s) => s !== key) : [...prev.sections, key],
      }
    })
    setSaved(false)
  }

  function moveSection(index: number, direction: -1 | 1) {
    setConfig((prev) => {
      const next = [...prev.sections]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return { ...prev, sections: next }
    })
    setSaved(false)
  }

  function toggleTab(key: string) {
    setConfig((prev) => ({
      ...prev,
      tabs: prev.tabs.map((tab) => tab.key === key ? { ...tab, visible: !tab.visible } : tab),
    }))
    setSaved(false)
  }

  function updateTabLabel(key: string, label: string) {
    setConfig((prev) => ({
      ...prev,
      tabs: prev.tabs.map((tab) => tab.key === key ? { ...tab, label } : tab),
    }))
    setSaved(false)
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      await updateWorkspaceConsumerConfigForUser(user, {
        config_json: { creator_customization: config },
      })
      setSaved(true)
    } catch (err) {
      console.error('Failed to save creator customization', err)
    } finally {
      setSaving(false)
    }
  }

  const tabItems: { key: EditorTab; icon: typeof Palette; label: string }[] = [
    { key: 'theme', icon: Palette, label: t('creatorStudio.theme') },
    { key: 'layout', icon: PanelTop, label: t('creatorStudio.layout') },
    { key: 'tabs', icon: Type, label: t('creatorStudio.tabs') },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[var(--olu-text-secondary)] text-xs uppercase tracking-wider mb-2">Workspace</p>
          <h1 className="font-black text-2xl">{t('creatorStudio.title')}</h1>
          <p className="text-[var(--olu-text-secondary)] text-sm mt-1">{t('creatorStudio.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewOpen(!previewOpen)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-sm font-medium text-[var(--olu-text-secondary)] hover:bg-[var(--olu-card-hover)] transition-colors"
          >
            <Eye size={14} />
            {t('creatorStudio.preview')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saved ? <Check size={14} /> : <Save size={14} />}
            {saving ? t('common.saving') : saved ? t('common.done') : t('creatorStudio.saveChanges')}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px,1fr] gap-6">
        {/* Sidebar tabs */}
        <div className="space-y-2">
          {tabItems.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left',
                activeTab === key
                  ? 'bg-white text-black'
                  : 'bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text-secondary)] hover:bg-[var(--olu-card-hover)]',
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
          <button
            onClick={() => { setConfig(DEFAULT_CUSTOMIZATION); setSaved(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text-secondary)] hover:bg-[var(--olu-card-hover)] transition-colors text-left"
          >
            <RotateCcw size={16} />
            {t('creatorStudio.resetToDefault')}
          </button>
        </div>

        {/* Editor panel */}
        <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-5 md:p-6">
          {activeTab === 'theme' && (
            <div className="space-y-6">
              {/* Presets */}
              <div>
                <h3 className="font-semibold text-sm mb-3">{t('creatorStudio.presets')}</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      onClick={() => applyPreset(preset.key)}
                      className={clsx(
                        'rounded-xl p-3 text-center transition-all border',
                        config.theme.preset === preset.key
                          ? 'border-white ring-2 ring-white/20'
                          : 'border-[var(--olu-card-border)] hover:border-white/30',
                      )}
                    >
                      <div className={`w-full h-10 rounded-lg ${preset.sample} mb-2`} />
                      <p className="text-xs font-medium">{isZh ? preset.labelZh : preset.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent color */}
              <div>
                <h3 className="font-semibold text-sm mb-3">{t('creatorStudio.accentColor')}</h3>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.theme.accentColor}
                    onChange={(e) => updateTheme({ accentColor: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={config.theme.accentColor}
                    onChange={(e) => updateTheme({ accentColor: e.target.value })}
                    className="w-28 px-3 py-2 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-sm focus:outline-none"
                  />
                  <div className="flex gap-1.5">
                    {['#e11d48', '#06b6d4', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'].map((color) => (
                      <button
                        key={color}
                        onClick={() => updateTheme({ accentColor: color })}
                        className={clsx('w-7 h-7 rounded-full transition-all', config.theme.accentColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-[var(--olu-section-bg)]')}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Hero style */}
              <div>
                <h3 className="font-semibold text-sm mb-3">{t('creatorStudio.heroStyle')}</h3>
                <div className="grid grid-cols-4 gap-2">
                  {HERO_STYLES.map((style) => (
                    <button
                      key={style}
                      onClick={() => setConfig((prev) => ({ ...prev, heroStyle: style }))}
                      className={clsx(
                        'rounded-xl p-3 text-center text-xs font-medium transition-all border',
                        config.heroStyle === style
                          ? 'border-white bg-white/10'
                          : 'border-[var(--olu-card-border)] hover:bg-[var(--olu-card-hover)]',
                      )}
                    >
                      {t(`creatorStudio.${style === 'video' ? 'videoHero' : style}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font style */}
              <div>
                <h3 className="font-semibold text-sm mb-3">{t('creatorStudio.fontStyle')}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {FONT_STYLES.map((font) => (
                    <button
                      key={font}
                      onClick={() => updateTheme({ fontStyle: font })}
                      className={clsx(
                        'rounded-xl p-4 text-center transition-all border',
                        config.theme.fontStyle === font
                          ? 'border-white bg-white/10'
                          : 'border-[var(--olu-card-border)] hover:bg-[var(--olu-card-hover)]',
                        font === 'serif' && 'font-serif',
                        font === 'mono' && 'font-mono',
                      )}
                    >
                      <p className="text-lg font-bold mb-1">Aa</p>
                      <p className="text-xs text-[var(--olu-text-secondary)]">{t(`creatorStudio.${font}`)}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card radius */}
              <div>
                <h3 className="font-semibold text-sm mb-3">{t('creatorStudio.cardRadius')}</h3>
                <div className="grid grid-cols-4 gap-2">
                  {CARD_RADII.map((radius) => {
                    const rClass = { sm: 'rounded', md: 'rounded-lg', lg: 'rounded-xl', xl: 'rounded-2xl' }[radius]
                    return (
                      <button
                        key={radius}
                        onClick={() => updateTheme({ cardRadius: radius })}
                        className={clsx(
                          'p-3 text-center text-xs font-medium transition-all border',
                          rClass,
                          config.theme.cardRadius === radius
                            ? 'border-white bg-white/10'
                            : 'border-[var(--olu-card-border)] hover:bg-[var(--olu-card-hover)]',
                        )}
                      >
                        <div className={`w-8 h-8 bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] mx-auto mb-1.5 ${rClass}`} />
                        {radius.toUpperCase()}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{t('creatorStudio.sections')}</h3>
                <p className="text-xs text-[var(--olu-text-secondary)]">{t('creatorStudio.dragToReorder')}</p>
              </div>
              {ALL_SECTIONS.map((section) => {
                const isActive = config.sections.includes(section.key)
                const index = config.sections.indexOf(section.key)
                return (
                  <div
                    key={section.key}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors',
                      isActive
                        ? 'border-white/20 bg-white/5'
                        : 'border-[var(--olu-card-border)] bg-[var(--olu-card-bg)] opacity-50',
                    )}
                  >
                    {isActive && (
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveSection(index, -1)}
                          disabled={index <= 0}
                          className="p-0.5 text-[var(--olu-text-secondary)] hover:text-white disabled:opacity-20 transition-colors"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveSection(index, 1)}
                          disabled={index >= config.sections.length - 1}
                          className="p-0.5 text-[var(--olu-text-secondary)] hover:text-white disabled:opacity-20 transition-colors"
                        >
                          ▼
                        </button>
                      </div>
                    )}
                    <GripVertical size={14} className="text-[var(--olu-text-secondary)]" />
                    <span className="text-lg">{section.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{isZh ? section.labelZh : section.label}</p>
                    </div>
                    <button onClick={() => toggleSection(section.key)}>
                      {isActive ? (
                        <ToggleRight size={24} className="text-emerald-400" />
                      ) : (
                        <ToggleLeft size={24} className="text-[var(--olu-text-secondary)]" />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'tabs' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm mb-2">{t('creatorStudio.tabsDesc')}</h3>
              {config.tabs.map((tab) => (
                <div
                  key={tab.key}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors',
                    tab.visible
                      ? 'border-white/20 bg-white/5'
                      : 'border-[var(--olu-card-border)] bg-[var(--olu-card-bg)] opacity-50',
                  )}
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      value={tab.label}
                      onChange={(e) => updateTabLabel(tab.key, e.target.value)}
                      className="bg-transparent text-sm font-medium focus:outline-none w-full"
                      placeholder={t('creatorStudio.tabName')}
                    />
                    <p className="text-xs text-[var(--olu-text-secondary)] mt-0.5">{tab.key}</p>
                  </div>
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full', tab.visible ? 'bg-emerald-400/15 text-emerald-400' : 'bg-[var(--olu-card-bg)] text-[var(--olu-text-secondary)]')}>
                    {tab.visible ? t('creatorStudio.visible') : t('creatorStudio.hidden')}
                  </span>
                  <button onClick={() => toggleTab(tab.key)}>
                    {tab.visible ? (
                      <ToggleRight size={24} className="text-emerald-400" />
                    ) : (
                      <ToggleLeft size={24} className="text-[var(--olu-text-secondary)]" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live Preview Panel */}
      {previewOpen && (
        <div className="mt-6 rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--olu-card-border)]">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-amber-300" />
              <p className="text-sm font-semibold">{t('creatorStudio.livePreview')}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.theme.accentColor }} />
                <span className="text-xs text-[var(--olu-text-secondary)]">{config.theme.accentColor}</span>
              </div>
              <span className="text-xs text-[var(--olu-text-secondary)]">
                {config.theme.fontStyle} · {config.theme.cardRadius} · {config.heroStyle}
              </span>
            </div>
          </div>
          <div className="p-5">
            <div className={`rounded-2xl overflow-hidden ${THEME_PRESETS.find((p) => p.key === config.theme.preset)?.sample || 'bg-olu-card'}`}>
              {/* Hero preview */}
              <div
                className={clsx(
                  'p-6 flex items-end',
                  config.heroStyle === 'fullscreen' && 'h-48',
                  config.heroStyle === 'card' && 'h-32',
                  config.heroStyle === 'minimal' && 'h-20',
                  config.heroStyle === 'video' && 'h-40',
                )}
              >
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/50">Community</p>
                  <h2 className={clsx('text-xl font-black text-white mt-1', config.theme.fontStyle === 'serif' && 'font-serif', config.theme.fontStyle === 'mono' && 'font-mono')}>
                    Your Community Name
                  </h2>
                  {config.theme.fontStyle !== 'mono' && (
                    <p className="text-xs text-white/60 mt-1">Hosted by Creator Name</p>
                  )}
                </div>
              </div>
              {/* Sections preview */}
              <div className="bg-black/20 p-4 space-y-3">
                {config.tabs.filter((tab) => tab.visible).map((tab) => (
                  <div key={tab.key} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.theme.accentColor }} />
                    <span className="text-xs text-white/70">{tab.label}</span>
                  </div>
                ))}
              </div>
              {/* Section blocks preview */}
              <div className="p-4 space-y-2">
                {config.sections.slice(0, 4).map((sectionKey) => {
                  const section = ALL_SECTIONS.find((s) => s.key === sectionKey)
                  if (!section) return null
                  const rClass = { sm: 'rounded', md: 'rounded-lg', lg: 'rounded-xl', xl: 'rounded-2xl' }[config.theme.cardRadius]
                  return (
                    <div key={sectionKey} className={`${rClass} bg-white/10 backdrop-blur-sm p-3 flex items-center gap-2`}>
                      <span>{section.icon}</span>
                      <span className="text-xs text-white/70">{isZh ? section.labelZh : section.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
