// SAMPLE DATA — design preview only.
// Photos are licensed Unsplash portraits; every name and story below is fictional.
// Replace with responses from the real backend via src/api.ts.

export type Person = {
  id: string
  name: string
  age: number
  photo: string
  city: string
  lastSeenPlace: string
  lastSeenDate: string // ISO
  wearing: string
  height: string
  from: string // who is searching, e.g. "Her mother, Sunita"
  letter: string
  traits: string[]
  status: 'missing' | 'found'
  sightings: number
}

const u = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop&crop=faces`

export const people: Person[] = [
  {
    id: 'meera',
    name: 'Meera Kapoor',
    age: 22,
    photo: u('1725033489648-a819750348eb'),
    city: 'Mumbai',
    lastSeenPlace: 'Dadar station, western line platform',
    lastSeenDate: '2023-03-14T18:40:00',
    wearing: 'Red kurta, light denim jacket, black backpack',
    height: '5\'4"',
    from: 'Her mother, Sunita',
    letter:
      'I still keep your chai cup on the window ledge. It has a chip in it now. I will not replace it until you are home to complain about it.',
    traits: ['Small scar above left eyebrow', 'Hums when nervous', 'Loves marigolds'],
    status: 'missing',
    sightings: 14,
  },
  {
    id: 'rahim',
    name: 'Rahim Qureshi',
    age: 67,
    photo: u('1531339413195-cc6c17163974'),
    city: 'Delhi',
    lastSeenPlace: 'Near Jama Masjid, Old Delhi',
    lastSeenDate: '2025-11-02T07:15:00',
    wearing: 'White kurta, checked gamcha on shoulder, rubber chappals',
    height: '5\'7"',
    from: 'His son, Imran',
    letter:
      'Abbu, you always found your way back from anywhere — Chandni Chowk, the Yamuna ghats, every gali of this city. Let us find you this time.',
    traits: ['Early-stage dementia', 'Answers to "Chacha"', 'Walks with a slight limp'],
    status: 'missing',
    sightings: 31,
  },
  {
    id: 'anaya',
    name: 'Anaya Sharma',
    age: 7,
    photo: u('1765181120027-5d3f8e774bca'),
    city: 'Mumbai',
    lastSeenPlace: 'Ganesh Visarjan crowd, Girgaon Chowpatty',
    lastSeenDate: '2024-09-17T19:05:00',
    wearing: 'Maroon frock, silver anklets, red hair ribbon',
    height: '3\'10"',
    from: 'Her parents, Rajesh & Kavita',
    letter:
      'Your red ribbon is still on the mirror, exactly where you leave it every night. Your bed is made. The night lamp is on. It stays on, beta.',
    traits: ['Gap between front teeth', 'Calls every dog "Moti"', 'Knows her father’s number by heart'],
    status: 'missing',
    sightings: 52,
  },
  {
    id: 'arjun',
    name: 'Arjun Nair',
    age: 29,
    photo: u('1724225618359-a1d2763326f9'),
    city: 'Bengaluru',
    lastSeenPlace: 'Majestic bus stand, platform 18',
    lastSeenDate: '2024-01-09T22:30:00',
    wearing: 'Grey t-shirt, black jeans, small stud in left ear',
    height: '5\'11"',
    from: 'His sister, Anjali',
    letter:
      'You still owe me a rematch at carrom. I have been practising every night so I can beat you properly. Come back and lose, chetta. Please.',
    traits: ['Laughs before the punchline', 'Mole near right eye'],
    status: 'missing',
    sightings: 9,
  },
  {
    id: 'rohan',
    name: 'Rohan Verma',
    age: 17,
    photo: u('1568316280532-71d1baad0986'),
    city: 'Kota',
    lastSeenPlace: 'Outside his coaching hostel, Talwandi',
    lastSeenDate: '2025-02-09T21:10:00',
    wearing: 'Black hoodie, grey track pants, earphones',
    height: '5\'8"',
    from: 'His father, Sanjay',
    letter:
      'You are not in trouble. The exam does not matter. The rank does not matter. Nothing matters except you. Just come home, beta.',
    traits: ['Draws on his hands', 'Left-handed', 'Spiky hair'],
    status: 'missing',
    sightings: 6,
  },
  {
    id: 'priya',
    name: 'Priya Iyer',
    age: 26,
    photo: u('1789500381106-ba13068a6520'),
    city: 'Kasol',
    lastSeenPlace: 'Kheerganga trail, near Barshaini',
    lastSeenDate: '2024-10-18T08:00:00',
    wearing: 'Red patterned sweater, olive rain jacket, trekking shoes',
    height: '5\'3"',
    from: 'Her father, Venkatesh',
    letter:
      'I walk up the trail every month now. I call your name at the bend where the valley opens, because I know you would have stopped there for a photo.',
    traits: ['Dimple on left cheek', 'Always carries a small camera', 'Speaks Tamil, Hindi, English'],
    status: 'missing',
    sightings: 3,
  },
  {
    id: 'fatima',
    name: 'Fatima Sheikh',
    age: 34,
    photo: u('1516239482977-b550ba7253f2'),
    city: 'Hyderabad',
    lastSeenPlace: 'Charminar, Laad Bazaar side',
    lastSeenDate: '2023-09-27T17:45:00',
    wearing: 'Dark printed dupatta over head, green salwar',
    height: '5\'5"',
    from: 'Her husband, Salim',
    letter:
      'Zoya asked if Ammi will be back for her birthday. I said yes. Please don’t make me a liar. She has saved you the biggest piece of cake.',
    traits: ['Thick eyebrows', 'Mole on right cheek', 'Henna on both hands'],
    status: 'missing',
    sightings: 11,
  },
  {
    id: 'aman',
    name: 'Aman Gill',
    age: 19,
    photo: u('1712425718137-491250cfde88'),
    city: 'Chandigarh',
    lastSeenPlace: 'Sector 17 plaza, near the fountain',
    lastSeenDate: '2025-06-01T01:20:00',
    wearing: 'White turtleneck, blue jeans',
    height: '5\'10"',
    from: 'His best friend, Jaskaran',
    letter:
      'The band is still waiting on your dhol. We cancelled every show. Nobody else gets your seat, paaji.',
    traits: ['Wavy hair to the collar', 'Silver kada on right wrist'],
    status: 'missing',
    sightings: 4,
  },
  {
    id: 'sneha',
    name: 'Sneha Patil',
    age: 23,
    photo: u('1706943262459-3ef6ce03305c'),
    city: 'Pune',
    lastSeenPlace: 'FC Road, near Goodluck Café',
    lastSeenDate: '2024-05-03T19:00:00',
    wearing: 'Teal top, gold hoop earrings',
    height: '5\'4"',
    from: 'Her aaji, Shalini',
    letter: 'I make your puran poli every Sunday. The whole wada smells of it. Follow it home, bala.',
    traits: ['Long hair, usually in a braid', 'Small hoop earrings'],
    status: 'missing',
    sightings: 7,
  },
  {
    id: 'kamala',
    name: 'Kamala Devi',
    age: 71,
    photo: u('1560885673-4e2f056f6e2a'),
    city: 'Prayagraj',
    lastSeenPlace: 'Sangam ghat, Kumbh Mela, sector 4',
    lastSeenDate: '2025-01-29T05:30:00',
    wearing: 'Pink floral saree, lavender blouse, spectacles',
    height: '5\'0"',
    from: 'Her grandson, Ankit',
    letter: 'Dadi, I still hear you singing bhajans in the morning. The tulsi you planted is taller than me now. Come water it.',
    traits: ['Round spectacles', 'Speaks Bhojpuri', 'Carries a small black purse'],
    status: 'missing',
    sightings: 23,
  },
  {
    id: 'lakshmi',
    name: 'Lakshmi Menon',
    age: 27,
    photo: u('1725611224180-4a50ef13a0e8'),
    city: 'Kochi',
    lastSeenPlace: 'Ernakulam South railway station',
    lastSeenDate: '2024-12-24T23:10:00',
    wearing: 'Cream kurta, jasmine in her hair',
    height: '5\'3"',
    from: 'Her brother, Vishnu',
    letter: 'Onam came and went. We still laid your banana leaf at the table. Nobody sat there.',
    traits: ['Curly hair', 'Soft-spoken', 'Speaks Malayalam and English'],
    status: 'missing',
    sightings: 5,
  },
  {
    id: 'suresh',
    name: 'Suresh Yadav',
    age: 52,
    photo: u('1596633816484-10da10b748e4'),
    city: 'Varanasi',
    lastSeenPlace: 'Dashashwamedh Ghat, after the evening aarti',
    lastSeenDate: '2023-12-02T19:30:00',
    wearing: 'Brown shawl, white dhoti',
    height: '5\'8"',
    from: 'His daughter, Pooja',
    letter: 'Papa, I opened the shop every morning, just like you taught me. Your chair is still behind the counter.',
    traits: ['Grey beard', 'Long greying hair', 'Deep voice'],
    status: 'missing',
    sightings: 2,
  },
  {
    id: 'aarav',
    name: 'Aarav Kumar',
    age: 9,
    photo: u('1606386666595-d135abc1e3b2'),
    city: 'Delhi',
    lastSeenPlace: 'New Delhi railway station, Paharganj side',
    lastSeenDate: '2025-04-15T18:15:00',
    wearing: 'Green-and-blue sweater, school shoes',
    height: '4\'3"',
    from: 'His mother, Rekha',
    letter: 'Aaru, your cricket bat is still by the door. Your friends come every evening and ask for you. Come home, mera bachcha.',
    traits: ['Big eyes', 'Neat side-parted hair', 'Loves cricket'],
    status: 'missing',
    sightings: 18,
  },
  {
    id: 'savitri',
    name: 'Savitri Pawar',
    age: 61,
    photo: u('1511684344724-cda927f1ba0e'),
    city: 'Nashik',
    lastSeenPlace: 'Ramkund, Panchavati',
    lastSeenDate: '2024-03-30T09:00:00',
    wearing: 'Teal cotton saree, red bindi',
    height: '5\'1"',
    from: 'Her son, Ganesh',
    letter: 'Aai, I kept the lamp lit by the tulsi every evening. You will see it from the road.',
    traits: ['Red bindi', 'Grey hair in a bun', 'Speaks Marathi'],
    status: 'missing',
    sightings: 10,
  },
  {
    id: 'ramesh',
    name: 'Ramesh Patel',
    age: 74,
    photo: u('1661112952418-84a766daacf3'),
    city: 'Ahmedabad',
    lastSeenPlace: 'Kalupur railway station',
    lastSeenDate: '2025-07-19T22:00:00',
    wearing: 'Orange shirt, white vest, grey trousers',
    height: '5\'6"',
    from: 'His granddaughter, Hetal',
    letter: 'Dada, your morning newspaper still comes every day. I fold it and keep it on your chair. Come read it to me.',
    traits: ['Thick grey moustache', 'Hard of hearing', 'Speaks Gujarati'],
    status: 'missing',
    sightings: 6,
  },
]

export type Reunion = {
  id: string
  name: string
  photo: string
  daysApart: number
  city: string
  quote: string
  by: string
}

export const reunions: Reunion[] = [
  {
    id: 'nisha',
    name: 'Nisha Gupta',
    photo: u('1595754883593-e274aaa13580'),
    daysApart: 412,
    city: 'Indore',
    quote: 'A chaiwala at a bus stand recognised her from a shared poster. A chaiwala. We will never know his name.',
    by: 'Her brother, Rahul',
  },
  {
    id: 'bhola',
    name: 'Bhola Prasad',
    photo: u('1524081081171-7960da1de373'),
    daysApart: 1096,
    city: 'Gaya',
    quote: 'Three years. The first thing Babuji asked was whether Amma still sings in the kitchen. She does again.',
    by: 'His son, Manoj',
  },
  {
    id: 'sonu',
    name: 'Sonu Kumar',
    photo: u('1615868167768-6fe2e8eaacd8'),
    daysApart: 19,
    city: 'Howrah',
    quote: 'Nineteen days felt like nineteen years. A railway porter saw him, looked twice, and made one phone call.',
    by: 'His mother, Geeta',
  },
]

export const volunteerPhotos = {
  faisal: u('1663560454891-9bdbdaaed84d', 120),
  neha: u('1618245472177-2a74ad3b994a', 120),
  ananya: u('1624610261655-777af2f586d7', 120),
  harish: u('1667382136327-5f78dc5cf835', 120),
}

export const daysSince = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000))

export const findPerson = (id: string) => people.find((p) => p.id === id)
