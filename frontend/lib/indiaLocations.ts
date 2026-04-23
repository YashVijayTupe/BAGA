/**
 * indiaLocations.ts — India Location Data for BAGA
 * =================================================
 * Hierarchical location data: State → District → City/Village
 * Used for citizen and officer registration for jurisdiction binding.
 */

export interface LocationData {
  [state: string]: {
    [district: string]: string[]; // cities/villages
  };
}

export const INDIA_LOCATIONS: LocationData = {
  "Maharashtra": {
    "Mumbai": ["Andheri", "Borivali", "Dadar", "Kurla", "Bandra", "Worli", "Malad", "Goregaon"],
    "Pune": ["Shivajinagar", "Kothrud", "Hadapsar", "Pimpri", "Chinchwad", "Wakad", "Hinjewadi", "Katraj"],
    "Nashik": ["Panchvati", "Cidco", "Satpur", "Deolali", "Igatpuri", "Sinnar", "Niphad", "Dindori"],
    "Ahmednagar": ["Ahmednagar City", "Rahuri", "Sangamner", "Shrirampur", "Kopargaon", "Parner", "Shevgaon", "Pathardi"],
    "Nagpur": ["Nagpur City", "Kamptee", "Hingna", "Butibori", "Umred", "Katol", "Narkhed", "Savner"],
    "Aurangabad": ["Aurangabad City", "Paithan", "Gangapur", "Sillod", "Kannad", "Phulambri", "Vaijapur", "Khultabad"],
    "Solapur": ["Solapur City", "Akkalkot", "Barshi", "Mohol", "Pandharpur", "Mangalvedha", "Karmala", "Madha"],
    "Kolhapur": ["Kolhapur City", "Ichalkaranji", "Kagal", "Hatkanangle", "Shirol", "Panhala", "Shahuwadi", "Radhanagari"],
  },
  "Uttar Pradesh": {
    "Lucknow": ["Hazratganj", "Gomti Nagar", "Aliganj", "Alambagh", "Indira Nagar", "Rajajipuram", "Chinhat", "Kakori"],
    "Varanasi": ["Sigra", "Lanka", "Sarnath", "Cantt", "Ramnagar", "Shivpur", "Bhadaini", "Luxa"],
    "Agra": ["Tajganj", "Shahganj", "Firozabad", "Fatehpur Sikri", "Etmadpur", "Kheragarh", "Bah", "Saiyan"],
    "Prayagraj": ["Civil Lines", "Naini", "Phaphamau", "Karchhana", "Soraon", "Handia", "Meja", "Bara"],
    "Kanpur": ["Kanpur City", "Bilhaur", "Ghatampur", "Kalyanpur", "Kidwai Nagar", "Govind Nagar", "Kalpi", "Rasulabad"],
    "Gorakhpur": ["Gorakhpur City", "Campierganj", "Gola", "Sahjanwa", "Bansgaon", "Pharenda", "Nichlaul", "Nautanwa"],
    "Mathura": ["Mathura City", "Vrindavan", "Govardhan", "Barsana", "Nandgaon", "Mahavan", "Chhata", "Mat"],
    "Meerut": ["Meerut City", "Hapur", "Modinagar", "Khekra", "Baghpat", "Baraut", "Sardhana", "Mawana"],
  },
  "Rajasthan": {
    "Jaipur": ["Pink City", "Mansarovar", "Vaishali Nagar", "Malviya Nagar", "Sanganer", "Amer", "Chaksu", "Phagi"],
    "Jodhpur": ["Jodhpur City", "Phalodi", "Bilara", "Bhopalgarh", "Shergarh", "Luni", "Osian", "Tinwari"],
    "Udaipur": ["Udaipur City", "Nathdwara", "Rajsamand", "Salumber", "Girwa", "Mavli", "Vallabhnagar", "Gogunda"],
    "Ajmer": ["Ajmer City", "Pushkar", "Beawar", "Nasirabad", "Masuda", "Bhinai", "Kishangarh", "Sarwar"],
    "Kota": ["Kota City", "Baran", "Bundi", "Digod", "Ladpura", "Ramganj Mandi", "Pipalda", "Itawa"],
    "Bikaner": ["Bikaner City", "Nokha", "Lunkaransar", "Kolayat", "Pungal", "Bajju", "Khajuwala", "Sridungargarh"],
  },
  "Gujarat": {
    "Ahmedabad": ["Navrangpura", "Maninagar", "Satellite", "Bopal", "Vatva", "Naroda", "Gota", "Chandkheda"],
    "Surat": ["Surat City", "Bardoli", "Kamrej", "Olpad", "Palsana", "Mangrol", "Vyara", "Mandvi"],
    "Vadodara": ["Vadodara City", "Karjan", "Padra", "Dabhoi", "Savli", "Vaghodia", "Chhota Udaipur", "Nasvadi"],
    "Rajkot": ["Rajkot City", "Gondal", "Jetpur", "Wankaner", "Morbi", "Lodhika", "Jasdan", "Paddhari"],
    "Gandhinagar": ["Gandhinagar City", "Kalol", "Mansa", "Dehgam", "Unjha", "Kadi", "Vijapur", "Kheralu"],
    "Junagadh": ["Junagadh City", "Porbandar", "Veraval", "Keshod", "Manavadar", "Talala", "Kodinar", "Una"],
  },
  "Madhya Pradesh": {
    "Bhopal": ["Old Bhopal", "New Bhopal", "Berasia", "Huzur", "Phanda", "Sehore", "Raisen", "Vidisha"],
    "Indore": ["Indore City", "Sanwer", "Depalpur", "Mhow", "Hatod", "Manpur", "Sawar", "Gautampura"],
    "Gwalior": ["Gwalior City", "Bhitarwar", "Dabra", "Pichhore", "Bhander", "Seondha", "Karera", "Datia"],
    "Jabalpur": ["Jabalpur City", "Patan", "Sihora", "Shahpura", "Panagar", "Bargi", "Majholi", "Kundam"],
    "Ujjain": ["Ujjain City", "Nagda", "Khachrod", "Mahidpur", "Tarana", "Ghattia", "Badnagar", "Barnagar"],
  },
  "Karnataka": {
    "Bengaluru Urban": ["Whitefield", "Electronic City", "Koramangala", "Indiranagar", "Jayanagar", "Rajajinagar", "Yeshwanthpur", "Malleshwaram"],
    "Mysuru": ["Mysuru City", "Hunsur", "Periyapatna", "KR Nagara", "TN Pura", "Nanjangud", "Heggadadevanakote", "Varuna"],
    "Belagavi": ["Belagavi City", "Chikkodi", "Athani", "Gokak", "Raibag", "Mudalgi", "Hukkeri", "Savadatti"],
    "Ballari": ["Ballari City", "Hospet", "Sandur", "Siruguppa", "Hagaribommanahalli", "Kudligi", "Kampli", "Hagari"],
    "Dharwad": ["Dharwad City", "Hubli", "Kundgol", "Kalghatgi", "Navalgund", "Annigeri", "Ron", "Gadag"],
  },
  "Tamil Nadu": {
    "Chennai": ["Adyar", "Tambaram", "Ambattur", "Avadi", "Sholinganallur", "Perambur", "Kodambakkam", "Guindy"],
    "Coimbatore": ["Coimbatore City", "Mettupalayam", "Pollachi", "Valparai", "Annur", "Kinathukadavu", "Palladam", "Sulur"],
    "Madurai": ["Madurai City", "Melur", "Vadipatti", "Peraiyur", "Tirumangalam", "Usilampatti", "Thirparankundram", "Vilangudi"],
    "Salem": ["Salem City", "Attur", "Mettur", "Omalur", "Edappadi", "Gangavalli", "Thalaivasal", "Vazhapadi"],
    "Tirunelveli": ["Tirunelveli City", "Palayamkottai", "Alangulam", "Nanguneri", "Radhapuram", "Ambasamudram", "Shencottai", "Cheranmahadevi"],
  },
  "West Bengal": {
    "Kolkata": ["Park Street", "Esplanade", "Howrah", "Dum Dum", "Barasat", "Barrackpore", "Serampore", "Chandannagar"],
    "North 24 Parganas": ["Barasat", "Basirhat", "Bangaon", "Habra", "Ashokenagar", "Barrackpore", "Titagarh", "Kalyani"],
    "South 24 Parganas": ["Alipore", "Diamond Harbour", "Kakdwip", "Sagar", "Mathurapur", "Joynagar", "Kultali", "Falta"],
    "Murshidabad": ["Berhampore", "Jiaganj", "Raghunathganj", "Lalbag", "Suti", "Farakka", "Nawda", "Bharatpur"],
    "Bardhaman": ["Bardhaman City", "Asansol", "Durgapur", "Raniganj", "Kulti", "Jamuria", "Pandabeswar", "Ausgram"],
  },
  "Bihar": {
    "Patna": ["Patna City", "Danapur", "Phulwari", "Barh", "Bakhtiyarpur", "Masaurhi", "Paliganj", "Bikram"],
    "Gaya": ["Gaya City", "Bodhgaya", "Sherghati", "Nawada", "Jehanabad", "Arwal", "Tikari", "Manpur"],
    "Muzaffarpur": ["Muzaffarpur City", "Sitamarhi", "Sheohar", "Vaishali", "Samastipur", "Motihari", "Bettiah", "Hajipur"],
    "Bhagalpur": ["Bhagalpur City", "Banka", "Jamui", "Lakhisarai", "Supaul", "Saharsa", "Madhepura", "Khagaria"],
  },
  "Punjab": {
    "Ludhiana": ["Ludhiana City", "Raikot", "Jagraon", "Samrala", "Khanna", "Machhiwara", "Doraha", "Payal"],
    "Amritsar": ["Amritsar City", "Ajnala", "Baba Bakala", "Jandiala", "Majitha", "Attari", "Rayya", "Lopoke"],
    "Jalandhar": ["Jalandhar City", "Nakodar", "Shahkot", "Phillaur", "Nurmahal", "Kartarpur", "Bhogpur", "Goraya"],
    "Patiala": ["Patiala City", "Rajpura", "Nabha", "Sangrur", "Fatehgarh Sahib", "Ghanaur", "Sanaur", "Shutrana"],
    "Bathinda": ["Bathinda City", "Talwandi Sabo", "Maur", "Rampura Phul", "Nathana", "Goniana", "Bhagta Bhai Ka", "Sangat"],
  },
  "Telangana": {
    "Hyderabad": ["Secunderabad", "Banjara Hills", "Jubilee Hills", "LB Nagar", "Kukatpally", "Uppal", "Dilsukhnagar", "Mehdipatnam"],
    "Warangal": ["Warangal City", "Hanamkonda", "Kazipet", "Jangaon", "Mahbubnagar", "Nalgonda", "Suryapet", "Miryalaguda"],
    "Karimnagar": ["Karimnagar City", "Peddapalli", "Mancherial", "Nirmal", "Nizamabad", "Jagtial", "Rajanna Sircilla", "Kamareddy"],
    "Khammam": ["Khammam City", "Bhadrachalam", "Kothagudem", "Palwancha", "Yellandu", "Burgampahad", "Sattupally", "Madhira"],
  },
  "Andhra Pradesh": {
    "Visakhapatnam": ["Visakhapatnam City", "Anakapalle", "Bheemunipatnam", "Paderu", "Narsipatnam", "Chodavaram", "Payakaraopeta", "Araku"],
    "Vijayawada": ["Vijayawada City", "Machilipatnam", "Eluru", "Gudivada", "Nuzvid", "Kaikalur", "Gannavaram", "Unguturu"],
    "Guntur": ["Guntur City", "Tenali", "Narasaraopet", "Bapatla", "Chirala", "Ongole", "Vinukonda", "Mangalagiri"],
    "Tirupati": ["Tirupati City", "Chittoor", "Madanapalle", "Srikalahasti", "Puttur", "Pakala", "Piler", "Punganur"],
  },
};

export const INDIA_STATES = Object.keys(INDIA_LOCATIONS).sort();

export function getDistricts(state: string): string[] {
  if (!state || !INDIA_LOCATIONS[state]) return [];
  return Object.keys(INDIA_LOCATIONS[state]).sort();
}

export function getCities(state: string, district: string): string[] {
  if (!state || !district || !INDIA_LOCATIONS[state]?.[district]) return [];
  return INDIA_LOCATIONS[state][district].sort();
}
