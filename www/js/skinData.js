// skinData.js - pure data (no Three.js) so the server can use it too.
// RULE: a skin repaints the lower body, trim and roof pattern, but the roof and the belt stripe keep the game colour.
// Colour is how the player matches passengers to vehicles, so it must stay readable (see paintFor in look.js).
// obtain: 'free' | 'world' (free for finishing that world) | 'shop' (always in the shop) | 'set' (themed set: only buyable while it is in the shop, see themes.js)
import { setSkins, BUNDLE_ID } from './themes.js';
import { packSkins, packPassengerSkins, PACK_PAIRS } from './packs.js';
const P = BUNDLE_ID; // bundle id now lives in themes.js

export const VEHICLE_SKINS = [
  { id: 'v_classic', name: 'Classic',        rarity: 'common',    obtain: 'free', style: {} },
  { id: 'v_taxi',    name: 'Taxi',           rarity: 'common',    obtain: 'shop', coinPrice: 2000,  style: { topper: 'taxiSign', pattern: 'checker', accent: '#111111' } },
  { id: 'v_police',  name: 'Patrol',         rarity: 'rare',      obtain: 'shop', coinPrice: 4000,  style: { topper: 'lightBar', pattern: 'stripes', accent: '#ffffff' } },
  { id: 'v_racing',  name: 'Racer',          rarity: 'rare',      obtain: 'shop', coinPrice: 4000,  style: { topper: 'rocket', pattern: 'stripes', accent: '#ffffff', glossy: true } },
  { id: 'v_unicorn', name: 'Unicorn',        rarity: 'epic',      obtain: 'shop', coinPrice: 8000,  productId: P + '.skin.unicorn', price: '$2.99', style: { topper: 'horn', pattern: 'stars', accent: '#ffffff', glossy: true } },
  { id: 'v_gold',    name: 'Golden Ride',    rarity: 'legendary', obtain: 'shop', coinPrice: 15000, productId: P + '.skin.gold',    price: '$4.99', style: { topper: 'crown', metalness: 0.85, roughness: 0.25 } },
  // World rewards (free for finishing the world)
  { id: 'v_surf',    name: 'Surf Cruiser',   rarity: 'rare',      obtain: 'world', world: 0, style: { topper: 'surfboard' } },
  { id: 'v_safari',  name: 'Safari Truck',   rarity: 'rare',      obtain: 'world', world: 1, style: { topper: 'flag', pattern: 'zebra', accent: '#1b1b1b' } },
  { id: 'v_frost',   name: 'Frosty Plow',    rarity: 'rare',      obtain: 'world', world: 2, style: { topper: 'snowCap', glossy: true } },
  { id: 'v_neon',    name: 'Neon Rider',     rarity: 'epic',      obtain: 'world', world: 3, style: { topper: 'antenna', emissive: 0.6 } },
  { id: 'v_jungle',  name: 'Jungle Explorer', rarity: 'rare',     obtain: 'world', world: 4, style: { topper: 'flag', pattern: 'dots', accent: '#ffffff' } },
  { id: 'v_candy',   name: 'Candy Cruiser',  rarity: 'epic',      obtain: 'world', world: 5, style: { topper: 'lollipop', pattern: 'stripes', accent: '#ffffff', glossy: true } },
  { id: 'v_spooky',  name: 'Pumpkin Wagon',  rarity: 'epic',      obtain: 'world', world: 6, style: { topper: 'pumpkin' } },
  { id: 'v_sky',     name: 'Cloud Hopper',   rarity: 'epic',      obtain: 'world', world: 7, style: { topper: 'balloon', pattern: 'stars', accent: '#ffffff' } },
  { id: 'v_moon',    name: 'Moon Rover',     rarity: 'legendary', obtain: 'world', world: 8, style: { topper: 'rocket', metalness: 0.7, roughness: 0.3 } },
  ...setSkins('vehicle'),   // 22 themed vehicle skins (12 weekly + 4 seasons + 6 holidays)
  ...packSkins(),           // 12 extra buses that come with the four Season Packs
];

export const PASSENGER_SKINS = [
  { id: 'p_classic',    name: 'Classic',      rarity: 'common',    obtain: 'free', style: {} },
  { id: 'p_pirate',     name: 'Pirate',       rarity: 'common',    obtain: 'shop', coinPrice: 2000,  style: { accessory: 'pirate' } },
  { id: 'p_chef',       name: 'Chef',         rarity: 'common',    obtain: 'shop', coinPrice: 2000,  style: { accessory: 'chef' } },
  { id: 'p_party',      name: 'Party Animal', rarity: 'common',    obtain: 'shop', coinPrice: 2000,  style: { accessory: 'party' } },
  { id: 'p_cat',        name: 'Kitty',        rarity: 'rare',      obtain: 'shop', coinPrice: 4000,  style: { accessory: 'catEars' } },
  { id: 'p_ninja',      name: 'Ninja',        rarity: 'rare',      obtain: 'shop', coinPrice: 4000,  style: { accessory: 'ninja' } },
  { id: 'p_robot',      name: 'Robot',        rarity: 'epic',      obtain: 'shop', coinPrice: 8000,  productId: P + '.skin.robot', price: '$2.99', style: { accessory: 'robot' } },
  { id: 'p_royal',      name: 'Royal',        rarity: 'legendary', obtain: 'shop', coinPrice: 15000, productId: P + '.skin.royal', price: '$4.99', style: { accessory: 'crown' } },
  // World rewards
  { id: 'p_sunhat',     name: 'Beach Buddy',  rarity: 'rare', obtain: 'world', world: 0, style: { accessory: 'sunhat' } },
  { id: 'p_cowboy',     name: 'Cowpoke',      rarity: 'rare', obtain: 'world', world: 1, style: { accessory: 'cowboy' } },
  { id: 'p_beanie',     name: 'Snow Bunny',   rarity: 'rare', obtain: 'world', world: 2, style: { accessory: 'beanie' } },
  { id: 'p_headphones', name: 'DJ',           rarity: 'epic', obtain: 'world', world: 3, style: { accessory: 'headphones' } },
  { id: 'p_explorer',   name: 'Explorer',     rarity: 'rare', obtain: 'world', world: 4, style: { accessory: 'explorer' } },
  { id: 'p_icecream',   name: 'Sweet Tooth',  rarity: 'epic', obtain: 'world', world: 5, style: { accessory: 'icecream' } },
  { id: 'p_witch',      name: 'Little Witch', rarity: 'epic', obtain: 'world', world: 6, style: { accessory: 'witch' } },
  { id: 'p_pilot',      name: 'Pilot',        rarity: 'epic', obtain: 'world', world: 7, style: { accessory: 'pilot' } },
  { id: 'p_astronaut',  name: 'Astronaut',    rarity: 'legendary', obtain: 'world', world: 8, style: { accessory: 'astronaut' } },
  // Riders that match the shop buses (same prices)
  { id: 'p_taxi',       name: 'Cabbie',       rarity: 'common',    obtain: 'shop', coinPrice: 2000,  style: { accessory: 'cabbie' } },
  { id: 'p_police',     name: 'Officer',      rarity: 'rare',      obtain: 'shop', coinPrice: 4000,  style: { accessory: 'policeCap' } },
  { id: 'p_racer',      name: 'Racer',        rarity: 'rare',      obtain: 'shop', coinPrice: 4000,  style: { accessory: 'racerHelmet' } },
  { id: 'p_unicorn',    name: 'Unicorn Kid',  rarity: 'epic',      obtain: 'shop', coinPrice: 8000,  productId: P + '.skin.unicornrider', price: '$2.99', style: { accessory: 'unicornHorn' } },
  { id: 'p_golden',     name: 'Golden Star',  rarity: 'legendary', obtain: 'shop', coinPrice: 15000, productId: P + '.skin.goldrider', price: '$4.99', style: { accessory: 'goldCrown' } },
  ...setSkins('passenger'), // 22 matching themed passenger skins
  ...packPassengerSkins(),  // 12 riders that match the Season Pack buses
];

// Every bus skin and the rider skin that goes with it. Equipping a bus also equips its rider (if owned); a rider's outfit uses its bus's colours.
export const PASSENGER_FOR_VEHICLE = {
  v_classic: 'p_classic', v_taxi: 'p_taxi', v_police: 'p_police', v_racing: 'p_racer', v_unicorn: 'p_unicorn', v_gold: 'p_golden',
  v_surf: 'p_sunhat', v_safari: 'p_cowboy', v_frost: 'p_beanie', v_neon: 'p_headphones', v_jungle: 'p_explorer', v_candy: 'p_icecream', v_spooky: 'p_witch', v_sky: 'p_pilot', v_moon: 'p_astronaut',
  ...PACK_PAIRS,
};
VEHICLE_SKINS.filter((v) => v.setId).forEach((v) => { PASSENGER_FOR_VEHICLE[v.id] = 'p_set_' + v.setId; });
export const passengerFor = (vehicleId) => PASSENGER_FOR_VEHICLE[vehicleId] || null;
export const vehicleFor = (passengerId) => Object.keys(PASSENGER_FOR_VEHICLE).find((k) => PASSENGER_FOR_VEHICLE[k] === passengerId) || null;

export const ALL_SKINS = [...VEHICLE_SKINS, ...PASSENGER_SKINS];
export const skinById = (id) => ALL_SKINS.find((s) => s.id === id);
export const isOwned = (profile, id) => {
  const s = skinById(id);
  return !!s && (s.obtain === 'free' || (profile.ownedSkins || []).includes(id));
};
