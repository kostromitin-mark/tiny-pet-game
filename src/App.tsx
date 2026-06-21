import { useEffect, useRef, useState } from 'react'
import './App.css'

type PetStats = {
  hunger: number
  energy: number
  happiness: number
}

type PetProgression = {
  level: number
  xp: number
}

type PetMood = 'happy' | 'tired' | 'hungry' | 'normal'
type PetType = 'cat' | 'dog' | 'blob'
type PetColor = 'purple' | 'peach' | 'mint' | 'blue'
type PetAccessory = 'none' | 'hat' | 'bow' | 'glasses'

type PetCustomization = {
  type: PetType
  color: PetColor
  accessory: PetAccessory
}

type RandomPetEvent = {
  message: string
  icon: string
  changes: Partial<PetStats>
}

type ActivePetEvent = Pick<RandomPetEvent, 'message' | 'icon'> & {
  id: number
}

type CareWarning = 'hungry' | 'tired'

type TimedStatsSnapshot = {
  stats: PetStats
  lastUpdated: number
  warning: CareWarning | null
}

type DailyCareState = {
  careStreak: number
  lastCareDate: string | null
  dailyRewardClaimedDate: string | null
}

type JournalEntryType = 'care' | 'mood' | 'reward' | 'random' | 'system'

type JournalEntry = {
  id: string
  timestamp: number
  message: string
  type: JournalEntryType
}

type DreamRarity = 'common' | 'rare' | 'legendary'

type DreamCard = {
  id: string
  title: string
  description: string
  emoji: string
  effectText: string
  rarity: DreamRarity
  effect: Partial<PetStats> & { xp?: number }
}

type ActionAnimation = 'feed' | 'play' | null

const STORAGE_KEY = 'tiny-pet-game:stats'
const PROGRESSION_STORAGE_KEY = 'tiny-pet-game:progression'
const NAME_STORAGE_KEY = 'tiny-pet-game:name'
const CUSTOMIZATION_STORAGE_KEY = 'tiny-pet-game:customization'
const LAST_UPDATED_STORAGE_KEY = 'tiny-pet-game:lastUpdated'
const DAILY_CARE_STORAGE_KEY = 'tiny-pet-game:dailyCare'
const JOURNAL_STORAGE_KEY = 'tiny-pet-game:journalEntries'
const DREAM_ALBUM_STORAGE_KEY = 'tiny-pet-game:dreamAlbum'
const DEFAULT_PET_NAME = 'Mochi'
const LEGACY_ACTIONS_PER_LEVEL = 5
const RANDOM_EVENT_CHANCE = 0.3
const TIME_STEP_MS = 60_000
const MAX_OFFLINE_STEPS = 4 * 60
const STRONG_HUNGER_THRESHOLD = 85
const LOW_ENERGY_THRESHOLD = 15
const JOURNAL_DISPLAY_LIMIT = 10
const JOURNAL_STORAGE_LIMIT = 100
const DREAM_CHANCE = 0.4
const DREAM_SEQUENCE_DURATION_MS = 2_400
const REDUCED_MOTION_DREAM_DURATION_MS = 350
const ACTION_ANIMATION_DURATION_MS = 1_000
const REDUCED_MOTION_ACTION_DURATION_MS = 180
const FEED_ANIMATION_EMOJI = '🍪'
const PLAY_ANIMATION_EMOJI = '🎾'

const INITIAL_STATS: PetStats = {
  hunger: 35,
  energy: 70,
  happiness: 65,
}

const INITIAL_PROGRESSION: PetProgression = {
  level: 1,
  xp: 0,
}

const INITIAL_CUSTOMIZATION: PetCustomization = {
  type: 'cat',
  color: 'purple',
  accessory: 'none',
}

const INITIAL_DAILY_CARE: DailyCareState = {
  careStreak: 0,
  lastCareDate: null,
  dailyRewardClaimedDate: null,
}

const journalTypeDetails: Record<
  JournalEntryType,
  { icon: string; label: string }
> = {
  care: { icon: '💗', label: 'Care' },
  mood: { icon: '🌟', label: 'Mood' },
  reward: { icon: '🎁', label: 'Reward' },
  random: { icon: '✨', label: 'Random event' },
  system: { icon: '🌱', label: 'System' },
}

const dreamCards: DreamCard[] = [
  {
    id: 'moon-garden',
    title: 'Moon Garden',
    description: 'Silver flowers opened under a smiling moon.',
    emoji: '🌙',
    effectText: '+8 happiness',
    rarity: 'common',
    effect: { happiness: 8 },
  },
  {
    id: 'tiny-rocket',
    title: 'Tiny Rocket',
    description: 'A pocket rocket zipped between twinkling planets.',
    emoji: '🚀',
    effectText: '+10 XP',
    rarity: 'rare',
    effect: { xp: 10 },
  },
  {
    id: 'toy-mountain',
    title: 'Toy Mountain',
    description: 'Every path was built from blocks, balls, and tiny trains.',
    emoji: '🧸',
    effectText: '+6 happiness',
    rarity: 'common',
    effect: { happiness: 6 },
  },
  {
    id: 'bubble-ocean',
    title: 'Bubble Ocean',
    description: 'Soft bubbles carried the dream across a quiet blue sea.',
    emoji: '🫧',
    effectText: '+8 energy',
    rarity: 'common',
    effect: { energy: 8 },
  },
  {
    id: 'candy-forest',
    title: 'Candy Forest',
    description: 'Lollipop trees rustled in a warm sugar breeze.',
    emoji: '🍭',
    effectText: '+10 happiness',
    rarity: 'rare',
    effect: { happiness: 10 },
  },
  {
    id: 'tiny-kingdom',
    title: 'Tiny Kingdom',
    description: 'A cheerful kingdom welcomed its smallest royal guest.',
    emoji: '👑',
    effectText: '+15 XP',
    rarity: 'legendary',
    effect: { xp: 15 },
  },
  {
    id: 'star-pillow',
    title: 'Star Pillow',
    description: 'A glowing star became the coziest pillow in the sky.',
    emoji: '⭐',
    effectText: '+10 energy',
    rarity: 'rare',
    effect: { energy: 10 },
  },
  {
    id: 'cloud-castle',
    title: 'Cloud Castle',
    description: 'A fluffy castle floated above a peach-colored sunset.',
    emoji: '☁️',
    effectText: '+8 XP and +4 happiness',
    rarity: 'legendary',
    effect: { xp: 8, happiness: 4 },
  },
]

const petTypes: { value: PetType; label: string; icon: string }[] = [
  { value: 'cat', label: 'Cat', icon: '🐱' },
  { value: 'dog', label: 'Dog', icon: '🐶' },
  { value: 'blob', label: 'Blob', icon: '🫧' },
]

const petColors: { value: PetColor; label: string }[] = [
  { value: 'purple', label: 'Purple' },
  { value: 'peach', label: 'Peach' },
  { value: 'mint', label: 'Mint' },
  { value: 'blue', label: 'Blue' },
]

const petAccessories: {
  value: PetAccessory
  label: string
  icon: string
}[] = [
  { value: 'none', label: 'None', icon: '—' },
  { value: 'hat', label: 'Hat', icon: '🎩' },
  { value: 'bow', label: 'Bow', icon: '🎀' },
  { value: 'glasses', label: 'Glasses', icon: '👓' },
]

const randomEvents: RandomPetEvent[] = [
  {
    message: 'Your pet found a tiny toy!',
    icon: '🧸',
    changes: { happiness: 8 },
  },
  {
    message: 'Your pet feels extra happy!',
    icon: '✨',
    changes: { happiness: 12 },
  },
  {
    message: 'Your pet got a little hungry.',
    icon: '🥨',
    changes: { hunger: 10 },
  },
  {
    message: 'A cozy breeze restored some energy.',
    icon: '🍃',
    changes: { energy: 8 },
  },
]

const moodDetails: Record<
  PetMood,
  { face: string; label: string; status: string; message: string }
> = {
  happy: {
    face: '😄',
    label: 'Happy',
    status: "I'm happy",
    message: 'Life is pawsome!',
  },
  tired: {
    face: '😴',
    label: 'Sleepy',
    status: "I'm sleepy",
    message: 'A little nap sounds perfect...',
  },
  hungry: {
    face: '😋',
    label: 'Hungry',
    status: "I'm hungry",
    message: 'My tummy is rumbling!',
  },
  normal: {
    face: '😊',
    label: 'Content',
    status: "I'm feeling good",
    message: 'What should we do next?',
  },
}

const clamp = (value: number) => Math.min(100, Math.max(0, value))
const getXpForNextLevel = (level: number) => 40 + (level - 1) * 15
const roundStat = (value: number) => Math.round(value * 100) / 100
const padDatePart = (value: number) => String(value).padStart(2, '0')

const getLocalDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`

const getPreviousLocalDateKey = (date = new Date()) => {
  const previousDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - 1,
  )

  return getLocalDateKey(previousDate)
}

const formatJournalTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`
}

const updateDailyCareForVisit = (
  dailyCare: DailyCareState,
  visitDate = new Date(),
): DailyCareState => {
  const today = getLocalDateKey(visitDate)

  if (dailyCare.lastCareDate === today) {
    return dailyCare
  }

  const continuedStreak =
    dailyCare.lastCareDate === getPreviousLocalDateKey(visitDate)

  return {
    ...dailyCare,
    careStreak: continuedStreak ? Math.max(1, dailyCare.careStreak) + 1 : 1,
    lastCareDate: today,
  }
}

const getDailyRewardXp = (careStreak: number) => {
  if (careStreak >= 7) {
    return 40
  }

  if (careStreak >= 4) {
    return 25
  }

  if (careStreak === 3) {
    return 20
  }

  if (careStreak === 2) {
    return 15
  }

  return 10
}

const applyTimeChanges = (stats: PetStats, elapsedSteps: number): PetStats => ({
  hunger: clamp(roundStat(stats.hunger + elapsedSteps)),
  energy: clamp(roundStat(stats.energy - elapsedSteps)),
  happiness: clamp(roundStat(stats.happiness - elapsedSteps)),
})

const loadPetName = () => {
  try {
    const savedName = localStorage.getItem(NAME_STORAGE_KEY)?.trim()
    return savedName ? savedName.slice(0, 18) : DEFAULT_PET_NAME
  } catch {
    return DEFAULT_PET_NAME
  }
}

const loadCustomization = (): PetCustomization => {
  try {
    const savedCustomization = localStorage.getItem(CUSTOMIZATION_STORAGE_KEY)

    if (!savedCustomization) {
      return INITIAL_CUSTOMIZATION
    }

    const parsed = JSON.parse(savedCustomization) as Partial<PetCustomization>
    const validTypes: PetType[] = ['cat', 'dog', 'blob']
    const validColors: PetColor[] = ['purple', 'peach', 'mint', 'blue']
    const validAccessories: PetAccessory[] = [
      'none',
      'hat',
      'bow',
      'glasses',
    ]

    return {
      type:
        parsed.type && validTypes.includes(parsed.type)
          ? parsed.type
          : INITIAL_CUSTOMIZATION.type,
      color:
        parsed.color && validColors.includes(parsed.color)
          ? parsed.color
          : INITIAL_CUSTOMIZATION.color,
      accessory:
        parsed.accessory && validAccessories.includes(parsed.accessory)
          ? parsed.accessory
          : INITIAL_CUSTOMIZATION.accessory,
    }
  } catch {
    return INITIAL_CUSTOMIZATION
  }
}

const loadDailyCare = (): DailyCareState => {
  try {
    const savedDailyCare = localStorage.getItem(DAILY_CARE_STORAGE_KEY)

    if (!savedDailyCare) {
      return updateDailyCareForVisit(INITIAL_DAILY_CARE)
    }

    const parsed = JSON.parse(savedDailyCare) as Partial<DailyCareState>
    const savedState: DailyCareState = {
      careStreak:
        typeof parsed.careStreak === 'number' &&
        Number.isFinite(parsed.careStreak)
          ? Math.max(0, Math.floor(parsed.careStreak))
          : 0,
      lastCareDate:
        typeof parsed.lastCareDate === 'string' ? parsed.lastCareDate : null,
      dailyRewardClaimedDate:
        typeof parsed.dailyRewardClaimedDate === 'string'
          ? parsed.dailyRewardClaimedDate
          : null,
    }

    return updateDailyCareForVisit(savedState)
  } catch {
    return updateDailyCareForVisit(INITIAL_DAILY_CARE)
  }
}

const loadJournalEntries = (): JournalEntry[] => {
  try {
    const savedEntries = localStorage.getItem(JOURNAL_STORAGE_KEY)

    if (!savedEntries) {
      return []
    }

    const parsedEntries: unknown = JSON.parse(savedEntries)

    if (!Array.isArray(parsedEntries)) {
      return []
    }

    const validTypes: JournalEntryType[] = [
      'care',
      'mood',
      'reward',
      'random',
      'system',
    ]

    return parsedEntries
      .filter((entry): entry is JournalEntry => {
        if (!entry || typeof entry !== 'object') {
          return false
        }

        const candidate = entry as Partial<JournalEntry>
        return (
          typeof candidate.id === 'string' &&
          typeof candidate.timestamp === 'number' &&
          Number.isFinite(candidate.timestamp) &&
          typeof candidate.message === 'string' &&
          candidate.type !== undefined &&
          validTypes.includes(candidate.type)
        )
      })
      .sort((first, second) => second.timestamp - first.timestamp)
      .slice(0, JOURNAL_STORAGE_LIMIT)
  } catch {
    return []
  }
}

const loadDreamAlbum = (): string[] => {
  try {
    const savedDreamIds = localStorage.getItem(DREAM_ALBUM_STORAGE_KEY)

    if (!savedDreamIds) {
      return []
    }

    const parsedDreamIds: unknown = JSON.parse(savedDreamIds)
    const validDreamIds = new Set(dreamCards.map((dream) => dream.id))

    if (!Array.isArray(parsedDreamIds)) {
      return []
    }

    return parsedDreamIds.filter(
      (dreamId, index): dreamId is string =>
        typeof dreamId === 'string' &&
        validDreamIds.has(dreamId) &&
        parsedDreamIds.indexOf(dreamId) === index,
    )
  } catch {
    return []
  }
}

const isPetStats = (value: unknown): value is PetStats => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<PetStats>
  return (
    typeof candidate.hunger === 'number' &&
    typeof candidate.energy === 'number' &&
    typeof candidate.happiness === 'number'
  )
}

const loadStats = (): PetStats => {
  try {
    const savedStats = localStorage.getItem(STORAGE_KEY)

    if (!savedStats) {
      return INITIAL_STATS
    }

    const parsedStats: unknown = JSON.parse(savedStats)

    if (!isPetStats(parsedStats)) {
      return INITIAL_STATS
    }

    return {
      hunger: clamp(parsedStats.hunger),
      energy: clamp(parsedStats.energy),
      happiness: clamp(parsedStats.happiness),
    }
  } catch {
    return INITIAL_STATS
  }
}

const loadTimedStats = (): TimedStatsSnapshot => {
  const stats = loadStats()
  const now = Date.now()

  try {
    const savedLastUpdated = Number(
      localStorage.getItem(LAST_UPDATED_STORAGE_KEY),
    )

    if (!Number.isFinite(savedLastUpdated) || savedLastUpdated <= 0) {
      return {
        stats,
        lastUpdated: now,
        warning: null,
      }
    }

    const elapsedSteps = Math.min(
      MAX_OFFLINE_STEPS,
      Math.max(0, Math.floor((now - savedLastUpdated) / TIME_STEP_MS)),
    )
    const updatedStats =
      elapsedSteps > 0 ? applyTimeChanges(stats, elapsedSteps) : stats

    return {
      stats: updatedStats,
      lastUpdated: now,
      warning:
        elapsedSteps > 0 && updatedStats.hunger >= STRONG_HUNGER_THRESHOLD
          ? 'hungry'
          : elapsedSteps > 0 && updatedStats.energy <= LOW_ENERGY_THRESHOLD
            ? 'tired'
            : null,
    }
  } catch {
    return {
      stats,
      lastUpdated: now,
      warning: null,
    }
  }
}

const loadProgression = (): PetProgression => {
  try {
    const savedProgression = localStorage.getItem(PROGRESSION_STORAGE_KEY)

    if (!savedProgression) {
      return INITIAL_PROGRESSION
    }

    const parsedProgression = JSON.parse(savedProgression) as Partial<
      PetProgression & { progress: number }
    >

    if (typeof parsedProgression.level !== 'number') {
      return INITIAL_PROGRESSION
    }

    const level = Math.max(1, Math.floor(parsedProgression.level))
    const xpNeeded = getXpForNextLevel(level)
    const savedXp =
      typeof parsedProgression.xp === 'number'
        ? parsedProgression.xp
        : typeof parsedProgression.progress === 'number'
          ? (parsedProgression.progress / LEGACY_ACTIONS_PER_LEVEL) * xpNeeded
          : 0

    return {
      level,
      xp: Math.min(xpNeeded - 1, Math.max(0, Math.floor(savedXp))),
    }
  } catch {
    return INITIAL_PROGRESSION
  }
}

const getMood = ({ hunger, energy, happiness }: PetStats): PetMood => {
  if (hunger >= 75) {
    return 'hungry'
  }

  if (energy <= 25) {
    return 'tired'
  }

  if (happiness >= 70) {
    return 'happy'
  }

  return 'normal'
}

type StatBarProps = {
  label: string
  value: number
  icon: string
  tone: 'hunger' | 'energy' | 'happiness'
}

function StatBar({ label, value, icon, tone }: StatBarProps) {
  const displayValue = Math.round(value)

  return (
    <div className="stat">
      <div className="stat__header">
        <span>
          <span aria-hidden="true">{icon}</span> {label}
        </span>
        <strong>{displayValue}</strong>
      </div>
      <div
        className="stat__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={displayValue}
      >
        <div
          className={`stat__fill stat__fill--${tone}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function App() {
  const [timedSnapshot] = useState<TimedStatsSnapshot>(loadTimedStats)
  const [stats, setStats] = useState<PetStats>(timedSnapshot.stats)
  const [progression, setProgression] =
    useState<PetProgression>(loadProgression)
  const [petName, setPetName] = useState(loadPetName)
  const [nameDraft, setNameDraft] = useState(petName)
  const [customization, setCustomization] =
    useState<PetCustomization>(loadCustomization)
  const [dailyCare, setDailyCare] = useState<DailyCareState>(loadDailyCare)
  const [currentDate, setCurrentDate] = useState(getLocalDateKey)
  const [dailyRewardMessage, setDailyRewardMessage] = useState<string | null>(
    null,
  )
  const [journalEntries, setJournalEntries] =
    useState<JournalEntry[]>(loadJournalEntries)
  const [discoveredDreamIds, setDiscoveredDreamIds] =
    useState<string[]>(loadDreamAlbum)
  const [isDreaming, setIsDreaming] = useState(false)
  const [activeDream, setActiveDream] = useState<DreamCard | null>(null)
  const [dreamMessage, setDreamMessage] = useState<string | null>(null)
  const [actionAnimation, setActionAnimation] =
    useState<ActionAnimation>(null)
  const [actionAnimationRun, setActionAnimationRun] = useState(0)
  const [activeEvent, setActiveEvent] = useState<ActivePetEvent | null>(null)
  const [careWarning, setCareWarning] = useState<CareWarning | null>(
    timedSnapshot.warning,
  )
  const [showLevelUp, setShowLevelUp] = useState(false)
  const previousLevel = useRef(progression.level)
  const lastUpdatedRef = useRef(timedSnapshot.lastUpdated)
  const currentDateRef = useRef(currentDate)
  const dreamSequenceTimerRef = useRef<number | null>(null)
  const actionAnimationTimerRef = useRef<number | null>(null)
  const previousCriticalState = useRef({
    hungry: stats.hunger >= STRONG_HUNGER_THRESHOLD,
    tired: stats.energy <= LOW_ENERGY_THRESHOLD,
  })
  const mood = getMood(stats)
  const moodInfo = moodDetails[mood]
  const isPlayDisabled = stats.energy < 15
  const xpNeeded = getXpForNextLevel(progression.level)
  const progressPercent = (progression.xp / xpNeeded) * 100
  const dailyRewardXp = getDailyRewardXp(dailyCare.careStreak)
  const isDailyRewardClaimed =
    dailyCare.dailyRewardClaimedDate === currentDate
  const visibleJournalEntries = journalEntries.slice(0, JOURNAL_DISPLAY_LIMIT)
  const discoveredDreams = discoveredDreamIds
    .map((dreamId) => dreamCards.find((dream) => dream.id === dreamId))
    .filter((dream): dream is DreamCard => Boolean(dream))

  const addJournalEntry = (message: string, type: JournalEntryType) => {
    const timestamp = Date.now()

    setJournalEntries((current) =>
      [
        {
          id: `${timestamp}-${Math.random().toString(36).slice(2, 9)}`,
          timestamp,
          message,
          type,
        },
        ...current,
      ].slice(0, JOURNAL_STORAGE_LIMIT),
    )
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
    const now = Date.now()
    lastUpdatedRef.current = now
    localStorage.setItem(LAST_UPDATED_STORAGE_KEY, String(now))
  }, [stats])

  useEffect(() => {
    const applyElapsedChanges = () => {
      const now = Date.now()
      const elapsedSteps = Math.min(
        MAX_OFFLINE_STEPS,
        Math.floor((now - lastUpdatedRef.current) / TIME_STEP_MS),
      )

      if (elapsedSteps < 1) {
        return
      }

      lastUpdatedRef.current = now
      setStats((current) => applyTimeChanges(current, elapsedSteps))
    }

    const interval = window.setInterval(applyElapsedChanges, TIME_STEP_MS)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        applyElapsedChanges()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(NAME_STORAGE_KEY, petName)
  }, [petName])

  useEffect(() => {
    localStorage.setItem(
      CUSTOMIZATION_STORAGE_KEY,
      JSON.stringify(customization),
    )
  }, [customization])

  useEffect(() => {
    localStorage.setItem(
      PROGRESSION_STORAGE_KEY,
      JSON.stringify(progression),
    )
  }, [progression])

  useEffect(() => {
    localStorage.setItem(DAILY_CARE_STORAGE_KEY, JSON.stringify(dailyCare))
  }, [dailyCare])

  useEffect(() => {
    localStorage.setItem(
      JOURNAL_STORAGE_KEY,
      JSON.stringify(journalEntries),
    )
  }, [journalEntries])

  useEffect(() => {
    localStorage.setItem(
      DREAM_ALBUM_STORAGE_KEY,
      JSON.stringify(discoveredDreamIds),
    )
  }, [discoveredDreamIds])

  useEffect(
    () => () => {
      if (dreamSequenceTimerRef.current !== null) {
        window.clearTimeout(dreamSequenceTimerRef.current)
      }

      if (actionAnimationTimerRef.current !== null) {
        window.clearTimeout(actionAnimationTimerRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    const refreshLocalDate = () => {
      const now = new Date()
      const nextDate = getLocalDateKey(now)

      if (nextDate === currentDateRef.current) {
        return
      }

      currentDateRef.current = nextDate
      setCurrentDate(nextDate)
      setDailyCare((current) => updateDailyCareForVisit(current, now))
      setDailyRewardMessage(null)
    }

    const interval = window.setInterval(refreshLocalDate, TIME_STEP_MS)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshLocalDate()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (progression.level <= previousLevel.current) {
      previousLevel.current = progression.level
      return
    }

    previousLevel.current = progression.level
    setShowLevelUp(true)
    addJournalEntry(
      `${petName} reached level ${progression.level}!`,
      'mood',
    )

    const timer = window.setTimeout(() => {
      setShowLevelUp(false)
    }, 1800)

    return () => window.clearTimeout(timer)
  }, [progression.level])

  useEffect(() => {
    const isHungry = stats.hunger >= STRONG_HUNGER_THRESHOLD
    const isTired = stats.energy <= LOW_ENERGY_THRESHOLD

    if (isHungry && !previousCriticalState.current.hungry) {
      setCareWarning('hungry')
    } else if (isTired && !previousCriticalState.current.tired) {
      setCareWarning('tired')
    }

    previousCriticalState.current = {
      hungry: isHungry,
      tired: isTired,
    }
  }, [stats.energy, stats.hunger])

  useEffect(() => {
    if (!careWarning) {
      return
    }

    const timer = window.setTimeout(() => {
      setCareWarning(null)
    }, 4200)

    return () => window.clearTimeout(timer)
  }, [careWarning])

  useEffect(() => {
    if (!dailyRewardMessage) {
      return
    }

    const timer = window.setTimeout(() => {
      setDailyRewardMessage(null)
    }, 3200)

    return () => window.clearTimeout(timer)
  }, [dailyRewardMessage])

  const gainXp = (amount: number) => {
    setProgression((current) => {
      let nextLevel = current.level
      let nextXp = current.xp + amount
      let xpForNextLevel = getXpForNextLevel(nextLevel)

      while (nextXp >= xpForNextLevel) {
        nextXp -= xpForNextLevel
        nextLevel += 1
        xpForNextLevel = getXpForNextLevel(nextLevel)
      }

      return {
        level: nextLevel,
        xp: nextXp,
      }
    })
  }

  const tryRandomEvent = () => {
    if (Math.random() >= RANDOM_EVENT_CHANCE) {
      setActiveEvent(null)
      return
    }

    const event = randomEvents[Math.floor(Math.random() * randomEvents.length)]

    setStats((current) => ({
      hunger: clamp(current.hunger + (event.changes.hunger ?? 0)),
      energy: clamp(current.energy + (event.changes.energy ?? 0)),
      happiness: clamp(current.happiness + (event.changes.happiness ?? 0)),
    }))
    setActiveEvent({
      id: Date.now(),
      message: event.message,
      icon: event.icon,
    })
    addJournalEntry(event.message, 'random')
  }

  const savePetName = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextName = nameDraft.trim().slice(0, 18) || DEFAULT_PET_NAME
    setPetName(nextName)
    setNameDraft(nextName)
  }

  const updateCustomization = <Key extends keyof PetCustomization>(
    key: Key,
    value: PetCustomization[Key],
  ) => {
    setCustomization((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const startActionAnimation = (animation: Exclude<ActionAnimation, null>) => {
    if (actionAnimationTimerRef.current !== null) {
      window.clearTimeout(actionAnimationTimerRef.current)
    }

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const animationDuration = prefersReducedMotion
      ? REDUCED_MOTION_ACTION_DURATION_MS
      : ACTION_ANIMATION_DURATION_MS

    setActionAnimation(animation)
    setActionAnimationRun((current) => current + 1)

    actionAnimationTimerRef.current = window.setTimeout(() => {
      setActionAnimation(null)
      actionAnimationTimerRef.current = null
    }, animationDuration)
  }

  const feedPet = () => {
    if (stats.hunger <= 0) {
      return
    }

    setStats((current) => ({
      ...current,
      hunger: clamp(current.hunger - 25),
    }))
    gainXp(10)
    startActionAnimation('feed')
    addJournalEntry(`${petName} was fed.`, 'care')
    tryRandomEvent()
  }

  const playWithPet = () => {
    if (isPlayDisabled) {
      return
    }

    setStats((current) => ({
      ...current,
      energy: clamp(current.energy - 15),
      happiness: clamp(current.happiness + 20),
    }))
    gainXp(12)
    startActionAnimation('play')
    addJournalEntry(`${petName} played and feels happier.`, 'care')
    tryRandomEvent()
  }

  const applyDreamReward = (dream: DreamCard) => {
    const hasStatReward =
      dream.effect.hunger !== undefined ||
      dream.effect.energy !== undefined ||
      dream.effect.happiness !== undefined

    if (hasStatReward) {
      setStats((current) => ({
        hunger: clamp(current.hunger + (dream.effect.hunger ?? 0)),
        energy: clamp(current.energy + (dream.effect.energy ?? 0)),
        happiness: clamp(
          current.happiness + (dream.effect.happiness ?? 0),
        ),
      }))
    }

    if (dream.effect.xp) {
      gainXp(dream.effect.xp)
    }
  }

  const putPetToSleep = () => {
    if (isDreaming) {
      return
    }

    if (actionAnimationTimerRef.current !== null) {
      window.clearTimeout(actionAnimationTimerRef.current)
      actionAnimationTimerRef.current = null
    }
    setActionAnimation(null)

    const dream =
      Math.random() < DREAM_CHANCE
        ? dreamCards[Math.floor(Math.random() * dreamCards.length)]
        : null
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const sequenceDuration = prefersReducedMotion
      ? REDUCED_MOTION_DREAM_DURATION_MS
      : DREAM_SEQUENCE_DURATION_MS

    setActiveDream(null)
    setDreamMessage(null)
    setIsDreaming(true)

    setStats((current) => ({
      ...current,
      energy: clamp(current.energy + 30),
      happiness: clamp(current.happiness - 5),
    }))
    gainXp(8)
    addJournalEntry(`${petName} took a nap.`, 'care')
    tryRandomEvent()

    dreamSequenceTimerRef.current = window.setTimeout(() => {
      setIsDreaming(false)
      dreamSequenceTimerRef.current = null

      if (!dream) {
        setDreamMessage(`${petName} had a peaceful nap.`)
        return
      }

      applyDreamReward(dream)
      setDiscoveredDreamIds((current) =>
        current.includes(dream.id) ? current : [dream.id, ...current],
      )
      setActiveDream(dream)
      addJournalEntry(
        `${petName} dreamed about ${dream.title}.`,
        'mood',
      )
    }, sequenceDuration)
  }

  const claimDailyReward = () => {
    if (isDailyRewardClaimed) {
      return
    }

    gainXp(dailyRewardXp)
    setDailyCare((current) => ({
      ...current,
      dailyRewardClaimedDate: currentDate,
    }))
    setDailyRewardMessage(`Daily reward claimed: +${dailyRewardXp} XP!`)
    addJournalEntry(`${petName} received a daily reward.`, 'reward')
  }

  const clearJournal = () => {
    setJournalEntries([])
  }

  const resetPet = () => {
    if (dreamSequenceTimerRef.current !== null) {
      window.clearTimeout(dreamSequenceTimerRef.current)
      dreamSequenceTimerRef.current = null
    }

    if (actionAnimationTimerRef.current !== null) {
      window.clearTimeout(actionAnimationTimerRef.current)
      actionAnimationTimerRef.current = null
    }

    setStats({ ...INITIAL_STATS })
    setProgression({ ...INITIAL_PROGRESSION })
    setPetName(DEFAULT_PET_NAME)
    setNameDraft(DEFAULT_PET_NAME)
    setCustomization({ ...INITIAL_CUSTOMIZATION })
    const resetDate = new Date()
    const resetDateKey = getLocalDateKey(resetDate)
    currentDateRef.current = resetDateKey
    setCurrentDate(resetDateKey)
    setDailyCare(updateDailyCareForVisit(INITIAL_DAILY_CARE, resetDate))
    setDailyRewardMessage(null)
    setDiscoveredDreamIds([])
    setIsDreaming(false)
    setActiveDream(null)
    setDreamMessage(null)
    setActionAnimation(null)
    setActionAnimationRun(0)
    setActiveEvent(null)
    setCareWarning(null)
    lastUpdatedRef.current = Date.now()
    setShowLevelUp(false)
    addJournalEntry('A new pet journey started.', 'system')
  }

  return (
    <main className="game-shell">
      <section className="game-card" aria-labelledby="game-title">
        <header className="game-header">
          <div>
            <p className="eyebrow">Your pocket-sized friend</p>
            <h1 id="game-title">Tiny Pet</h1>
          </div>
          <button className="reset-button" type="button" onClick={resetPet}>
            Reset Pet
          </button>
        </header>

        <form className="pet-name-form" onSubmit={savePetName}>
          <label htmlFor="pet-name">Pet name</label>
          <div className="pet-name-form__controls">
            <input
              id="pet-name"
              value={nameDraft}
              maxLength={18}
              onChange={(event) => setNameDraft(event.target.value)}
              aria-label="Pet name"
            />
            <button type="submit">Save</button>
          </div>
        </form>

        <section className="customize-panel" aria-labelledby="customize-title">
          <div className="customize-panel__header">
            <div>
              <p>Make it yours</p>
              <h2 id="customize-title">Customize</h2>
            </div>
            <span aria-hidden="true">✨</span>
          </div>

          <div className="customize-grid">
            <fieldset className="customize-group">
              <legend>Pet type</legend>
              <div className="option-row option-row--types">
                {petTypes.map((petType) => (
                  <button
                    className="customize-option"
                    type="button"
                    key={petType.value}
                    aria-pressed={customization.type === petType.value}
                    onClick={() =>
                      updateCustomization('type', petType.value)
                    }
                  >
                    <span aria-hidden="true">{petType.icon}</span>
                    {petType.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="customize-group">
              <legend>Color</legend>
              <div className="option-row option-row--colors">
                {petColors.map((petColor) => (
                  <button
                    className={`color-option color-option--${petColor.value}`}
                    type="button"
                    key={petColor.value}
                    aria-label={petColor.label}
                    aria-pressed={customization.color === petColor.value}
                    title={petColor.label}
                    onClick={() =>
                      updateCustomization('color', petColor.value)
                    }
                  />
                ))}
              </div>
            </fieldset>

            <fieldset className="customize-group">
              <legend>Accessory</legend>
              <div className="option-row option-row--accessories">
                {petAccessories.map((accessory) => (
                  <button
                    className="accessory-option"
                    type="button"
                    key={accessory.value}
                    aria-label={accessory.label}
                    aria-pressed={
                      customization.accessory === accessory.value
                    }
                    title={accessory.label}
                    onClick={() =>
                      updateCustomization('accessory', accessory.value)
                    }
                  >
                    <span aria-hidden="true">{accessory.icon}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </section>

        <div
          className={`room${isDreaming ? ' room--dreaming' : ''}`}
          data-mood={mood}
        >
          {showLevelUp && (
            <div className="level-up-message" role="status">
              Level up!
            </div>
          )}

          {isDreaming && (
            <div className="dream-sequence" aria-live="polite">
              <span className="dream-star dream-star--one">✦</span>
              <span className="dream-star dream-star--two">★</span>
              <span className="dream-star dream-star--three">✧</span>
              <span className="dream-bubble dream-bubble--one" />
              <span className="dream-bubble dream-bubble--two" />
              <span className="dream-bubble dream-bubble--three" />
              <span className="dream-sequence__label">
                {petName} is dreaming...
              </span>
            </div>
          )}

          <span className="room__spark room__spark--one" aria-hidden="true">
            ✦
          </span>
          <span className="room__spark room__spark--two" aria-hidden="true">
            ✦
          </span>
          <span className="room__spark room__spark--three" aria-hidden="true">
            •
          </span>

          <div className="pet-wrap">
            <div className="pet-shadow" aria-hidden="true" />
            {isDreaming && (
              <span className="pet-zzz" aria-hidden="true">
                Zzz
              </span>
            )}
            {actionAnimation && (
              <div
                className={`action-feedback action-feedback--${actionAnimation}`}
                key={`${actionAnimation}-${actionAnimationRun}`}
                aria-live="polite"
              >
                {actionAnimation === 'feed' ? (
                  <>
                    <span className="action-feedback__item" aria-hidden="true">
                      {FEED_ANIMATION_EMOJI}
                    </span>
                    <span className="action-feedback__pop">Yum!</span>
                  </>
                ) : (
                  <>
                    <span className="action-feedback__item" aria-hidden="true">
                      {PLAY_ANIMATION_EMOJI}
                    </span>
                    <span className="action-sparkle action-sparkle--one" aria-hidden="true">
                      ✦
                    </span>
                    <span className="action-sparkle action-sparkle--two" aria-hidden="true">
                      ✨
                    </span>
                    <span className="action-sparkle action-sparkle--three" aria-hidden="true">
                      ★
                    </span>
                    <span className="action-feedback__pop">Fun!</span>
                  </>
                )}
              </div>
            )}
            <div
              key={`pet-action-${actionAnimationRun}`}
              className={`pet pet--${mood} pet-type--${customization.type} pet-color--${customization.color}${isDreaming ? ' pet--dreaming' : ''}${actionAnimation && !isDreaming ? ` pet--action-${actionAnimation}` : ''}`}
              role="img"
              aria-label={
                isDreaming
                  ? `${petName} is sleeping and dreaming`
                  : `${petName} is a ${customization.color} ${customization.type}, feeling ${moodInfo.label.toLowerCase()}`
              }
            >
              <div className="pet__ear pet__ear--left" />
              <div className="pet__ear pet__ear--right" />
              <div className="pet__body">
                <div className="pet__face">
                  {isDreaming ? '😴' : moodInfo.face}
                </div>
                <div className="pet__blush pet__blush--left" />
                <div className="pet__blush pet__blush--right" />
              </div>
              <div className="pet__foot pet__foot--left" />
              <div className="pet__foot pet__foot--right" />
              {customization.accessory !== 'none' && (
                <div
                  className={`pet-accessory pet-accessory--${customization.accessory}`}
                  aria-hidden="true"
                >
                  {customization.accessory === 'glasses' && (
                    <>
                      <span />
                      <span />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mood-copy" aria-live="polite">
            <div
              className="mood-copy__content"
              key={isDreaming ? 'dreaming' : mood}
            >
              <strong className="pet-display-name">{petName}</strong>
              <span className={`mood-badge mood-badge--${mood}`}>
                {isDreaming ? 'Dreaming' : moodInfo.label}
              </span>
              <p className="mood-copy__status">
                {isDreaming ? 'Sweet dreams...' : moodInfo.status}
              </p>
              <p className="mood-copy__message">{moodInfo.message}</p>
            </div>
          </div>
        </div>

        {activeDream && (
          <aside
            className={`dream-result-card dream-result-card--${activeDream.rarity}`}
            role="status"
          >
            <span className="dream-result-card__emoji" aria-hidden="true">
              {activeDream.emoji}
            </span>
            <div>
              <p className="dream-result-card__eyebrow">
                {activeDream.rarity} dream discovered
              </p>
              <h2>{activeDream.title}</h2>
              <p>{activeDream.description}</p>
              <strong>{activeDream.effectText}</strong>
            </div>
          </aside>
        )}

        {dreamMessage && (
          <p className="peaceful-nap-message" role="status">
            🌙 {dreamMessage}
          </p>
        )}

        {activeEvent && (
          <aside className="random-event" key={activeEvent.id} role="status">
            <span aria-hidden="true">{activeEvent.icon}</span>
            <p>{activeEvent.message}</p>
          </aside>
        )}

        {careWarning && (
          <aside
            className={`care-warning care-warning--${careWarning}`}
            role="status"
          >
            <span aria-hidden="true">
              {careWarning === 'hungry' ? '🍽️' : '💤'}
            </span>
            <p>
              {careWarning === 'hungry'
                ? `${petName} is getting very hungry!`
                : `${petName} is very tired and needs some rest.`}
            </p>
          </aside>
        )}

        <section className="stats-card" aria-labelledby="stats-title">
          <div className="stats-card__header">
            <div>
              <p>Pet dashboard</p>
              <h2 id="stats-title">{petName}&apos;s stats</h2>
            </div>
            <span className="level-chip">Level {progression.level}</span>
          </div>

          <div className="progression" aria-label="Pet level progress">
            <div className="progression__header">
              <span>XP to next level</span>
              <span>
                {progression.xp}/{xpNeeded} XP
              </span>
            </div>
            <div
              className="progression__track"
              role="progressbar"
              aria-label="XP progress to next level"
              aria-valuemin={0}
              aria-valuemax={xpNeeded}
              aria-valuenow={progression.xp}
            >
              <div
                className="progression__fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="stats-panel" aria-label="Pet stats">
            <StatBar
              label="Hunger"
              value={stats.hunger}
              icon="🍎"
              tone="hunger"
            />
            <StatBar
              label="Energy"
              value={stats.energy}
              icon="⚡"
              tone="energy"
            />
            <StatBar
              label="Happiness"
              value={stats.happiness}
              icon="♥"
              tone="happiness"
            />
          </div>
        </section>

        <section className="daily-care-card" aria-labelledby="daily-care-title">
          <div className="daily-care-card__icon" aria-hidden="true">
            🔥
          </div>
          <div className="daily-care-card__content">
            <div className="daily-care-card__heading">
              <div>
                <p>Come back tomorrow</p>
                <h2 id="daily-care-title">Daily Care</h2>
              </div>
              <span className="streak-badge">
                {dailyCare.careStreak} day
                {dailyCare.careStreak === 1 ? '' : 's'}
              </span>
            </div>

            <p className="daily-care-card__status">
              {isDailyRewardClaimed
                ? "Today's reward is claimed."
                : `Today's reward: +${dailyRewardXp} XP`}
            </p>

            <button
              className="daily-reward-button"
              type="button"
              disabled={isDailyRewardClaimed}
              onClick={claimDailyReward}
            >
              {isDailyRewardClaimed
                ? 'Reward Claimed'
                : 'Claim Daily Reward'}
            </button>

            {dailyRewardMessage && (
              <p className="daily-reward-message" role="status">
                {dailyRewardMessage}
              </p>
            )}
          </div>
        </section>

        <section className="actions" aria-label="Pet actions">
          <button className="action-button action-button--feed" onClick={feedPet}>
            <span className="action-button__icon" aria-hidden="true">
              🍪
            </span>
            <span>
              <strong>Feed</strong>
              <small>Hunger −25 · +10 XP</small>
            </span>
          </button>

          <button
            className="action-button action-button--play"
            onClick={playWithPet}
            disabled={isPlayDisabled}
            aria-describedby={isPlayDisabled ? 'play-disabled-hint' : undefined}
          >
            <span className="action-button__icon" aria-hidden="true">
              🧶
            </span>
            <span>
              <strong>Play</strong>
              <small id={isPlayDisabled ? 'play-disabled-hint' : undefined}>
                {isPlayDisabled
                  ? 'Too sleepy · needs 15 energy'
                  : 'Happy +20 · Energy −15 · +12 XP'}
              </small>
            </span>
          </button>

          <button
            className="action-button action-button--sleep"
            onClick={putPetToSleep}
            disabled={isDreaming}
          >
            <span className="action-button__icon" aria-hidden="true">
              🌙
            </span>
            <span>
              <strong>Sleep</strong>
              <small>
                {isDreaming
                  ? 'Dream sequence in progress...'
                  : 'Energy +30 · Happy −5 · +8 XP'}
              </small>
            </span>
          </button>
        </section>

        <section className="dream-album" aria-labelledby="dream-album-title">
          <div className="dream-album__header">
            <div>
              <p>Collected while sleeping</p>
              <h2 id="dream-album-title">Dream Album</h2>
            </div>
            <span>
              {discoveredDreams.length}/{dreamCards.length}
            </span>
          </div>

          {discoveredDreams.length === 0 ? (
            <p className="dream-album__empty">
              No dreams discovered yet.
            </p>
          ) : (
            <div className="dream-album__grid">
              {discoveredDreams.map((dream) => (
                <article
                  className={`dream-album-card dream-album-card--${dream.rarity}`}
                  key={dream.id}
                >
                  <span className="dream-album-card__emoji" aria-hidden="true">
                    {dream.emoji}
                  </span>
                  <div>
                    <span className="dream-album-card__rarity">
                      {dream.rarity}
                    </span>
                    <h3>{dream.title}</h3>
                    <p>{dream.description}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="journal-card" aria-labelledby="journal-title">
          <div className="journal-card__header">
            <div>
              <p>Little moments together</p>
              <h2 id="journal-title">Pet Mood Journal</h2>
            </div>
            <button
              className="clear-journal-button"
              type="button"
              onClick={clearJournal}
              disabled={journalEntries.length === 0}
            >
              Clear Journal
            </button>
          </div>

          {visibleJournalEntries.length === 0 ? (
            <p className="journal-empty">No journal entries yet.</p>
          ) : (
            <ol className="journal-list">
              {visibleJournalEntries.map((entry) => {
                const typeDetails = journalTypeDetails[entry.type]

                return (
                  <li className={`journal-entry journal-entry--${entry.type}`} key={entry.id}>
                    <span
                      className="journal-entry__icon"
                      aria-label={typeDetails.label}
                      role="img"
                    >
                      {typeDetails.icon}
                    </span>
                    <p>{entry.message}</p>
                    <time dateTime={new Date(entry.timestamp).toISOString()}>
                      {formatJournalTime(entry.timestamp)}
                    </time>
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
