import { TripType } from '../types/domain';

export interface SeedPropertyConfig {
  slug: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  starRating: number;
  totalRooms: number;
  description: string;
}

export const SEED_PROPERTIES: SeedPropertyConfig[] = [
  {
    slug: 'amsterdam-canal-house',
    name: 'Canal House Boutique Amsterdam',
    city: 'Amsterdam',
    country: 'Netherlands',
    countryCode: 'NL',
    starRating: 4,
    totalRooms: 48,
    description:
      '17th-century heritage canal house in the Jordaan district featuring designer interiors, courtyard breakfast, and personalized concierge service.',
  },
  {
    slug: 'barcelona-beach-resort',
    name: 'Sol Mar Beach Resort Barcelona',
    city: 'Barcelona',
    country: 'Spain',
    countryCode: 'ES',
    starRating: 5,
    totalRooms: 180,
    description:
      'Mediterranean beachfront resort with panoramic sea-view terraces, infinity pool, and Catalan gastronomy.',
  },
  {
    slug: 'berlin-business-hotel',
    name: 'Mitte Executive Hotel Berlin',
    city: 'Berlin',
    country: 'Germany',
    countryCode: 'DE',
    starRating: 4,
    totalRooms: 210,
    description:
      'Modern executive hotel near Friedrichstraße engineered for remote professionals, conferences, and urban explorers.',
  },
  {
    slug: 'zurich-alpine-lodge',
    name: 'Alpine View Lodge Zurich',
    city: 'Zurich',
    country: 'Switzerland',
    countryCode: 'CH',
    starRating: 5,
    totalRooms: 75,
    description:
      'Luxury sanctuary overlooking Lake Zurich and the Alps with thermal spa, soundproofed suites, and organic Swiss dining.',
  },
];

interface GuestCountryOption {
  code: string;
  name: string;
}

const GUEST_COUNTRIES: GuestCountryOption[] = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'US', name: 'United States' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'IT', name: 'Italy' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'SE', name: 'Sweden' },
  { code: 'BE', name: 'Belgium' },
  { code: 'IE', name: 'Ireland' },
  { code: 'AT', name: 'Austria' },
  { code: 'DK', name: 'Denmark' },
  { code: 'NO', name: 'Norway' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
];

const FIRST_NAMES = [
  'Emma',
  'Lukas',
  'Sofia',
  'Oliver',
  'Chloe',
  'Mateo',
  'Hannah',
  'Liam',
  'Elena',
  'Noah',
  'Amelie',
  'Julian',
  'Maya',
  'Henrik',
  'Isabella',
  'Thomas',
  'Clara',
  'David',
  'Freja',
  'Marcus',
  'Nora',
  'Daniel',
  'Camila',
  'Sebastian',
  'Aisha',
  'Kenji',
  'Charlotte',
  'Gabriel',
  'Zoe',
  'Jonas',
];

const LAST_INITIALS = [
  'B.',
  'M.',
  'K.',
  'S.',
  'V.',
  'R.',
  'L.',
  'T.',
  'H.',
  'P.',
  'W.',
  'D.',
  'C.',
  'G.',
  'N.',
];

interface TopicSnippetPool {
  positive: string[];
  negative: string[];
}

const TOPIC_SNIPPETS: Record<string, TopicSnippetPool> = {
  cleanliness: {
    positive: [
      'The room and bathroom were spotless every single day.',
      'Housekeeping kept everything immaculate with fresh towels daily.',
      'Super clean sheets and sparkling clean bathroom tiles.',
      'Hygiene standards were top-notch throughout the entire property.',
    ],
    negative: [
      'We noticed dust under the desk and a stain on the carpet.',
      'Housekeeping missed our room twice and the bathroom was not clean on arrival.',
      'There was a slight damp smell in the bathroom and dusty shelves.',
      'Found stained sheets on the first night before reception replaced them.',
    ],
  },
  staff: {
    positive: [
      'The staff at the front desk were genuinely friendly and helpful with dinner bookings.',
      'Warm welcome at reception and smooth check-in within two minutes.',
      'The concierge team went above and beyond to arrange our local transport.',
      'Every team member we met was polite, welcoming, and attentive.',
    ],
    negative: [
      'Check-in was frustratingly slow and the receptionist seemed dismissive.',
      'Front desk service felt cold and unhelpful when we asked about late checkout.',
      'One night manager was quite rude when we reported an issue.',
      'Reception ignored us while finishing paperwork during check-in.',
    ],
  },
  location: {
    positive: [
      'Perfect location within walking distance of restaurants, museums, and the metro.',
      'Central neighborhood with a stunning view right from our window.',
      'Unbeatable location right near the tram station and historic center.',
      'So convenient for exploring on foot, everything is walkable.',
    ],
    negative: [
      'The location is a bit far from the main attractions and requires a long walk.',
      'Situated on a busy corner that felt inconvenient at night.',
      'A little isolated from the central dining district.',
    ],
  },
  breakfast: {
    positive: [
      'Amazing breakfast buffet with fresh croissants, local cheeses, and excellent coffee.',
      'Delicious breakfast every morning with plenty of choice including vegan options.',
      'Loved the fresh fruit, made-to-order eggs, and rich espresso at breakfast.',
      'The morning meal in the breakfast room was a highlight of our stay.',
    ],
    negative: [
      'The breakfast room was overcrowded after 8:30 AM with empty trays and cold eggs.',
      'Overpriced breakfast with watery coffee and stale pastries.',
      'Poor breakfast selection for the price—ran out of croissants early.',
    ],
  },
  wifi: {
    positive: [
      'Fast wifi with a strong signal that handled my Zoom video calls effortlessly.',
      'Reliable wifi and high speed internet throughout the hotel.',
      'Flawless wifi connection for remote work and streaming in the evening.',
    ],
    negative: [
      'Slow wifi in our corner room—the signal kept disconnecting during video calls.',
      'Spotty internet connection that made remote work frustrating.',
      'Weak signal on the upper floor; had to work from the lobby to stay online.',
    ],
  },
  noise: {
    positive: [
      'Our room was soundproofed and super quiet—we slept like a baby with zero street noise.',
      'Very quiet and peaceful atmosphere despite being in a lively city.',
      'Double-glazed windows blocked everything; no noise from the corridor or street.',
    ],
    negative: [
      'Thin walls meant we could hear everything from the hallway and street noise until midnight.',
      'Quite noisy on Friday night due to street traffic and poor soundproofing.',
      'Loud corridor doors slamming early in the morning kept us awake.',
    ],
  },
  value: {
    positive: [
      'Great value for the quality—worth every penny for a special trip.',
      'Reasonable price given the facilities and central neighborhood.',
      'Good value compared to other hotels of this star rating nearby.',
    ],
    negative: [
      'Feels overpriced for what you get, especially with the extra charge for parking.',
      'Too expensive during peak weeks—not worth the high nightly rate.',
      'Poor value when you add the hidden fee for spa access and breakfast.',
    ],
  },
  room_comfort: {
    positive: [
      'The king bed had a comfortable mattress, plush pillows, and great shower water pressure.',
      'Spacious suite with cozy lighting and whisper-quiet air conditioning.',
      'Super comfy bed and a modern bathroom with a rain shower.',
    ],
    negative: [
      'It was a tiny room with a cramped layout and barely enough space for two suitcases.',
      'The air conditioning struggled to cool the room and the pillow was too firm.',
      'Small room size and weak water pressure in the shower.',
    ],
  },
};

const POSITIVE_TITLES = [
  'Exceptional stay—will definitely return!',
  'Memorable weekend getaway with outstanding hospitality',
  'Fantastic experience from check-in to checkout',
  'Wonderful hotel in an unbeatable spot',
  'Exceeded our expectations in almost every way',
  'Stylish, comfortable, and genuinely welcoming',
  'Great base for exploring the city',
];

const NEUTRAL_TITLES = [
  'Solid stay overall, though a few areas need attention',
  'Good hotel with minor drawbacks',
  'Pleasant visit but room for improvement',
  'Decent stay for a short trip',
  'Mixed experience—some highlights and some frustrations',
];

const NEGATIVE_TITLES = [
  'Disappointing stay given the price and rating',
  'Below expectations—would not book again',
  'Frustrating issues with comfort and service',
  'Needs better maintenance and attention to detail',
];

const OWNER_POSITIVE_RESPONSES = [
  'Thank you so much for your kind review! We are thrilled you enjoyed your stay and have shared your compliments with our entire team. We look forward to welcoming you back soon.',
  'We truly appreciate your wonderful feedback! Knowing that our team and facilities made your visit special means the world to us. Safe travels until next time!',
  'Thank you for choosing to stay with us and for taking the time to share your experience. We are delighted everything met your expectations!',
];

const OWNER_CONSTRUCTIVE_RESPONSES = [
  'Thank you for your candid feedback. We sincerely apologize for the shortfall you experienced and have addressed this directly with our housekeeping and engineering teams to ensure it does not recur.',
  'We appreciate you bringing these details to our attention. Guest comfort is our top priority, and we are upgrading our equipment and retraining staff on the points you raised.',
  'Thank you for staying with us and sharing this review. We regret that parts of your stay fell short of our standards and would love the opportunity to restore your confidence on a future visit.',
];

interface PropertyPersona {
  slug: string;
  baseScore: number;
  monthlyTrendDelta: number; // subtle score improvement/dip across the 18 months
  tripTypeWeights: Record<TripType, number>;
  roomTypes: string[];
  topicPositiveProb: Record<string, number>;
  topicMentionProb: Record<string, number>;
}

const PROPERTY_PERSONAS: Record<string, PropertyPersona> = {
  'amsterdam-canal-house': {
    slug: 'amsterdam-canal-house',
    baseScore: 8.6,
    monthlyTrendDelta: 0.02,
    tripTypeWeights: { couple: 0.44, solo: 0.2, friends: 0.18, family: 0.1, business: 0.08 },
    roomTypes: ['Canal View Deluxe', 'Jordaan Loft Suite', 'Heritage Cozy Double', 'Courtyard Queen'],
    topicMentionProb: {
      location: 0.65,
      staff: 0.6,
      breakfast: 0.45,
      room_comfort: 0.55,
      noise: 0.45,
      cleanliness: 0.5,
      wifi: 0.25,
      value: 0.35,
    },
    topicPositiveProb: {
      location: 0.94,
      staff: 0.91,
      breakfast: 0.85,
      cleanliness: 0.88,
      wifi: 0.78,
      value: 0.68,
      room_comfort: 0.48, // Historic canal building -> smaller rooms
      noise: 0.45, // Canal street noise
    },
  },
  'barcelona-beach-resort': {
    slug: 'barcelona-beach-resort',
    baseScore: 8.3,
    monthlyTrendDelta: 0.01,
    tripTypeWeights: { couple: 0.35, family: 0.32, friends: 0.2, solo: 0.08, business: 0.05 },
    roomTypes: ['Mediterranean Sea View Suite', 'Beachfront Balcony King', 'Family Terrace Room', 'Garden Twin'],
    topicMentionProb: {
      location: 0.7,
      breakfast: 0.55,
      room_comfort: 0.5,
      cleanliness: 0.5,
      staff: 0.48,
      noise: 0.42,
      value: 0.48,
      wifi: 0.28,
    },
    topicPositiveProb: {
      location: 0.95,
      breakfast: 0.86,
      room_comfort: 0.84,
      cleanliness: 0.82,
      staff: 0.78,
      wifi: 0.72,
      noise: 0.54,
      value: 0.46, // Peak season pricing complaints
    },
  },
  'berlin-business-hotel': {
    slug: 'berlin-business-hotel',
    baseScore: 8.1,
    monthlyTrendDelta: -0.01,
    tripTypeWeights: { business: 0.46, solo: 0.24, couple: 0.16, friends: 0.08, family: 0.06 },
    roomTypes: ['Executive Work Suite', 'Mitte Business King', 'Standard Soundproof Queen', 'Club Level Double'],
    topicMentionProb: {
      wifi: 0.68,
      cleanliness: 0.58,
      noise: 0.52,
      location: 0.5,
      staff: 0.55,
      breakfast: 0.52,
      value: 0.42,
      room_comfort: 0.45,
    },
    topicPositiveProb: {
      wifi: 0.93,
      cleanliness: 0.9,
      noise: 0.87,
      location: 0.85,
      value: 0.78,
      room_comfort: 0.76,
      staff: 0.52, // Colder corporate front desk
      breakfast: 0.48, // Crowded business breakfast hour
    },
  },
  'zurich-alpine-lodge': {
    slug: 'zurich-alpine-lodge',
    baseScore: 8.9,
    monthlyTrendDelta: 0.015,
    tripTypeWeights: { couple: 0.42, family: 0.24, business: 0.16, solo: 0.12, friends: 0.06 },
    roomTypes: ['Panoramic Alpine Suite', 'Lake View Chalet King', 'Thermal Spa Junior Suite', 'Forest Annex Double'],
    topicMentionProb: {
      cleanliness: 0.65,
      room_comfort: 0.62,
      staff: 0.58,
      noise: 0.5,
      location: 0.55,
      breakfast: 0.48,
      value: 0.56,
      wifi: 0.4,
    },
    topicPositiveProb: {
      cleanliness: 0.96,
      room_comfort: 0.94,
      staff: 0.93,
      noise: 0.95,
      location: 0.9,
      breakfast: 0.89,
      wifi: 0.55, // Mountain annex wifi blind spots
      value: 0.42, // Swiss luxury pricing critique
    },
  },
};

/**
 * Deterministic Mulberry32 PRNG so seed output is 100% reproducible across machines.
 */
function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickRandom<T>(arr: readonly T[], rng: () => number): T {
  const index = Math.floor(rng() * arr.length);
  const item = arr[index];
  if (item === undefined) {
    throw new Error('Cannot pick from empty array');
  }
  return item;
}

function pickWeightedTripType(weights: Record<TripType, number>, rng: () => number): TripType {
  const r = rng();
  let cumulative = 0;
  const entries = Object.entries(weights) as Array<[TripType, number]>;
  for (const [tripType, weight] of entries) {
    cumulative += weight;
    if (r <= cumulative) {
      return tripType;
    }
  }
  return 'couple';
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Generate ~620 realistic, diverse guest reviews spanning 18 months up to today.
 */
export function generateSeedReviews(referenceEndDate = new Date()): Record<string, unknown>[] {
  const rng = createSeededRng(20261120);
  const reviews: Record<string, unknown>[] = [];

  const endDate = new Date(
    Date.UTC(
      referenceEndDate.getUTCFullYear(),
      referenceEndDate.getUTCMonth(),
      referenceEndDate.getUTCDate()
    )
  );
  const totalDaysSpan = 540; // 18 months

  let globalCounter = 1;

  for (const property of SEED_PROPERTIES) {
    const persona = PROPERTY_PERSONAS[property.slug];
    if (!persona) continue;

    // 155 reviews per property -> 620 total reviews
    const reviewCountForProperty = 155;

    for (let i = 0; i < reviewCountForProperty; i++) {
      // Distribute across 540 days with slight bias toward more recent months
      const recencySkew = Math.pow(rng(), 0.88);
      const daysAgo = Math.floor(recencySkew * totalDaysSpan);
      const reviewDateObj = new Date(endDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const reviewDate = formatIsoDate(reviewDateObj);

      const monthsAgo = daysAgo / 30;
      const trendAdjustment = (18 - monthsAgo) * persona.monthlyTrendDelta;

      // Choose 2 to 4 topics to mention in this review
      const allTopicKeys = Object.keys(TOPIC_SNIPPETS);
      const chosenPositiveSnippets: string[] = [];
      const chosenNegativeSnippets: string[] = [];

      for (const topicKey of allTopicKeys) {
        const mentionProb = persona.topicMentionProb[topicKey] ?? 0.4;
        if (rng() < mentionProb) {
          const posProb = persona.topicPositiveProb[topicKey] ?? 0.75;
          const pool = TOPIC_SNIPPETS[topicKey];
          if (!pool) continue;

          if (rng() < posProb) {
            chosenPositiveSnippets.push(pickRandom(pool.positive, rng));
          } else {
            chosenNegativeSnippets.push(pickRandom(pool.negative, rng));
          }
        }
      }

      // Ensure at least one snippet exists
      if (chosenPositiveSnippets.length === 0 && chosenNegativeSnippets.length === 0) {
        const fallbackPool = TOPIC_SNIPPETS['location'];
        if (fallbackPool) {
          chosenPositiveSnippets.push(pickRandom(fallbackPool.positive, rng));
        }
      }

      // Compute a realistic 1.0 - 10.0 score correlated with positive vs negative topic balance
      const posCount = chosenPositiveSnippets.length;
      const negCount = chosenNegativeSnippets.length;
      const sentimentBalance = (posCount - negCount * 1.35) * 0.65;
      const jitter = (rng() - 0.5) * 1.2;

      let rawScore = persona.baseScore + trendAdjustment + sentimentBalance + jitter;
      // Inject occasional low-score outliers (~11% of reviews) so Flagged Reviews and histograms are rich
      if (rng() < 0.11 && negCount > 0) {
        rawScore = 3.8 + rng() * 2.0;
        if (chosenNegativeSnippets.length === 1) {
          const extraNegTopic = pickRandom(['cleanliness', 'staff', 'noise', 'wifi'], rng);
          const extraPool = TOPIC_SNIPPETS[extraNegTopic];
          if (extraPool) {
            chosenNegativeSnippets.push(pickRandom(extraPool.negative, rng));
          }
        }
      }

      const clampedScore = Math.min(10.0, Math.max(2.5, Math.round(rawScore * 10) / 10));

      const title =
        clampedScore >= 8.0
          ? pickRandom(POSITIVE_TITLES, rng)
          : clampedScore >= 6.0
            ? pickRandom(NEUTRAL_TITLES, rng)
            : pickRandom(NEGATIVE_TITLES, rng);

      const positiveComment =
        chosenPositiveSnippets.length > 0 ? chosenPositiveSnippets.slice(0, 3).join(' ') : null;
      const negativeComment =
        chosenNegativeSnippets.length > 0 ? chosenNegativeSnippets.slice(0, 2).join(' ') : null;

      const fullText = [title, positiveComment, negativeComment]
        .filter((part): part is string => Boolean(part && part.length > 0))
        .join(' ');

      const reviewerName = `${pickRandom(FIRST_NAMES, rng)} ${pickRandom(LAST_INITIALS, rng)}`;
      const guestCountry = pickRandom(GUEST_COUNTRIES, rng);
      const tripType = pickWeightedTripType(persona.tripTypeWeights, rng);
      const roomType = pickRandom(persona.roomTypes, rng);
      const stayNights = Math.max(1, Math.min(10, Math.floor(rng() * 5) + 1));

      // ~58% owner response rate (higher on very positive or negative reviews)
      const responseProb = clampedScore < 6.0 ? 0.72 : clampedScore >= 8.5 ? 0.62 : 0.48;
      let ownerResponse: string | null = null;
      let ownerRespondedAt: string | null = null;

      if (rng() < responseProb) {
        ownerResponse =
          clampedScore >= 7.5
            ? pickRandom(OWNER_POSITIVE_RESPONSES, rng)
            : pickRandom(OWNER_CONSTRUCTIVE_RESPONSES, rng);
        const responseDelayDays = Math.floor(rng() * 4) + 1;
        const respondedDate = new Date(
          reviewDateObj.getTime() + responseDelayDays * 24 * 60 * 60 * 1000
        );
        ownerRespondedAt = respondedDate.toISOString();
      }

      // Mark ~30% of older low-scoring reviews as already resolved so both states appear
      const isOlderLowScore = clampedScore < 6.0 && daysAgo > 45;
      const isResolved = isOlderLowScore && rng() < 0.35;
      const resolvedNotes = isResolved
        ? 'Contacted guest with service recovery voucher and verified room maintenance check.'
        : null;

      const externalId = `SEED-${property.countryCode}-${String(globalCounter).padStart(4, '0')}`;
      globalCounter++;

      reviews.push({
        property_slug: property.slug,
        external_id: externalId,
        reviewer_name: reviewerName,
        guest_country_code: guestCountry.code,
        guest_country_name: guestCountry.name,
        trip_type: tripType,
        room_type: roomType,
        stay_nights: stayNights,
        score: clampedScore,
        title,
        positive_comment: positiveComment,
        negative_comment: negativeComment,
        full_text: fullText,
        review_date: reviewDate,
        owner_response: ownerResponse,
        owner_responded_at: ownerRespondedAt,
        is_resolved: isResolved,
        resolved_notes: resolvedNotes,
      });
    }
  }

  return reviews;
}
