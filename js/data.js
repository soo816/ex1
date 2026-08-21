// Data repository for Discover Jeju Attractions, Food, and Tourist Korean Phrases

const attractionsData = [
  {
    id: 1,
    category: "nature",
    nameEn: "Seongsan Ilchulbong (Sunrise Peak)",
    nameKo: "성산일출봉",
    addressKo: "제주특별자치도 서귀포시 성산읍 일출로 284-12",
    addressEn: "284-12 Ilchul-ro, Seongsan-eup, Seogwipo-si, Jeju-do",
    image: "assets/hero.jpg",
    tags: ["UNESCO Heritage", "Sunrise", "Volcanic Crater"],
    descEn: "A dramatic tuff cone formed by hydrovolcanic eruptions about 5,000 years ago. A UNESCO World Natural Heritage site with breathtaking ocean sunrise views.",
    descKo: "약 5천 년 전 수중 폭발로 생성된 유네스코 세계자연유산 성산일출봉입니다. 정상에서 바라보는 일출과 동해 바다 전경이 최고입니다.",
    fee: "5,000 KRW",
    hours: "07:00 - 19:00 (Closed 1st Monday of month)",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Seongsan+Ilchulbong"
  },
  {
    id: 2,
    category: "nature",
    nameEn: "Hyeopjae Beach & Biyangdo View",
    nameKo: "협재해수욕장",
    addressKo: "제주특별자치도 제주시 한림읍 한림로 329-10",
    addressEn: "329-10 Hallim-ro, Hallim-eup, Jeju-si, Jeju-do",
    image: "assets/beach.jpg",
    tags: ["Emerald Water", "White Sand", "Sunset Spot"],
    descEn: "Famous for its emerald green clear shallow waters, soft shell sand, and striking views of Biyangdo Island offshore. Perfect for families & swimming.",
    descKo: "에메랄드 빛 바다와 투명한 수심, 비양도가 바라보이는 환상적인 해변. 노을 명소로도 매우 유명합니다.",
    fee: "Free Entry",
    hours: "24 Hours (Swimming season July-Aug)",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Hyeopjae+Beach"
  },
  {
    id: 3,
    category: "food",
    nameEn: "Jeju Black Pork Street BBQ",
    nameKo: "제주 흑돼지 거리 / 맛집",
    addressKo: "제주특별자치도 제주시 관덕로15길 25 (건입동)",
    addressEn: "25 Gwandeok-ro 15-gil, Geonip-dong, Jeju-si, Jeju-do",
    image: "assets/food.jpg",
    tags: ["Local Culinary", "Grilled Pork", "Must-Eat"],
    descEn: "Jeju's signature culinary experience! Black pork is renowned for its intense flavor, juicy texture, and pairing with salted anchovy sauce (Meljot).",
    descKo: "제주 최고의 대표 먹거리! 쫄깃하고 고소한 육질의 흑돼지를 멜젓에 찍어 먹는 특별한 숯불구이 경험.",
    fee: "approx. 25,000 - 35,000 KRW / person",
    hours: "11:30 - 23:00",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Jeju+Black+Pork+Street"
  },
  {
    id: 4,
    category: "food",
    nameEn: "Seogwipo Tangerine Farm Experience",
    nameKo: "서귀포 감귤 농장 체험",
    addressKo: "제주특별자치도 서귀포시 남원읍 신례동로 67",
    addressEn: "67 Sinryedong-ro, Namwon-eup, Seogwipo-si, Jeju-do",
    image: "assets/tangerine.jpg",
    tags: ["Farm Picking", "Hallabong", "Photo Zone"],
    descEn: "Pick sweet Hallabong tangerines straight from golden orange orchards! Offers delicious citrus tea, juice, and memorable photo zones.",
    descKo: "달콤한 감귤과 한라봉을 직접 따고 맛보는 제주 대표 농장 체험. 신선한 귤주스와 사진 촬영 존 제공.",
    fee: "10,000 - 15,000 KRW (Includes picking bag)",
    hours: "09:00 - 18:00",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Jeju+Tangerine+Farm"
  },
  {
    id: 5,
    category: "culture",
    nameEn: "Jeju Haenyeo Diver Museum",
    nameKo: "해녀박물관",
    addressKo: "제주특별자치도 제주시 구좌읍 해녀박물관길 26",
    addressEn: "26 Haenyeobagmulgwan-gil, Gujwa-eup, Jeju-si, Jeju-do",
    image: "assets/hero.jpg",
    tags: ["UNESCO Intangible Cultural Heritage", "Female Divers"],
    descEn: "Learn the extraordinary story of Jeju's female free divers (Haenyeo) who harvest seafood without oxygen tanks. Recognised by UNESCO.",
    descKo: "산소통 없이 바닷속으로 물질하는 유네스코 인류무형문화유산 제주 해녀들의 삶과 역사를 기념하는 박물관입니다.",
    fee: "1,100 KRW",
    hours: "09:00 - 17:00 (Closed Mondays)",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Jeju+Haenyeo+Museum"
  },
  {
    id: 6,
    category: "nature",
    nameEn: "Hallasan National Park (Mount Halla)",
    nameKo: "한라산 국립공원",
    addressKo: "제주특별자치도 제주시 1100로 2070-61",
    addressEn: "2070-61 1100-ro, Jeju-si, Jeju-do",
    image: "assets/tangerine.jpg",
    tags: ["Highest Mountain in Korea", "Hiking", "Crater Lake"],
    descEn: "Shield volcano standing 1,947m above sea level at the center of Jeju Island. Features ancient alpine flora and crater lake Baengnokdam.",
    descKo: "대한민국 최고봉(1,947m) 한라산. 탐방로 예약을 통해 백록담 정상의 장엄한 전경과 사계절 자연을 만끽하세요.",
    fee: "Free Entry (Reservation required for Seongpanak/Gwaneumsa trail)",
    hours: "05:00 - 17:00 (Varies by season)",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Hallasan+National+Park"
  },
  {
    id: 7,
    category: "activity",
    nameEn: "Jeju Olle Trail Route 7 (Seogwipo Coast)",
    nameKo: "제주올레길 7코스 (외돌개-월평)",
    addressKo: "제주특별자치도 서귀포시 남성중로 40 (외돌개)",
    addressEn: "40 Namseongjung-ro, Seogwipo-si, Jeju-do",
    image: "assets/beach.jpg",
    tags: ["Trekking", "Coastal Walk", "Oedolgae Rock"],
    descEn: "The most iconic coastal trekking trail in Jeju passing through Oedolgae lonely rock, volcanic cliffs, and subtropical palm trees.",
    descKo: "외돌개와 주상절리, 비밀의 해안 절벽을 지나가는 제주올레 대표 명품 트레킹 코스.",
    fee: "Free",
    hours: "Daylight Hours Recommended",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Jeju+Olle+Course+7"
  },
  {
    id: 8,
    category: "culture",
    nameEn: "Jeju Stone Park & Dol Hareubang",
    nameKo: "제주돌문화공원",
    addressKo: "제주특별자치도 제주시 조천읍 남조로 2023",
    addressEn: "2023 Namjo-ro, Jocheon-eup, Jeju-si, Jeju-do",
    image: "assets/hero.jpg",
    tags: ["Mythology", "Basalt Sculptures", "Dol Hareubang"],
    descEn: "Immerse in Jeju's creation mythology, volcanic stone history, and iconic Dol Hareubang (Stone Grandfather) statues set in a vast natural park.",
    descKo: "제주의 창대 신화와 돌 하르방, 용암 동굴 돌 문화를 한눈에 감상할 수 있는 감성 국립 공원.",
    fee: "5,000 KRW",
    hours: "09:00 - 18:00 (Closed 1st Monday)",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Jeju+Stone+Park"
  }
];

const koreanPhrases = [
  {
    id: "p1",
    en: "Please take me to Seongsan Ilchulbong.",
    ko: "성산일출봉으로 가주세요.",
    phonetic: "[ Seong-san Il-chul-bong-eu-ro ga-ju-se-yo ]",
    ttsText: "성산일출봉으로 가주세요",
    category: "Taxi & Directions"
  },
  {
    id: "p2",
    en: "Please take me to Jeju Airport.",
    ko: "제주공항으로 가주세요.",
    phonetic: "[ Jeju-gong-hang-eu-ro ga-ju-se-yo ]",
    ttsText: "제주공항으로 가주세요",
    category: "Taxi & Directions"
  },
  {
    id: "p3",
    en: "How much is this?",
    ko: "이거 얼마예요?",
    phonetic: "[ I-geo eol-ma-ye-yo? ]",
    ttsText: "이거 얼마예요?",
    category: "Shopping & Dining"
  },
  {
    id: "p4",
    en: "Please recommend popular Black Pork menu.",
    ko: "맛있는 흑돼지 추천해주세요.",
    phonetic: "[ Ma-sin-neun heuk-dwae-ji chu-cheon-hae-ju-se-yo ]",
    ttsText: "맛있는 흑돼지 추천해주세요",
    category: "Shopping & Dining"
  },
  {
    id: "p5",
    en: "Where is the nearest bus stop?",
    ko: "가장 가까운 버스 정류장이 어디예요?",
    phonetic: "[ Ga-jang ga-kka-un beos-eu jeong-ryu-jang-i eo-di-ye-yo? ]",
    ttsText: "가장 가까운 버스 정류장이 어디예요?",
    category: "Transit"
  },
  {
    id: "p6",
    en: "Can I pay by credit card?",
    ko: "신용카드 되나요?",
    phonetic: "[ Sin-yong-ka-deu doe-na-yo? ]",
    ttsText: "신용카드 되나요?",
    category: "Payment"
  },
  {
    id: "p7",
    en: "Thank you so much!",
    ko: "정말 감사합니다!",
    phonetic: "[ Jeong-mal gam-sa-ham-ni-da! ]",
    ttsText: "정말 감사합니다!",
    category: "Polite Phrases"
  },
  {
    id: "p8",
    en: "Please help me! (Emergency)",
    ko: "도와주세요!",
    phonetic: "[ Do-wa-ju-se-yo! ]",
    ttsText: "도와주세요!",
    category: "Emergency"
  }
];

const regionalGourmetData = {
  north: {
    regionEn: "Jeju City & North Coast",
    regionKo: "제주시 & 북부 (공항 근처)",
    descEn: "Famous for Pork Noodle (Gogi Guksu), Black Pork Street, and Dongmun Traditional Night Market.",
    descKo: "고기국수 거리, 흑돼지 거리, 동문재래시장 야시장이 위치한 대표 식도락 지역.",
    spots: [
      {
        nameEn: "Jeju Pork Noodle Street (Gogi Guksu)",
        nameKo: "제주 고기국수 (자매국수/삼도동)",
        specialty: "Rich Pork Broth Noodles",
        addressKo: "제주특별자치도 제주시 탑동로 11",
        addressEn: "11 Tapdong-ro, Jeju-si, Jeju-do",
        desc: "Deep, savory pork bone broth served with thick noodles and tender sliced pork belly.",
        price: "9,000 - 11,000 KRW"
      },
      {
        nameEn: "Dongmun Night Market Seafood",
        nameKo: "동문재래시장 해산물 & 야시장",
        specialty: "Fresh Sashimi & Street Food",
        addressKo: "제주특별자치도 제주시 관덕로14길 20",
        addressEn: "20 Gwandeok-ro 14-gil, Jeju-si, Jeju-do",
        desc: "Taste fresh raw fish sets, abalone butter rice, and famous orange desserts at affordable prices.",
        price: "10,000 - 25,000 KRW"
      }
    ]
  },
  south: {
    regionEn: "Seogwipo & South Coast",
    regionKo: "서귀포시 & 남부 (중문관광단지)",
    descEn: "Renowned for Fresh Sea Bream, Seogwipo Olle Market, and Premium BBQ.",
    descKo: "서귀포 매일올레시장, 중문 흑돼지 구이, 옥돔구이와 해물탕이 유명한 남부 미식 지대.",
    spots: [
      {
        nameEn: "Seogwipo Everyday Olle Market",
        nameKo: "서귀포 매일올레시장",
        specialty: "Omegi Rice Cake & Fresh Fish",
        addressKo: "제주특별자치도 서귀포시 중앙로62번길 18",
        addressEn: "18 Jungang-ro 62beon-gil, Seogwipo-si, Jeju-do",
        desc: "Famous for traditional Omegi bean rice cakes, fried garlic chicken, and fresh yellowtail sashimi.",
        price: "5,000 - 30,000 KRW"
      },
      {
        nameEn: "Jungmun Seafood Hotpot",
        nameKo: "중문 해물뚝배기 & 갈치조림",
        specialty: "Seafood Stew & Braised Hairtail",
        addressKo: "제주특별자치도 서귀포시 중문관광로 32",
        addressEn: "32 Jungmungwangwang-ro, Seogwipo-si, Jeju-do",
        desc: "Loaded with fresh abalone, crab, and octopus simmered in a spicy soybean broth.",
        price: "18,000 - 45,000 KRW"
      }
    ]
  },
  east: {
    regionEn: "East Coast (Seongsan & Gujwa)",
    regionKo: "동부 (성산, 구좌, 조천)",
    descEn: "Famous for Sea Snail Noodle (Bomal), Haenyeo Seafood, and Gujwa Carrot Cake.",
    descKo: "성산일출봉 근처 보말칼국수, 해녀 해산물 뚝배기, 구좌 당근 카페거리가 위치한 동부.",
    spots: [
      {
        nameEn: "Seongsan Sea Snail Noodle (Bomal Kalguksu)",
        nameKo: "성산 보말칼국수 & 보말죽",
        specialty: "Sea Snail Soup & Porridge",
        addressKo: "제주특별자치도 서귀포시 성산읍 성산등용로 17",
        addressEn: "17 Seongsandengyong-ro, Seongsan-eup, Seogwipo-si",
        desc: "Healthy green seaweed and sea snail noodle soup packed with natural ocean flavors.",
        price: "10,000 - 13,000 KRW"
      },
      {
        nameEn: "Gujwa Carrot Dessert Cafe",
        nameKo: "구좌 당근 카페 (당근케이크)",
        specialty: "Organic Jeju Carrot Cake & Juice",
        addressKo: "제주특별자치도 제주시 구좌읍 해맞이해안로 1112",
        addressEn: "1112 Haemajihaean-ro, Gujwa-eup, Jeju-si",
        desc: "Gujwa is Korea's carrot capital! Enjoy rich organic carrot cakes overlooking the east sea.",
        price: "7,000 - 9,000 KRW"
      }
    ]
  },
  west: {
    regionEn: "West Coast (Aewol & Hallim)",
    regionKo: "서부 (애월, 한림, 대정)",
    descEn: "Famous for Aewol Cafe Street, Grilled Hairtail, and Sunset Seafood Dining.",
    descKo: "애월 한담 해안 산책로 카페거리, 협재 통갈치구이, 에메랄드 노울 뷰 디저트로 유명한 서부.",
    spots: [
      {
        nameEn: "Aewol Ocean View Cafe Street",
        nameKo: "애월 한담 카페거리",
        specialty: "Ocean View Coffee & Tangerine Tart",
        addressKo: "제주특별자치도 제주시 애월읍 애월북서길 56",
        addressEn: "56 Aewolbukseo-gil, Aewol-eup, Jeju-si",
        desc: "Enjoy specialty coffee and fruit desserts with front-row seats to Jeju's mesmerizing western sunset.",
        price: "6,500 - 12,000 KRW"
      },
      {
        nameEn: "Hyeopjae Whole Grilled Hairtail",
        nameKo: "협재 통갈치구이",
        specialty: "1-Meter Whole Salted Hairtail",
        addressKo: "제주특별자치도 제주시 한림읍 한림로 340",
        addressEn: "340 Hallim-ro, Hallim-eup, Jeju-si",
        desc: "A giant 1-meter long silver hairtail fish roasted with sea salt. Impressive visual and delicious taste.",
        price: "50,000 - 80,000 KRW (For 2-3 people)"
      }
    ]
  }
};

